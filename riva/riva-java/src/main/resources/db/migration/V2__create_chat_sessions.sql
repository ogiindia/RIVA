CREATE TABLE chat_sessions (
    id          UUID PRIMARY KEY,
    user_id     VARCHAR(255) NOT NULL,
    case_id     VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL,
    CONSTRAINT uq_chat_session_user_case UNIQUE (user_id, case_id)
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX idx_chat_sessions_case_id ON chat_sessions (case_id);
