ALTER TABLE templates
DROP CONSTRAINT IF EXISTS check_templates_tier;

ALTER TABLE templates
DROP COLUMN IF EXISTS tier;