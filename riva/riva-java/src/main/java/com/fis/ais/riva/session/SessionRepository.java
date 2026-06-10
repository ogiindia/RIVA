package com.fis.ais.riva.session;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByUserId(String userId);

    /**
     * Atomic upsert — inserts a new session or, on conflict with the unique
     * user_id constraint, updates expires_at if the existing session is expired.
     * Active sessions are left untouched (DO UPDATE ... WHERE expired).
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO sessions (id, user_id, created_at, last_active_at, expires_at)
            VALUES (gen_random_uuid(), :userId, :now, :now, :expiresAt)
            ON CONFLICT (user_id) DO UPDATE
                SET expires_at     = EXCLUDED.expires_at,
                    last_active_at = EXCLUDED.last_active_at
                WHERE sessions.expires_at < NOW()
            """)
    void upsert(@Param("userId") String userId,
                @Param("now") Instant now,
                @Param("expiresAt") Instant expiresAt);
}
