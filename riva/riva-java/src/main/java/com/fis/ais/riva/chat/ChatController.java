package com.fis.ais.riva.chat;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fis.ais.riva.chat.dto.ChatHistoryResponse;
import com.fis.ais.riva.chat.dto.ChatMessageRequest;

@RestController
@RequestMapping("/api/chat")
@Validated
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private static final long SSE_TIMEOUT = 5 * 60 * 1000L; // 5 minutes

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Send a message and stream the LLM response as Server-Sent Events.
     */
    @PostMapping(value = "/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(@Validated @RequestBody ChatMessageRequest request) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        chatService.streamChat(request.userId(), request.caseId(), request.message())
                .subscribe(
                        chunk -> {
                            try {
                                emitter.send(SseEmitter.event().data(chunk));
                            } catch (IOException ex) {
                                log.debug("SSE send failed (client likely disconnected): {}", ex.getMessage());
                                emitter.completeWithError(ex);
                            }
                        },
                        error -> {
                            log.error("Stream error for userId={} caseId={}: {}",
                                    request.userId(), request.caseId(), error.getMessage());
                            emitter.completeWithError(error);
                        },
                        emitter::complete
                );

        // Handle client disconnect
        emitter.onTimeout(emitter::complete);
        emitter.onError(ex -> log.debug("SSE connection error: {}", ex.getMessage()));

        return emitter;
    }

    /**
     * Get chat history for a user + case.
     */
    @GetMapping("/{caseId}/messages")
    public ResponseEntity<ChatHistoryResponse> getHistory(
            @PathVariable String caseId,
            @RequestParam String userId) {
        return ResponseEntity.ok(chatService.getHistory(userId, caseId));
    }
}
