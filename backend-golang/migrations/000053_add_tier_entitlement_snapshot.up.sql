-- Snapshot tier ketika order dibuat.
ALTER TABLE order_items
ADD COLUMN allowed_template_tiers_snapshot SMALLINT[];

ALTER TABLE order_items
ADD CONSTRAINT check_order_items_tier_snapshot
CHECK (
    allowed_template_tiers_snapshot IS NULL
    OR (
        CARDINALITY(allowed_template_tiers_snapshot) > 0
        AND allowed_template_tiers_snapshot
            <@ ARRAY[1, 2, 3]::SMALLINT[]
    )
);

-- Tier yang dimiliki Partner dari pembelian package.
ALTER TABLE partner_packages
ADD COLUMN allowed_template_tiers SMALLINT[];

-- Backfill entitlement lama berdasarkan mapping package.
UPDATE partner_packages pp
SET allowed_template_tiers = (
    SELECT ARRAY_AGG(
        ptt.template_tier
        ORDER BY ptt.template_tier
    )
    FROM package_template_tiers ptt
    WHERE ptt.package_id = pp.package_id
);

-- Pastikan semua entitlement lama sudah memiliki tier.
ALTER TABLE partner_packages
ALTER COLUMN allowed_template_tiers SET NOT NULL;

ALTER TABLE partner_packages
ADD CONSTRAINT check_partner_packages_allowed_tiers
CHECK (
    CARDINALITY(allowed_template_tiers) > 0
    AND allowed_template_tiers
        <@ ARRAY[1, 2, 3]::SMALLINT[]
);

-- Backfill snapshot untuk order package yang sudah tersimpan.
UPDATE order_items oi
SET allowed_template_tiers_snapshot = (
    SELECT ARRAY_AGG(
        ptt.template_tier
        ORDER BY ptt.template_tier
    )
    FROM package_template_tiers ptt
    WHERE ptt.package_id = oi.item_reference_id
)
WHERE oi.item_type = 'package'
  AND oi.item_reference_id IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM package_template_tiers ptt
      WHERE ptt.package_id = oi.item_reference_id
  );