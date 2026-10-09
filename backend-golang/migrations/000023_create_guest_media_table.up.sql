
CREATE TABLE guest_media (
    id BIGSERIAL PRIMARY KEY,
    guest_id BIGINT NOT NULL,
    rsvp_id BIGINT,
    storage_file_id BIGINT NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_guest_media_guest
        FOREIGN KEY (guest_id)
        REFERENCES guests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_guest_media_rsvp
        FOREIGN KEY (rsvp_id)
        REFERENCES rsvps(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_guest_media_storage_file
        FOREIGN KEY (storage_file_id)
        REFERENCES storage_files(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_guest_media_type
        CHECK (media_type IN ('video', 'audio')),

    CONSTRAINT check_guest_media_sort_order
        CHECK (sort_order >= 0)
);

CREATE INDEX idx_guest_media_guest_id
    ON guest_media(guest_id);

CREATE INDEX idx_guest_media_rsvp_id
    ON guest_media(rsvp_id);

CREATE INDEX idx_guest_media_storage_file_id
    ON guest_media(storage_file_id);