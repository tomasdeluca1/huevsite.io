-- Migration: Add feedback system
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone authenticated can send feedback
DROP POLICY IF EXISTS "Users can create feedback" ON feedbacks;
CREATE POLICY "Users can create feedback"
  ON feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admin (huevsite) can view all feedback
DROP POLICY IF EXISTS "Admin can view all feedback" ON feedbacks;
CREATE POLICY "Admin can view all feedback"
  ON feedbacks FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE username = 'huevsite'
    )
  );
