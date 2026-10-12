
CREATE TABLE invitation_domains (
    id BIGSERIAL PRIMARY KEY,

    invitation_id BIGINT NOT NULL,

    domain_name VARCHAR(255) NOT NULL,
    domain_type VARCHAR(50) NOT NULL DEFAULT 'subdomain',

    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    verification_token VARCHAR(255),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_domains_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_invitation_domain_name
        UNIQUE (domain_name),

    CONSTRAINT chk_invitation_domains_type
        CHECK (domain_type IN ('subdomain', 'custom_domain')),

    CONSTRAINT chk_invitation_domains_verification
        CHECK (
            verification_status IN (
                'pending',
                'verified',
                'failed',
                'disabled'
            )
        )
);

CREATE INDEX idx_invitation_domains_invitation_id
    ON invitation_domains(invitation_id);

CREATE INDEX idx_invitation_domains_verification_status
    ON invitation_domains(verification_status);

CREATE UNIQUE INDEX unique_primary_domain_per_invitation
    ON invitation_domains(invitation_id)
    WHERE is_primary = TRUE;