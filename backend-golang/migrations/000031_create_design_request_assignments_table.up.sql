
CREATE TABLE design_request_assignments (
    id BIGSERIAL PRIMARY KEY,
    custom_request_id BIGINT NOT NULL,
    designer_id BIGINT NOT NULL,
    assigned_by BIGINT,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_design_assignments_custom_request
        FOREIGN KEY (custom_request_id)
        REFERENCES custom_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_design_assignments_designer
        FOREIGN KEY (designer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_design_assignments_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT check_design_assignments_status
        CHECK (
            assignment_status IN (
                'assigned',
                'accepted',
                'in_progress',
                'completed',
                'rejected',
                'cancelled'
            )
        ),

    CONSTRAINT check_design_assignments_completion
        CHECK (
            completed_at IS NULL
            OR completed_at >= assigned_at
        )
);

CREATE INDEX idx_design_assignments_request_id
    ON design_request_assignments(custom_request_id);

CREATE INDEX idx_design_assignments_designer_id
    ON design_request_assignments(designer_id);

CREATE INDEX idx_design_assignments_status
    ON design_request_assignments(assignment_status);