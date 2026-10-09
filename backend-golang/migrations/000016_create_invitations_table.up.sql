
CREATE TABLE invitations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP,
    expired_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitations_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitations_template
        FOREIGN KEY (template_id)
        REFERENCES templates(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_invitations_expiration
        CHECK (
            expired_at IS NULL
            OR published_at IS NULL
            OR expired_at >= published_at
        )
);