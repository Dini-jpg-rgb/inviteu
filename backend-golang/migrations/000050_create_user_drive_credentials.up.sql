CREATE TABLE user_drive_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    google_sub VARCHAR(255) NOT NULL,
    google_email VARCHAR(255),
    encrypted_refresh_token BYTEA NOT NULL,
    scopes VARCHAR(255) NOT NULL,
    drive_folder_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'connected',
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_drive_credentials_user_id
        UNIQUE (user_id),

    CONSTRAINT fk_user_drive_credentials_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_user_drive_credentials_status
        CHECK (status IN ('connected', 'revoked'))
);
