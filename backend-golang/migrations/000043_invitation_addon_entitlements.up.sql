-- Link an order item to the invitation it belongs to.
ALTER TABLE order_items
ADD COLUMN invitation_id BIGINT;

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_invitation
FOREIGN KEY (invitation_id)
REFERENCES invitations(id)
ON DELETE SET NULL;

CREATE INDEX idx_order_items_invitation_id
ON order_items(invitation_id);


-- Store add-ons selected for each invitation version.
CREATE TABLE invitation_version_addons (
    id BIGSERIAL PRIMARY KEY,

    invitation_version_id BIGINT NOT NULL,
    addon_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_version_addons_version
        FOREIGN KEY (invitation_version_id)
        REFERENCES invitation_versions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_version_addons_addon
        FOREIGN KEY (addon_id)
        REFERENCES addons(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_invitation_version_addons
        UNIQUE (invitation_version_id, addon_id)
);

CREATE INDEX idx_invitation_version_addons_addon_id
ON invitation_version_addons(addon_id);


-- Record add-on entitlements granted to a specific invitation.
CREATE TABLE invitation_addon_entitlements (
    id BIGSERIAL PRIMARY KEY,

    invitation_id BIGINT NOT NULL,
    addon_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_addon_entitlements_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_addon_entitlements_addon
        FOREIGN KEY (addon_id)
        REFERENCES addons(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_invitation_addon_entitlements_order_item
        FOREIGN KEY (order_item_id)
        REFERENCES order_items(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_invitation_addon_entitlements_order_item
        UNIQUE (order_item_id),

    CONSTRAINT chk_invitation_addon_entitlements_status
        CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX idx_invitation_addon_entitlements_invitation_addon_status
ON invitation_addon_entitlements(invitation_id, addon_id, status);