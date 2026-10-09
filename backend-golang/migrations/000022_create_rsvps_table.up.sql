
CREATE TABLE rsvps (
    id BIGSERIAL PRIMARY KEY,
    guest_id BIGINT NOT NULL UNIQUE,
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    number_of_guests INTEGER NOT NULL DEFAULT 1,
    message TEXT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rsvps_guest
        FOREIGN KEY (guest_id)
        REFERENCES guests(id)
        ON DELETE CASCADE,

    CONSTRAINT check_rsvps_number_of_guests
        CHECK (number_of_guests >= 0),

    CONSTRAINT check_rsvps_attendance_status
        CHECK (
            attendance_status IN (
                'pending',
                'attending',
                'not_attending'
            )
        )
);

CREATE INDEX idx_rsvps_attendance_status
    ON rsvps(attendance_status);