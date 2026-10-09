CREATE TABLE partner_packages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    order_id BIGINT,
    invitation_quota INTEGER NOT NULL DEFAULT 0,
    invitation_used INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    expired_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_packages_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_partner_packages_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_invitation_quota
        CHECK (invitation_quota >= 0),

    CONSTRAINT check_invitation_used
        CHECK (invitation_used >= 0),

    CONSTRAINT check_invitation_usage
        CHECK (invitation_used <= invitation_quota)
);