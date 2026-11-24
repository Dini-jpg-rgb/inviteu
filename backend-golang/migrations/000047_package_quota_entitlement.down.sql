
ALTER TABLE partner_packages
DROP CONSTRAINT IF EXISTS uq_partner_packages_order_item;

ALTER TABLE partner_packages
DROP CONSTRAINT IF EXISTS fk_partner_packages_order_item;

ALTER TABLE partner_packages
DROP COLUMN IF EXISTS order_item_id;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS check_order_items_quota_snapshot;

ALTER TABLE order_items
DROP COLUMN IF EXISTS invitation_quota_snapshot;
