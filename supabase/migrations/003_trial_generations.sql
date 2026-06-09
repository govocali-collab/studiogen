-- ============================================================
-- Add trial generation tracking to profiles
-- Run in Supabase SQL editor after 002_rename_tier_essentiel.sql
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_generations_used integer NOT NULL DEFAULT 0;
