-- Builder de la Semana: replace JSON-based 7-slide carousel with two
-- natural-language prompts targeting Creatibro (an AI tool for IG content).
--
-- The old `generated_instagram_carousel` column held a structured slide array
-- ({heading, body, footer}[]). The new flow generates ONE text prompt per
-- asset that the admin pastes into Creatibro, which renders the visuals
-- using its Voice DNA + uploaded photos.
--
-- Behaviour by co-winner count:
--   1 winner  → carousel prompt is solo (about that builder)
--   2+ winners → carousel prompt is JOINT (presents all winners), regenerated
--                when the last co-winner submits the form
--   Story prompt → ALWAYS individual per builder
--
-- Old data is preserved on `generated_instagram_carousel_legacy` so we can
-- inspect or re-render historical interviews.

ALTER TABLE public.builder_interviews
  RENAME COLUMN generated_instagram_carousel TO generated_instagram_carousel_legacy;

ALTER TABLE public.builder_interviews
  ADD COLUMN IF NOT EXISTS generated_instagram_carousel_prompt TEXT,
  ADD COLUMN IF NOT EXISTS generated_instagram_story_prompt TEXT;
