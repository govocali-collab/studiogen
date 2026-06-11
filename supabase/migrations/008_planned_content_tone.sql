-- Add tone, cta, and generated_from_brand_brain columns to planned_content
ALTER TABLE planned_content
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS cta TEXT,
  ADD COLUMN IF NOT EXISTS generated_from_brand_brain BOOLEAN NOT NULL DEFAULT true;
