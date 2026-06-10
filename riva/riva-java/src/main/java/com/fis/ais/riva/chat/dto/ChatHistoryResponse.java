package com.fis.ais.riva.chat.dto;

import java.util.List;

public record ChatHistoryResponse(
        String caseId,
        List<ChatMessageResponse> messages
) {}
