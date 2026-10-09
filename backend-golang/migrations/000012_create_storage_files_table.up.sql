CREATE TABLE storage_files (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    folder_id VARCHAR(255),
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150),
    size BIGINT,
    duration NUMERIC(10, 2),
    uploaded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_storage_files_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT check_storage_file_size
        CHECK (size IS NULL OR size >= 0),

    CONSTRAINT check_storage_file_duration
        CHECK (duration IS NULL OR duration >= 0)
);