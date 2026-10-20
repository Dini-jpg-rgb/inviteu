
ALTER TABLE invitations
ADD COLUMN user_id BIGINT NOT NULL;

ALTER TABLE invitations
ADD CONSTRAINT fk_invitations_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE RESTRICT;

CREATE INDEX idx_invitations_user_id
ON invitations(user_id);
