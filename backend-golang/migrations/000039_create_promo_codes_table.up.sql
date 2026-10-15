
CREATE TABLE promo_codes (
    id BIGSERIAL PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(15, 2) NOT NULL,

    min_order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC(15, 2),

    usage_limit INTEGER,
    usage_limit_per_user INTEGER,

    starts_at TIMESTAMP,
    expires_at TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_promo_codes_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_promo_codes_discount_type
        CHECK (discount_type IN ('percentage', 'fixed')),

    CONSTRAINT chk_promo_codes_discount_value
        CHECK (
            discount_value > 0
            AND (
                discount_type <> 'percentage'
                OR discount_value <= 100
            )
        ),

    CONSTRAINT chk_promo_codes_min_order
        CHECK (min_order_amount >= 0),

    CONSTRAINT chk_promo_codes_max_discount
        CHECK (
            max_discount_amount IS NULL
            OR max_discount_amount > 0
        ),

    CONSTRAINT chk_promo_codes_usage_limit
        CHECK (usage_limit IS NULL OR usage_limit > 0),

    CONSTRAINT chk_promo_codes_usage_per_user
        CHECK (
            usage_limit_per_user IS NULL
            OR usage_limit_per_user > 0
        ),

    CONSTRAINT chk_promo_codes_dates
        CHECK (
            expires_at IS NULL
            OR starts_at IS NULL
            OR expires_at > starts_at
        ),

    CONSTRAINT chk_promo_codes_status
        CHECK (status IN ('active', 'inactive', 'expired'))
);

CREATE INDEX idx_promo_codes_status
    ON promo_codes(status);

CREATE INDEX idx_promo_codes_expires_at
    ON promo_codes(expires_at);