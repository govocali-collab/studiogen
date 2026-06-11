CREATE TABLE IF NOT EXISTS planned_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('formation', 'résultats clients', 'produit', 'engagement', 'éducatif', 'promo')),
  service_focus TEXT,
  objective TEXT,
  suggested_date DATE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'both' CHECK (platform IN ('fb', 'ig', 'both')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'created')),
  requires_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE planned_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own planned_content"
ON planned_content
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_planned_content_user_date ON planned_content (user_id, suggested_date);
