package com.fis.ais.riva.chat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.fis.ais.riva.activity.ActivityAction;
import com.fis.ais.riva.activity.ActivityEventPublisher;
import com.fis.ais.riva.casedata.CaseData;
import com.fis.ais.riva.casedata.CaseDataService;
import com.fis.ais.riva.chat.dto.ChatHistoryResponse;
import com.fis.ais.riva.chat.dto.ChatMessageResponse;
import com.fis.ais.riva.shared.config.RivaProperties;
import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CaseDataService caseDataService;
    private final ChatClient chatClient;
    private final RivaProperties properties;
    private final ActivityEventPublisher activityPublisher;
    private final TransactionTemplate txTemplate;
    private final String systemPromptTemplate;

    public ChatService(ChatSessionRepository chatSessionRepository,
                       ChatMessageRepository chatMessageRepository,
                       CaseDataService caseDataService,
                       ChatClient.Builder chatClientBuilder,
                       RivaProperties properties,
                       ActivityEventPublisher activityPublisher,
                       PlatformTransactionManager txManager,
                       @Value("${riva.prompt.action-template}") Resource promptResource) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.caseDataService = caseDataService;
        this.chatClient = chatClientBuilder.build();
        this.properties = properties;
        this.activityPublisher = activityPublisher;
        this.txTemplate = new TransactionTemplate(txManager);

        try {
            this.systemPromptTemplate = new String(promptResource.getInputStream().readAllBytes());
            log.info("Loaded system prompt template ({} chars)", systemPromptTemplate.length());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to load prompt template: " + promptResource, ex);
        }
    }

    // ── Streaming chat ──────────────────────────────────────────────────

    /**
     * Process a user message: fetch case data, build prompt with history,
     * and return a streaming Flux of LLM response chunks.
     *
     * The user message is persisted eagerly (in the calling thread's transaction).
     * The assistant response is persisted after the stream completes/fails
     * using an explicit TransactionTemplate (safe from Reactor threads).
     */
    public Flux<String> streamChat(String userId, String caseId, String userMessage) {
        log.info("Chat: userId={} caseId={} msgLen={}", userId, caseId, userMessage.length());

        // 1. Get or create chat session and persist user message (explicit transaction)
        ChatSession session = txTemplate.execute(txStatus -> {
            ChatSession s = getOrCreateSession(userId, caseId);
            s.addMessage(MessageRole.USER, userMessage, MessageStatus.COMPLETED);
            return chatSessionRepository.save(s);
        });

        activityPublisher.publish(userId, ActivityAction.CHAT_MESSAGE_SENT, caseId,
                Map.of("messageLength", userMessage.length()));

        // 2. Fetch case data via strategy
        CaseData caseData;
        try {
            caseData = caseDataService.fetch(caseId);
            activityPublisher.publish(userId, ActivityAction.CASE_DATA_FETCHED, caseId, null);
        } catch (Exception ex) {
            activityPublisher.publish(userId, ActivityAction.CASE_DATA_FETCH_FAILED, caseId,
                    Map.of("error", ex.getMessage()));
            throw ex;
        }

        // 3. Build conversation messages for Spring AI
        List<Message> messages = buildMessages(session, caseData, userMessage);

        // 4. Stream from LLM with safe persistence callbacks
        StringBuilder buffer = new StringBuilder();
        final UUID sessionId = session.getId();

        return chatClient.prompt()
                .messages(messages)
                .stream()
                .content()
                .doOnNext(buffer::append)
                .doOnComplete(() -> {
                    String fullResponse = buffer.toString();
                    persistAssistantMessage(sessionId, fullResponse, MessageStatus.COMPLETED);
                    activityPublisher.publish(userId, ActivityAction.LLM_STREAM_COMPLETED, caseId,
                            Map.of("responseLength", fullResponse.length()));
                    log.info("Chat completed: userId={} caseId={} responseLen={}",
                            userId, caseId, fullResponse.length());
                })
                .doOnCancel(() -> {
                    String partial = buffer.toString();
                    if (!partial.isBlank()) {
                        persistAssistantMessage(sessionId, partial, MessageStatus.INTERRUPTED);
                        activityPublisher.publish(userId, ActivityAction.LLM_STREAM_INTERRUPTED, caseId,
                                Map.of("partialLength", partial.length()));
                        log.info("Chat interrupted: userId={} caseId={} partialLen={}",
                                userId, caseId, partial.length());
                    }
                })
                .doOnError(ex -> {
                    String partial = buffer.toString();
                    if (!partial.isBlank()) {
                        persistAssistantMessage(sessionId, partial, MessageStatus.FAILED);
                    }
                    activityPublisher.publish(userId, ActivityAction.LLM_STREAM_FAILED, caseId,
                            Map.of("error", ex.getMessage()));
                    log.error("Chat failed: userId={} caseId={}", userId, caseId, ex);
                });
    }

    // ── History ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ChatHistoryResponse getHistory(String userId, String caseId) {
        activityPublisher.publish(userId, ActivityAction.CHAT_HISTORY_VIEWED, caseId, null);

        return chatSessionRepository.findByUserIdAndCaseId(userId, caseId)
                .map(session -> {
                    List<ChatMessageResponse> msgs = chatMessageRepository
                            .findByChatSessionIdOrderByCreatedAtAsc(session.getId())
                            .stream()
                            .map(this::toResponse)
                            .toList();
                    return new ChatHistoryResponse(caseId, msgs);
                })
                .orElse(new ChatHistoryResponse(caseId, List.of()));
    }

    // ── Internals ───────────────────────────────────────────────────────

    private ChatSession getOrCreateSession(String userId, String caseId) {
        return chatSessionRepository.findByUserIdAndCaseId(userId, caseId)
                .map(existing -> {
                    existing.touch();
                    return existing;
                })
                .orElseGet(() -> {
                    var session = ChatSession.builder()
                            .userId(userId)
                            .caseId(caseId)
                            .build();
                    return chatSessionRepository.save(session);
                });
    }

    private List<Message> buildMessages(ChatSession session, CaseData caseData, String currentMessage) {
        List<Message> messages = new ArrayList<>();

        // System prompt with case context injected
        String systemPrompt = systemPromptTemplate + "\n\nCase Data:\n" + caseData.rawJson();
        messages.add(new SystemMessage(systemPrompt));

        // Add conversation history (last N pairs)
        int windowSize = properties.chat().historyWindowPairs() * 2;
        List<ChatMessage> recent = chatMessageRepository.findRecentMessages(
                session.getId(), PageRequest.of(0, windowSize + 1));
        Collections.reverse(recent); // newest-first -> chronological

        // Exclude the current user message (already persisted at the end)
        List<ChatMessage> history = recent.stream()
                .filter(m -> !m.getContent().equals(currentMessage) || m.getRole() != MessageRole.USER)
                .toList();

        for (ChatMessage m : history) {
            switch (m.getRole()) {
                case USER -> messages.add(new UserMessage(m.getContent()));
                case ASSISTANT -> messages.add(new AssistantMessage(m.getContent()));
                default -> {} // skip SYSTEM from history
            }
        }

        // Current user message
        messages.add(new UserMessage(currentMessage));

        return messages;
    }

    /**
     * Persists the assistant message using an explicit transaction.
     * Safe to call from Reactor scheduler threads (doOnComplete, doOnCancel, doOnError).
     */
    private void persistAssistantMessage(UUID sessionId, String content, MessageStatus status) {
        try {
            txTemplate.executeWithoutResult(txStatus -> {
                ChatSession session = chatSessionRepository.findById(sessionId).orElseThrow();
                session.addMessage(MessageRole.ASSISTANT, content, status);
                chatSessionRepository.save(session);
            });
        } catch (Exception ex) {
            log.error("Failed to persist assistant message for session={}", sessionId, ex);
        }
    }

    private ChatMessageResponse toResponse(ChatMessage msg) {
        return new ChatMessageResponse(
                msg.getId(),
                msg.getRole().name(),
                msg.getContent(),
                msg.getStatus().name(),
                msg.getCreatedAt()
        );
    }
}
