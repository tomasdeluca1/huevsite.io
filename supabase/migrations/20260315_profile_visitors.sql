-- Migration: Add profile_visitors table to track who visited each profile
-- This stores authenticated users who visit other profiles

CREATE TABLE IF NOT EXISTS public.profile_visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- the profile being visited
  visitor_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,     -- optional: authenticated visitor
  visitor_id TEXT,                                                              -- anonymous visitor fingerprint
  visitor_username TEXT,                                                        -- username if authenticated
  visitor_name TEXT,
  visitor_avatar TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_visitors_profile_id ON public.profile_visitors(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_created_at ON public.profile_visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_visitor_user_id ON public.profile_visitors(visitor_user_id);

-- RLS
ALTER TABLE public.profile_visitors ENABLE ROW LEVEL SECURITY;

-- Profile owner can see who visited their profile
CREATE POLICY "Profile owners can view their visitors" ON public.profile_visitors
  FOR SELECT USING (auth.uid() = profile_id);

-- Anyone can insert (trackingAPI uses service role anyway)
CREATE POLICY "Service can insert visitors" ON public.profile_visitors
  FOR INSERT WITH CHECK (true);
