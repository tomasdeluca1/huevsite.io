-- Migration: Add analytics_events table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view' | 'block_click'
  sub_site_id UUID REFERENCES public.sub_sites(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  visitor_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Owner can read their own analytics
CREATE POLICY "Users can view their own analytics" ON public.analytics_events 
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert analytics events
-- Note: We use an API route with service role for tracking to avoid public insert spam if preferred,
-- but this policy allows client-side insertion if you want to use the supabase client directly.
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events 
  FOR INSERT WITH CHECK (true);
