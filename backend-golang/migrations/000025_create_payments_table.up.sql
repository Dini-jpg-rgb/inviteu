
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_number VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(100),
    provider_transaction_id VARCHAR(255),
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    failure_reason TEXT,
    provider_response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_payments_method
        CHECK (
            payment_method IN (
                'bank_transfer',
                'e_wallet',
                'qris',
                'credit_card',
                'virtual_account',
                'other'
            )
        ),

    CONSTRAINT check_payments_amount
        CHECK (amount > 0),

    CONSTRAINT check_payments_status
        CHECK (
            status IN (
                'pending',
                'processing',
                'paid',
                'failed',
                'expired',
                'cancelled',
                'refunded',
                'partially_refunded'
            )
        ),

    CONSTRAINT check_payments_expiration
        CHECK (
            expired_at IS NULL
            OR expired_at >= created_at
        )
);

CREATE INDEX idx_payments_order_id
    ON payments(order_id);

CREATE INDEX idx_payments_status
    ON payments(status);

CREATE INDEX idx_payments_provider_transaction_id
    ON payments(provider_transaction_id);