
-- Add package duration without a default.
-- Nullable temporarily to preserve existing development data.
ALTER TABLE packages
ADD COLUMN duration_months INTEGER;

ALTER TABLE packages
ADD CONSTRAINT check_packages_duration_months
CHECK (
    duration_months IS NULL
    OR duration_months > 0
);

-- Snapshot duration when an order is created.
ALTER TABLE order_items
ADD COLUMN duration_months_snapshot INTEGER;

ALTER TABLE order_items
ADD CONSTRAINT check_order_items_duration_months_snapshot
CHECK (
    duration_months_snapshot IS NULL
    OR duration_months_snapshot > 0
);
