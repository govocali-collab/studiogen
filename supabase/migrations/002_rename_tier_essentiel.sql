-- ============================================================
-- Rename subscription tier 'starter' → 'essentiel'
-- Run this in the Supabase SQL editor after 001_subscription.sql
-- ============================================================

-- 1. Update all existing rows with 'starter' tier
UPDATE public.profiles SET subscription_tier = 'essentiel' WHERE subscription_tier = 'starter';

-- 2. Update the column default value
ALTER TABLE public.profiles ALTER COLUMN subscription_tier SET DEFAULT 'essentiel';

-- 3. Update the handle_new_user trigger to insert 'essentiel' instead of 'starter'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier, subscription_status, generations_used)
  VALUES (new.id, new.email, 'essentiel', 'trialing', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
