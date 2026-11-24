ALTER TABLE partner_packages
DROP CONSTRAINT IF EXISTS check_partner_packages_allowed_tiers;

ALTER TABLE partner_packages
DROP COLUMN IF EXISTS allowed_template_tiers;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS check_order_items_tier_snapshot;

ALTER TABLE order_items
DROP COLUMN IF EXISTS allowed_template_tiers_snapshot;