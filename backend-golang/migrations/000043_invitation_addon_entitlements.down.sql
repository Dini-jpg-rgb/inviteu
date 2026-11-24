DROP TABLE IF EXISTS invitation_addon_entitlements;
DROP TABLE IF EXISTS invitation_version_addons;

DROP INDEX IF EXISTS idx_order_items_invitation_id;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS fk_order_items_invitation;

ALTER TABLE order_items
DROP COLUMN IF EXISTS invitation_id;