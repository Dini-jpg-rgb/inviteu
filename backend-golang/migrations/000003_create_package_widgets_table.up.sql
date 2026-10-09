CREATE TABLE package_widgets (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    widget_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_widgets_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_package_widget
        UNIQUE (package_id, widget_key)
);