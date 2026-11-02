ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'designer', 'partner'));

ALTER TABLE users
ADD CONSTRAINT users_status_check
CHECK (status IN ('active', 'inactive'));