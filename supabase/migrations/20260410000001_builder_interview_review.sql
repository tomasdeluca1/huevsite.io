-- Builder review flow: let builder approve/request changes on generated content
-- before admin publishes.

ALTER TABLE public.builder_interviews
  ADD COLUMN IF NOT EXISTS builder_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS builder_feedback TEXT,
  ADD COLUMN IF NOT EXISTS builder_review_sent_at TIMESTAMPTZ;
