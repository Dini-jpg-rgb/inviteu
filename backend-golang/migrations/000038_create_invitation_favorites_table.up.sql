
CREATE TABLE invitation_favorites (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_favorites_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_favorites_template
        FOREIGN KEY (template_id)
        REFERENCES templates(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_template_favorite
        UNIQUE (user_id, template_id)
);

CREATE INDEX idx_invitation_favorites_user_id
    ON invitation_favorites(user_id);

CREATE INDEX idx_invitation_favorites_template_id
    ON invitation_favorites(template_id);