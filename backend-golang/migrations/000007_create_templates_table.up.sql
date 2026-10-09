CREATE TABLE templates (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    designer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    thumbnail_file_id BIGINT,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    style VARCHAR(100),
    color VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_templates_category
        FOREIGN KEY (category_id)
        REFERENCES template_categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_templates_designer
        FOREIGN KEY (designer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT check_template_price
        CHECK (price >= 0)
);