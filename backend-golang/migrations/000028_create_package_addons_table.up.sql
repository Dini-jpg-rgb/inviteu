
CREATE TABLE package_addons (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    addon_id BIGINT NOT NULL,
    is_included BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_addons_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_package_addons_addon
        FOREIGN KEY (addon_id)
        REFERENCES addons(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_package_addon
        UNIQUE (package_id, addon_id)
);

CREATE INDEX idx_package_addons_addon_id
    ON package_addons(addon_id);