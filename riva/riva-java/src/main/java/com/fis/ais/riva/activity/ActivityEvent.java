package com.fis.ais.riva.activity;

import java.time.Instant;
import java.util.Map;

import jakarta.annotation.Nullable;

/**
 * Domain event representing a user activity.
 * Published via Spring's ApplicationEventPublisher and consumed by listeners.
 */
public record ActivityEvent(
        String userId,
        ActivityAction action,
        @Nullable String caseId,
        @Nullable Map<String, Object> attributes,
        Instant occurredAt
) {
    public ActivityEvent(String userId, ActivityAction action, String caseId, Map<String, Object> attributes) {
        this(userId, action, caseId, attributes, Instant.now());
    }
}
