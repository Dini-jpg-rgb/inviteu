
-- 1. Create the relationship table between invitations and events
CREATE TABLE invitation_events (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_events_invitation
        FOREIGN KEY (invitation_id)
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_events_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_invitation_event
        UNIQUE (invitation_id, event_id),

    CONSTRAINT check_invitation_events_sort_order
        CHECK (sort_order >= 0)
);

-- 2. Preserve existing event relationships
INSERT INTO invitation_events (
    invitation_id,
    event_id,
    sort_order
)
SELECT
    id,
    event_id,
    0
FROM invitations;

-- 3. Remove the previous one-event relationship
ALTER TABLE invitations
DROP CONSTRAINT fk_invitations_event;

ALTER TABLE invitations
DROP COLUMN event_id;

-- 4. Track the currently published invitation version
ALTER TABLE invitations
ADD COLUMN published_version_id BIGINT;

ALTER TABLE invitations
ADD CONSTRAINT fk_invitations_published_version
FOREIGN KEY (published_version_id)
REFERENCES invitation_versions(id)
ON DELETE SET NULL;