
CREATE TABLE addons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    addon_type VARCHAR(50) NOT NULL,
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    billing_type VARCHAR(50) NOT NULL DEFAULT 'one_time',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_addons_price
        CHECK (price >= 0),

    CONSTRAINT check_addons_type
        CHECK (
            addon_type IN (
                'feature',
                'quota',
                'service',
                'domain',
                'storage'
            )
        ),

    CONSTRAINT check_addons_billing_type
        CHECK (
            billing_type IN (
                'one_time',
                'monthly',
                'yearly'
            )
        ),

    CONSTRAINT check_addons_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'archived'
            )
        ),

    CONSTRAINT check_addons_sort_order
        CHECK (sort_order >= 0)
);

CREATE INDEX idx_addons_status
    ON addons(status);

CREATE INDEX idx_addons_addon_type
    ON addons(addon_type);