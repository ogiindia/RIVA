package com.fis.ais.riva.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageRequest(
        @NotBlank String userId,
        @NotBlank String caseId,
        @NotBlank String message
) {}
