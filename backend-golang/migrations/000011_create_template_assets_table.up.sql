CREATE TABLE template_assets (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    storage_file_id BIGINT NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    asset_key VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_template_assets_template
        FOREIGN KEY (template_id)
        REFERENCES templates(id)
        ON DELETE CASCADE,

    CONSTRAINT check_template_asset_sort_order
        CHECK (sort_order >= 0)
);