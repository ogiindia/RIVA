package com.fis.ais.riva.session;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fis.ais.riva.activity.ActivityAction;
import com.fis.ais.riva.activity.ActivityEventPublisher;
import com.fis.ais.riva.shared.config.RivaProperties;

@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;
    private final RivaProperties properties;
    private final ActivityEventPublisher activityPublisher;

    public SessionService(SessionRepository sessionRepository,
                          RivaProperties properties,
                          ActivityEventPublisher activityPublisher) {
        this.sessionRepository = sessionRepository;
        this.properties = properties;
        this.activityPublisher = activityPublisher;
    }

    /**
     * Find or create a session for the given userId.
     *
     * Uses an upsert (INSERT ... ON CONFLICT DO UPDATE) via a native query so
     * concurrent requests from the same user — e.g. React StrictMode double
     * effect invocation — are handled atomically without a duplicate-key error.
     *
     * If the session is expired it is renewed in-place (expiresAt updated).
     */
    @Transactional
    public Session getOrCreate(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        Instant now       = Instant.now();
        Instant expiresAt = now.plus(properties.session().maxAge());

        // Atomic upsert — safe under concurrent calls for the same userId
        sessionRepository.upsert(userId, now, expiresAt);

        Session session = sessionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Session not found after upsert for userId=" + userId));

        if (session.getCreatedAt().isAfter(now.minusSeconds(2))) {
            // Session was just created (within 2 s tolerance)
            activityPublisher.publish(userId, ActivityAction.SESSION_CREATED, null, null);
            log.info("Created new session for userId={}", userId);
        } else {
            log.debug("Reusing session for userId={}", userId);
        }

        return session;
    }
}
