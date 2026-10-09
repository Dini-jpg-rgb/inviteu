
CREATE TABLE invitation_media (
    id BIGSERIAL PRIMARY KEY,
    invitation_version_id BIGINT NOT NULL,
    template_section_id BIGINT,
    storage_file_id BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_media_version
        FOREIGN KEY (invitation_version_id)
        REFERENCES invitation_versions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_media_section
        FOREIGN KEY (template_section_id)
        REFERENCES template_sections(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_invitation_media_storage_file
        FOREIGN KEY (storage_file_id)
        REFERENCES storage_files(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_invitation_media_sort_order
        CHECK (sort_order >= 0)
);