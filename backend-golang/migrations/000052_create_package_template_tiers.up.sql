CREATE TABLE package_template_tiers (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    template_tier SMALLINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_template_tiers_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE CASCADE,

    CONSTRAINT check_package_template_tiers_tier
        CHECK (template_tier IN (1, 2, 3)),

    CONSTRAINT uq_package_template_tiers
        UNIQUE (package_id, template_tier)
);

CREATE INDEX idx_package_template_tiers_package_id
ON package_template_tiers(package_id);

-- Mapping package lama sesuai keputusan yang disetujui.
INSERT INTO package_template_tiers (package_id, template_tier)
VALUES
    (1, 1),
    (1, 2),
    (1, 3),
    (2, 1),
    (2, 2);