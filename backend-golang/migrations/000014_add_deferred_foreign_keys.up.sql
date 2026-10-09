
-- 1. Relasi thumbnail template dengan file penyimpanan
ALTER TABLE templates
ADD CONSTRAINT fk_templates_thumbnail_file
FOREIGN KEY (thumbnail_file_id)
REFERENCES storage_files(id)
ON DELETE SET NULL;

-- 2. Relasi aset template dengan file penyimpanan
ALTER TABLE template_assets
ADD CONSTRAINT fk_template_assets_storage_file
FOREIGN KEY (storage_file_id)
REFERENCES storage_files(id)
ON DELETE RESTRICT;

-- 3. Relasi paket partner dengan pesanan
ALTER TABLE partner_packages
ADD CONSTRAINT fk_partner_packages_order
FOREIGN KEY (order_id)
REFERENCES orders(id)
ON DELETE SET NULL;