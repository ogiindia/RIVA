package com.fis.ais.riva.chat.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        String role,
        String content,
        String status,
        Instant createdAt
) {}
