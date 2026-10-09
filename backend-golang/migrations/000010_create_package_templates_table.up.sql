CREATE TABLE package_templates (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_templates_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_package_templates_template
        FOREIGN KEY (template_id)
        REFERENCES templates(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_package_template
        UNIQUE (package_id, template_id)
);