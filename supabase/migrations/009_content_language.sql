-- Add content_language to profiles
-- Values: 'fr_qc' (default) | 'en' | 'bilingual'

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS content_language TEXT NOT NULL DEFAULT 'fr_qc'
  CHECK (content_language IN ('fr_qc', 'en', 'bilingual'));
