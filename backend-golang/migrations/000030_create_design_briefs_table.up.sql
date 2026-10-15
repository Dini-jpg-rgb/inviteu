
CREATE TABLE design_briefs (
    id BIGSERIAL PRIMARY KEY,
    custom_request_id BIGINT NOT NULL UNIQUE,
    event_type VARCHAR(100),
    theme VARCHAR(150),
    primary_color VARCHAR(100),
    secondary_color VARCHAR(100),
    design_style VARCHAR(100),
    target_audience TEXT,
    content_requirements TEXT,
    reference_urls JSONB,
    additional_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_design_briefs_custom_request
        FOREIGN KEY (custom_request_id)
        REFERENCES custom_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT check_design_briefs_reference_urls
        CHECK (
            reference_urls IS NULL
            OR jsonb_typeof(reference_urls) = 'array'
        )
);

CREATE INDEX idx_design_briefs_theme
    ON design_briefs(theme);

CREATE INDEX idx_design_briefs_design_style
    ON design_briefs(design_style);