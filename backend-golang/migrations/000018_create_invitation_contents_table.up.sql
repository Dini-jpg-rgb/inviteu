
CREATE TABLE invitation_contents (
    id BIGSERIAL PRIMARY KEY,
    invitation_version_id BIGINT NOT NULL,
    template_field_id BIGINT NOT NULL,
    value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_contents_version
        FOREIGN KEY (invitation_version_id)
        REFERENCES invitation_versions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_contents_template_field
        FOREIGN KEY (template_field_id)
        REFERENCES template_fields(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_invitation_version_field
        UNIQUE (invitation_version_id, template_field_id)
);