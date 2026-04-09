-- Builder de la Semana: interview invitations and async responses
CREATE TABLE IF NOT EXISTS public.builder_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Invitation
  token TEXT UNIQUE NOT NULL,
  builder_username TEXT NOT NULL,
  builder_email TEXT,
  builder_name TEXT,
  invited_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Form responses (null until submitted)
  submitted_at TIMESTAMPTZ,

  -- Section 1: Intro
  intro_who_are_you TEXT,
  intro_origin_story TEXT,
  intro_build_in_public TEXT,

  -- Section 2: Projects
  projects_main_project TEXT,
  projects_problem_solved TEXT,
  projects_stack TEXT,
  projects_biggest_challenge TEXT,
  projects_users_traction TEXT,
  projects_links TEXT,

  -- Section 3: Quick fire
  quickfire_tool TEXT,
  quickfire_inspiration TEXT,
  quickfire_advice TEXT,
  quickfire_whats_next TEXT,
  quickfire_where_to_find TEXT,

  -- Generated content
  generated_blog_markdown TEXT,
  generated_linkedin_post TEXT,
  generated_twitter_post TEXT,
  generated_instagram_caption TEXT,
  generation_error TEXT,

  -- Typefully draft refs
  typefully_x_draft_id TEXT,
  typefully_x_draft_url TEXT,
  typefully_linkedin_draft_id TEXT,
  typefully_linkedin_draft_url TEXT,

  -- Workflow
  status TEXT DEFAULT 'invited'
    CHECK (status IN ('invited','submitted','generating','ready','published','expired')),
  blog_post_id UUID,
  admin_notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_builder_interviews_token ON public.builder_interviews(token);
CREATE INDEX idx_builder_interviews_status ON public.builder_interviews(status);

ALTER TABLE public.builder_interviews ENABLE ROW LEVEL SECURITY;

-- Public read by token (form page)
CREATE POLICY "read_interview_by_token"
  ON public.builder_interviews FOR SELECT USING (true);

-- Public update (form submission — API validates token)
CREATE POLICY "update_interview_by_token"
  ON public.builder_interviews FOR UPDATE USING (true);

-- Insert via service role only
CREATE POLICY "service_role_insert"
  ON public.builder_interviews FOR INSERT WITH CHECK (true);
