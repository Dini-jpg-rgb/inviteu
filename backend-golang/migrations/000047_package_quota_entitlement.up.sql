
-- Store the package quota at the time of purchase.
ALTER TABLE order_items
ADD COLUMN invitation_quota_snapshot INTEGER;

ALTER TABLE order_items
ADD CONSTRAINT check_order_items_quota_snapshot
CHECK (
    invitation_quota_snapshot IS NULL
    OR invitation_quota_snapshot >= 0
);

-- Link each package entitlement to its purchase item.
ALTER TABLE partner_packages
ADD COLUMN order_item_id BIGINT;

ALTER TABLE partner_packages
ADD CONSTRAINT fk_partner_packages_order_item
FOREIGN KEY (order_item_id)
REFERENCES order_items(id)
ON DELETE RESTRICT;

-- Prevent the same order item from granting multiple entitlements.
ALTER TABLE partner_packages
ADD CONSTRAINT uq_partner_packages_order_item
UNIQUE (order_item_id);
