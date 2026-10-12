
CREATE TABLE custom_requests (
    id BIGSERIAL PRIMARY KEY,
    request_number VARCHAR(100) NOT NULL UNIQUE,
    partner_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    budget NUMERIC(15,2),
    requested_deadline DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_custom_requests_partner
        FOREIGN KEY (partner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_custom_requests_status
        CHECK (
            status IN (
                'submitted',
                'reviewing',
                'quoted',
                'approved',
                'in_progress',
                'revision',
                'completed',
                'rejected',
                'cancelled'
            )
        ),

    CONSTRAINT check_custom_requests_budget
        CHECK (budget IS NULL OR budget >= 0)
);

CREATE INDEX idx_custom_requests_partner_id
    ON custom_requests(partner_id);

CREATE INDEX idx_custom_requests_status
    ON custom_requests(status);

CREATE INDEX idx_custom_requests_deadline
    ON custom_requests(requested_deadline);