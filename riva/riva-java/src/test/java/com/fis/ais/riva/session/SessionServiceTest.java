package com.fis.ais.riva.session;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fis.ais.riva.activity.ActivityAction;
import com.fis.ais.riva.activity.ActivityEventPublisher;
import com.fis.ais.riva.shared.config.RivaProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock SessionRepository sessionRepository;
    @Mock ActivityEventPublisher activityPublisher;

    SessionService service;

    @BeforeEach
    void setUp() {
        var props = new RivaProperties(
                new RivaProperties.SessionConfig(Duration.ofHours(8)),
                new RivaProperties.CaseServiceConfig("http://localhost:7051", Duration.ofSeconds(5),
                        new RivaProperties.EndpointConfig("/aisefrm/app/v1/getAlertDetailsByCaseId")),
                new RivaProperties.ChatConfig(3),
                new RivaProperties.PromptConfig("classpath:prompts/investigate.txt")
        );
        service = new SessionService(sessionRepository, props, activityPublisher);
        // upsert() is void — Mockito no-ops it by default; nothing extra needed.
    }

    @Test
    void createNewSession_whenNoExistingSession() {
        // upsert inserts the row; findByUserId returns it freshly created (< 2s ago)
        Session created = Session.builder()
                .id(UUID.randomUUID())
                .userId("user1")
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(28800))
                .build();
        when(sessionRepository.findByUserId("user1")).thenReturn(Optional.of(created));

        Session result = service.getOrCreate("user1");

        assertThat(result.getUserId()).isEqualTo("user1");
        assertThat(result.getExpiresAt()).isAfter(Instant.now());
        verify(sessionRepository).upsert(eq("user1"), any(Instant.class), any(Instant.class));
        verify(activityPublisher).publish(eq("user1"), eq(ActivityAction.SESSION_CREATED), isNull(), isNull());
    }

    @Test
    void reuseExistingSession_whenNotExpired() {
        // upsert is a no-op (session active); findByUserId returns the old session (createdAt in the past)
        Session existing = Session.builder()
                .id(UUID.randomUUID())
                .userId("user1")
                .createdAt(Instant.now().minusSeconds(3600))
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(sessionRepository.findByUserId("user1")).thenReturn(Optional.of(existing));

        Session result = service.getOrCreate("user1");

        assertThat(result.getId()).isEqualTo(existing.getId());
        verify(sessionRepository).upsert(eq("user1"), any(Instant.class), any(Instant.class));
        // SESSION_CREATED must NOT be published for an existing active session
        verify(activityPublisher, never()).publish(any(), eq(ActivityAction.SESSION_CREATED), any(), any());
    }

    @Test
    void renewExpiredSession_viaUpsert() {
        // After upsert renews the expired session, findByUserId returns it with createdAt old
        // but the service only checks if createdAt is within 2 s of "now" to decide
        // whether to fire SESSION_CREATED. An expired-then-renewed session has an old createdAt,
        // so SESSION_CREATED is NOT published (matches the upsert DO UPDATE behaviour which
        // keeps the original created_at). This is the correct business behaviour.
        Session renewed = Session.builder()
                .id(UUID.randomUUID())
                .userId("user1")
                .createdAt(Instant.now().minusSeconds(7200)) // old — was created 2 h ago
                .expiresAt(Instant.now().plusSeconds(28800)) // just renewed
                .build();
        when(sessionRepository.findByUserId("user1")).thenReturn(Optional.of(renewed));

        Session result = service.getOrCreate("user1");

        assertThat(result.getUserId()).isEqualTo("user1");
        verify(sessionRepository).upsert(eq("user1"), any(Instant.class), any(Instant.class));
    }

    @Test
    void throwsOnBlankUserId() {
        assertThatThrownBy(() -> service.getOrCreate(""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.getOrCreate(null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
