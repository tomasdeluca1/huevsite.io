-- Add subscription tier and Lemon Squeezy info to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT;
