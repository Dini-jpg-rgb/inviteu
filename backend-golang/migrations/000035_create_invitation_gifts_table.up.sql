
CREATE TABLE invitation_gifts (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL,
    gift_type VARCHAR(50) NOT NULL,
    provider_name VARCHAR(150),
    account_name VARCHAR(255),
    account_number VARCHAR(255),
    wallet_identifier VARCHAR(255),
    instructions TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_gifts_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT check_invitation_gifts_type
        CHECK (
            gift_type IN (
                'bank_transfer',
                'e_wallet',
                'physical_gift',
                'other'
            )
        ),

    CONSTRAINT check_invitation_gifts_sort_order
        CHECK (sort_order >= 0)
);

CREATE INDEX idx_invitation_gifts_invitation_id
    ON invitation_gifts(invitation_id);

CREATE INDEX idx_invitation_gifts_active
    ON invitation_gifts(invitation_id, is_active);