ALTER TABLE templates
ADD COLUMN tier SMALLINT;

ALTER TABLE templates
ADD CONSTRAINT check_templates_tier
CHECK (
    tier IS NULL OR tier IN (1, 2, 3)
);