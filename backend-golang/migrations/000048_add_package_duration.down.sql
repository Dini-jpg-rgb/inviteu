
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS check_order_items_duration_months_snapshot;

ALTER TABLE order_items
DROP COLUMN IF EXISTS duration_months_snapshot;

ALTER TABLE packages
DROP CONSTRAINT IF EXISTS check_packages_duration_months;

ALTER TABLE packages
DROP COLUMN IF EXISTS duration_months;
