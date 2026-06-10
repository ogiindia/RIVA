CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY,
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at      TIMESTAMP NOT NULL
);

CREATE INDEX idx_chat_messages_session ON chat_messages (chat_session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages (chat_session_id, created_at);
