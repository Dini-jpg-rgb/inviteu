CREATE TABLE template_fields (
    id BIGSERIAL PRIMARY KEY,
    template_section_id BIGINT NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    default_value TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    validation_rules JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_template_fields_section
        FOREIGN KEY (template_section_id)
        REFERENCES template_sections(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_section_field_key
        UNIQUE (template_section_id, field_key),

    CONSTRAINT check_template_field_sort_order
        CHECK (sort_order >= 0)
);