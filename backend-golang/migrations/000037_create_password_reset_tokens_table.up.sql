
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    token_hash VARCHAR(255) NOT NULL UNIQUE,

    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_password_reset_token_expiry
        CHECK (expires_at > created_at),

    CONSTRAINT chk_password_reset_token_used
        CHECK (used_at IS NULL OR used_at >= created_at)
);

CREATE INDEX idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);

CREATE INDEX idx_password_reset_tokens_expires_at
    ON password_reset_tokens(expires_at);