
CREATE TABLE promo_usages (
    id BIGSERIAL PRIMARY KEY,

    promo_code_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,

    discount_amount NUMERIC(15, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'reserved',

    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_promo_usages_promo_code
        FOREIGN KEY (promo_code_id)
        REFERENCES promo_codes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_promo_usages_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_promo_usages_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_promo_usages_discount_amount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_promo_usages_status
        CHECK (status IN ('reserved', 'used', 'cancelled')),

    CONSTRAINT unique_promo_usage_per_order
        UNIQUE (promo_code_id, order_id)
);

CREATE INDEX idx_promo_usages_promo_code_id
    ON promo_usages(promo_code_id);

CREATE INDEX idx_promo_usages_user_id
    ON promo_usages(user_id);

CREATE INDEX idx_promo_usages_order_id
    ON promo_usages(order_id);

CREATE INDEX idx_promo_usages_status
    ON promo_usages(status);