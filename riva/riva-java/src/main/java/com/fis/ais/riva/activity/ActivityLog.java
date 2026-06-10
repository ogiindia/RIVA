package com.fis.ais.riva.activity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Entity
@Table(name = "activity_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActivityAction action;

    private String caseId;

    @Column(columnDefinition = "TEXT")
    private String attributesJson;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * Create an ActivityLog from an ActivityEvent.
     */
    public static ActivityLog from(ActivityEvent event) {
        String attrsJson = null;
        if (event.attributes() != null && !event.attributes().isEmpty()) {
            try {
                attrsJson = MAPPER.writeValueAsString(event.attributes());
            } catch (JsonProcessingException ex) {
                attrsJson = "{\"error\":\"serialization_failed\"}";
            }
        }

        return ActivityLog.builder()
                .userId(event.userId())
                .action(event.action())
                .caseId(event.caseId())
                .attributesJson(attrsJson)
                .createdAt(event.occurredAt())
                .build();
    }
}
