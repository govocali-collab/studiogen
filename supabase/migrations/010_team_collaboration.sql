-- ── Team Collaboration ─────────────────────────────────────────────────────
-- workspace_id on profiles: points to the owner's user_id.
-- For owners: workspace_id = id. For collaborators: workspace_id = owner's id.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner';

-- Existing users are all owners
UPDATE profiles SET workspace_id = id WHERE workspace_id IS NULL;

-- ── Accepted team members ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'collaborator',
  invited_by   uuid REFERENCES profiles(id),
  invited_at   timestamptz,
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ── Pending invitations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by   uuid NOT NULL REFERENCES profiles(id),
  email        text NOT NULL,
  first_name   text,
  role         text NOT NULL DEFAULT 'collaborator',
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Add workspace_id to all content tables ─────────────────────────────────
ALTER TABLE post_history    ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES profiles(id);
ALTER TABLE planned_content ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES profiles(id);
ALTER TABLE calendar_posts  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES profiles(id);
ALTER TABLE user_logos      ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES profiles(id);

-- Backfill: existing content belongs to the user's own workspace
UPDATE post_history    SET workspace_id = user_id WHERE workspace_id IS NULL;
UPDATE planned_content SET workspace_id = user_id WHERE workspace_id IS NULL;
UPDATE calendar_posts  SET workspace_id = user_id WHERE workspace_id IS NULL;
UPDATE user_logos      SET workspace_id = user_id WHERE workspace_id IS NULL;

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_history_workspace    ON post_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_planned_content_workspace ON planned_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_workspace  ON calendar_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_logos_workspace      ON user_logos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_workspace ON workspace_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token    ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_workspace ON team_invitations(workspace_id);
