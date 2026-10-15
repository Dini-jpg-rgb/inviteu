
CREATE TABLE design_quotations (
    id BIGSERIAL PRIMARY KEY,
    custom_request_id BIGINT NOT NULL,
    quotation_number VARCHAR(100) NOT NULL UNIQUE,
    created_by BIGINT,
    description TEXT,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    valid_until TIMESTAMP,
    responded_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_design_quotations_custom_request
        FOREIGN KEY (custom_request_id)
        REFERENCES custom_requests(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_design_quotations_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT check_design_quotations_amounts
        CHECK (
            subtotal >= 0
            AND discount >= 0
            AND tax_amount >= 0
            AND total >= 0
        ),

    CONSTRAINT check_design_quotations_status
        CHECK (
            status IN (
                'draft',
                'sent',
                'accepted',
                'rejected',
                'expired',
                'cancelled'
            )
        ),

    CONSTRAINT check_design_quotations_validity
        CHECK (
            valid_until IS NULL
            OR valid_until >= created_at
        )
);

CREATE INDEX idx_design_quotations_request_id
    ON design_quotations(custom_request_id);

CREATE INDEX idx_design_quotations_status
    ON design_quotations(status);

CREATE INDEX idx_design_quotations_valid_until
    ON design_quotations(valid_until);