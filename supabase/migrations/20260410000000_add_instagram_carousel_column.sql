-- Add missing Instagram carousel column.
-- The original 20260408000000 migration used CREATE TABLE IF NOT EXISTS,
-- so when the table already existed with an older schema, new columns
-- were silently skipped. This migration backfills the missing column.

ALTER TABLE public.builder_interviews
  ADD COLUMN IF NOT EXISTS generated_instagram_carousel JSONB;
