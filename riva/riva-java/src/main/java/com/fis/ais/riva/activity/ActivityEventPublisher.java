package com.fis.ais.riva.activity;

import java.util.Map;

import jakarta.annotation.Nullable;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Helper for publishing activity events.
 * Keeps the event construction out of business services.
 */
@Component
public class ActivityEventPublisher {

    private final ApplicationEventPublisher publisher;

    public ActivityEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void publish(String userId, ActivityAction action,
                        @Nullable String caseId,
                        @Nullable Map<String, Object> attributes) {
        publisher.publishEvent(new ActivityEvent(userId, action, caseId, attributes));
    }
}
