
CREATE TABLE design_revisions (
    id BIGSERIAL PRIMARY KEY,
    custom_request_id BIGINT NOT NULL,
    revision_number INTEGER NOT NULL,
    requested_by BIGINT,
    assigned_to BIGINT,
    revision_notes TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    response_notes TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_design_revisions_custom_request
        FOREIGN KEY (custom_request_id)
        REFERENCES custom_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_design_revisions_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_design_revisions_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_design_revision_number
        UNIQUE (custom_request_id, revision_number),

    CONSTRAINT check_design_revisions_number
        CHECK (revision_number > 0),

    CONSTRAINT check_design_revisions_status
        CHECK (
            status IN (
                'requested',
                'in_progress',
                'completed',
                'rejected',
                'cancelled'
            )
        ),

    CONSTRAINT check_design_revisions_completion
        CHECK (
            completed_at IS NULL
            OR completed_at >= requested_at
        )
);

CREATE INDEX idx_design_revisions_request_id
    ON design_revisions(custom_request_id);

CREATE INDEX idx_design_revisions_status
    ON design_revisions(status);

CREATE INDEX idx_design_revisions_assigned_to
    ON design_revisions(assigned_to);