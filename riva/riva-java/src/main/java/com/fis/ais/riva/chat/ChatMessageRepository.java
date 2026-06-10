package com.fis.ais.riva.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findByChatSessionIdOrderByCreatedAtAsc(UUID chatSessionId);

    /**
     * Fetch the most recent messages for a chat session (newest first).
     * Used for building LLM context window.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.chatSession.id = :chatSessionId ORDER BY m.createdAt DESC")
    List<ChatMessage> findRecentMessages(UUID chatSessionId, Pageable pageable);
}
