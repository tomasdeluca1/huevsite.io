-- Addresses Resend reported as bounced or complained.
-- Mass sends skip these. Service role only: no policies, RLS on.
-- Apply manually in the Supabase SQL editor (there is no CLI push).

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL CHECK (reason IN ('bounced', 'complained')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
