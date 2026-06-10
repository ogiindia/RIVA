CREATE TABLE sessions (
    id          UUID PRIMARY KEY,
    user_id     VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP NOT NULL,
    expires_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
