package com.fis.ais.riva.chat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClient.ChatClientRequestSpec;
import org.springframework.ai.chat.client.ChatClient.StreamResponseSpec;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import com.fis.ais.riva.activity.ActivityAction;
import com.fis.ais.riva.activity.ActivityEventPublisher;
import com.fis.ais.riva.casedata.CaseData;
import com.fis.ais.riva.casedata.CaseDataService;
import com.fis.ais.riva.chat.dto.ChatHistoryResponse;
import com.fis.ais.riva.shared.config.RivaProperties;
import reactor.core.publisher.Flux;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class ChatServiceTest {

    @Mock ChatSessionRepository chatSessionRepository;
    @Mock ChatMessageRepository chatMessageRepository;
    @Mock CaseDataService caseDataService;
    @Mock ChatClient.Builder chatClientBuilder;
    @Mock ChatClient chatClient;
    @Mock ActivityEventPublisher activityPublisher;
    @Mock PlatformTransactionManager txManager;

    // Mocks for streaming chain
    @Mock ChatClientRequestSpec requestSpec;
    @Mock StreamResponseSpec streamResponseSpec;

    ChatService chatService;
    RivaProperties properties;

    @BeforeEach
    void setUp() {
        properties = new RivaProperties(
                new RivaProperties.SessionConfig(Duration.ofHours(8)),
                new RivaProperties.CaseServiceConfig("http://localhost:7051", Duration.ofSeconds(5),
                        new RivaProperties.EndpointConfig("/aisefrm/app/v1/getAlertDetailsByCaseId")),
                new RivaProperties.ChatConfig(3),
                new RivaProperties.PromptConfig("classpath:prompts/investigate.txt")
        );

        when(chatClientBuilder.build()).thenReturn(chatClient);
        when(txManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());

        chatService = new ChatService(
                chatSessionRepository, chatMessageRepository, caseDataService,
                chatClientBuilder, properties, activityPublisher, txManager,
                new ClassPathResource("prompts/investigate.txt")
        );
    }

    @Test
    void streamChat_createsSessionAndStreams() {
        // Given
        UUID sessionId = UUID.randomUUID();
        ChatSession session = ChatSession.builder()
                .id(sessionId)
                .userId("user1")
                .caseId("case-1")
                .build();
        when(chatSessionRepository.findByUserIdAndCaseId("user1", "case-1"))
                .thenReturn(Optional.empty());
        when(chatSessionRepository.save(any(ChatSession.class))).thenReturn(session);
        when(caseDataService.fetch("case-1"))
                .thenReturn(new CaseData("case-1", "alert-details", "{\"test\":\"data\"}"));
        when(chatMessageRepository.findRecentMessages(eq(sessionId), any(Pageable.class)))
                .thenReturn(List.of());

        // Mock the Spring AI streaming chain
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.messages(anyList())).thenReturn(requestSpec);
        when(requestSpec.stream()).thenReturn(streamResponseSpec);
        when(streamResponseSpec.content()).thenReturn(Flux.just("Hello", " World"));

        // Mock transaction for persistence callback
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        // When
        List<String> chunks = chatService.streamChat("user1", "case-1", "Explain this case")
                .collectList()
                .block();

        // Then
        assertThat(chunks).containsExactly("Hello", " World");
        verify(caseDataService).fetch("case-1");
        verify(activityPublisher).publish(eq("user1"), eq(ActivityAction.CHAT_MESSAGE_SENT), eq("case-1"), any());
        verify(activityPublisher).publish(eq("user1"), eq(ActivityAction.CASE_DATA_FETCHED), eq("case-1"), isNull());
    }

    @Test
    void getHistory_returnsEmptyForNonexistentSession() {
        when(chatSessionRepository.findByUserIdAndCaseId("user1", "case-1"))
                .thenReturn(Optional.empty());

        ChatHistoryResponse response = chatService.getHistory("user1", "case-1");

        assertThat(response.caseId()).isEqualTo("case-1");
        assertThat(response.messages()).isEmpty();
    }

    @Test
    void getHistory_returnsMessagesForExistingSession() {
        UUID sessionId = UUID.randomUUID();
        ChatSession session = ChatSession.builder()
                .id(sessionId)
                .userId("user1")
                .caseId("case-1")
                .build();
        ChatMessage msg1 = ChatMessage.builder()
                .id(UUID.randomUUID())
                .chatSession(session)
                .role(MessageRole.USER)
                .content("Hello")
                .status(MessageStatus.COMPLETED)
                .createdAt(Instant.now())
                .build();
        ChatMessage msg2 = ChatMessage.builder()
                .id(UUID.randomUUID())
                .chatSession(session)
                .role(MessageRole.ASSISTANT)
                .content("Hi there")
                .status(MessageStatus.COMPLETED)
                .createdAt(Instant.now())
                .build();

        when(chatSessionRepository.findByUserIdAndCaseId("user1", "case-1"))
                .thenReturn(Optional.of(session));
        when(chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId))
                .thenReturn(List.of(msg1, msg2));

        ChatHistoryResponse response = chatService.getHistory("user1", "case-1");

        assertThat(response.messages()).hasSize(2);
        assertThat(response.messages().get(0).role()).isEqualTo("USER");
        assertThat(response.messages().get(0).content()).isEqualTo("Hello");
        assertThat(response.messages().get(1).role()).isEqualTo("ASSISTANT");
        assertThat(response.messages().get(1).content()).isEqualTo("Hi there");
    }
}
