-- Migration: Add welcome_tweet_sent flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_tweet_sent BOOLEAN DEFAULT false;
