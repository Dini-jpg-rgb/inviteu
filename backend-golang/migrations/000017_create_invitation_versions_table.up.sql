
CREATE TABLE invitation_versions (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_versions_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_invitation_version
        UNIQUE (invitation_id, version_number),

    CONSTRAINT check_invitation_version_number
        CHECK (version_number > 0)
);