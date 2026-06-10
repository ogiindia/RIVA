CREATE TABLE activity_log (
    id              UUID PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    action          VARCHAR(50) NOT NULL,
    case_id         VARCHAR(255),
    attributes_json TEXT,
    created_at      TIMESTAMP NOT NULL
);

CREATE INDEX idx_activity_log_user ON activity_log (user_id);
CREATE INDEX idx_activity_log_created ON activity_log (created_at DESC);
