
DROP INDEX IF EXISTS idx_invitations_user_id;

ALTER TABLE invitations
DROP CONSTRAINT IF EXISTS fk_invitations_user;

ALTER TABLE invitations
DROP COLUMN IF EXISTS user_id;
