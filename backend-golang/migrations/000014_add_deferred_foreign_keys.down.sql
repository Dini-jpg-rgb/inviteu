
ALTER TABLE partner_packages
DROP CONSTRAINT IF EXISTS fk_partner_packages_order;

ALTER TABLE template_assets
DROP CONSTRAINT IF EXISTS fk_template_assets_storage_file;

ALTER TABLE templates
DROP CONSTRAINT IF EXISTS fk_templates_thumbnail_file;