
-- Prevent rollback if an invitation has zero or multiple events
DO $$
BEGIN
    IF EXISTS (
        SELECT i.id
        FROM invitations i
        LEFT JOIN invitation_events ie
            ON ie.invitation_id = i.id
        GROUP BY i.id
        HAVING COUNT(ie.event_id) <> 1
    ) THEN
        RAISE EXCEPTION
            'Cannot rollback: each invitation must have exactly one event.';
    END IF;
END
$$;

ALTER TABLE invitations
DROP CONSTRAINT IF EXISTS fk_invitations_published_version;

ALTER TABLE invitations
DROP COLUMN IF EXISTS published_version_id;

ALTER TABLE invitations
ADD COLUMN event_id BIGINT;

UPDATE invitations i
SET event_id = ie.event_id
FROM invitation_events ie
WHERE ie.invitation_id = i.id;

ALTER TABLE invitations
ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE invitations
ADD CONSTRAINT fk_invitations_event
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE;

DROP TABLE invitation_events;