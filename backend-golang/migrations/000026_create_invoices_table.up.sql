
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoices_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_invoices_amounts
        CHECK (
            subtotal >= 0
            AND discount >= 0
            AND tax_amount >= 0
            AND total >= 0
        ),

    CONSTRAINT check_invoices_status
        CHECK (
            status IN (
                'draft',
                'unpaid',
                'paid',
                'overdue',
                'cancelled',
                'refunded'
            )
        ),

    CONSTRAINT check_invoices_due_date
        CHECK (
            due_at IS NULL
            OR due_at >= issued_at
        )
);

CREATE INDEX idx_invoices_status
    ON invoices(status);

CREATE INDEX idx_invoices_issued_at
    ON invoices(issued_at);