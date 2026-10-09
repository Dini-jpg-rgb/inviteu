CREATE TABLE package_limits (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    resource_key VARCHAR(100) NOT NULL,
    limit_value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_package_limits_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_package_limit
        UNIQUE (package_id, resource_key),

    CONSTRAINT check_package_limit_value
        CHECK (limit_value >= 0)
);