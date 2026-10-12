
CREATE TABLE guestbook_messages (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL,
    guest_id BIGINT,
    guest_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    moderated_by BIGINT,
    moderated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_guestbook_messages_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_guestbook_messages_guest
        FOREIGN KEY (guest_id)
        REFERENCES guests(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_guestbook_messages_moderator
        FOREIGN KEY (moderated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT check_guestbook_messages_status
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected',
                'hidden'
            )
        ),

    CONSTRAINT check_guestbook_messages_content
        CHECK (LENGTH(TRIM(message)) > 0)
);

CREATE INDEX idx_guestbook_messages_invitation_id
    ON guestbook_messages(invitation_id);

CREATE INDEX idx_guestbook_messages_status
    ON guestbook_messages(status);

CREATE INDEX idx_guestbook_messages_created_at
    ON guestbook_messages(created_at DESC);