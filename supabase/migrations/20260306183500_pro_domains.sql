-- Migration: Add custom domains column for PRO users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Policies for sub_sites (ensure they are strictly controlled)
-- Already handled in 20260303000000_advanced_pro_features.sql
