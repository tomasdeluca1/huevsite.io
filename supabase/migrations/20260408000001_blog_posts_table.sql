-- Blog posts table (new posts created via automation, existing stay in blog-data.ts)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tags TEXT[] DEFAULT '{}',

  author_name TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_avatar_url TEXT NOT NULL,

  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  interview_id UUID REFERENCES public.builder_interviews(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, date DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "read_published_posts"
  ON public.blog_posts FOR SELECT USING (is_published = true);

-- Service role manages all writes
CREATE POLICY "service_role_manage_posts"
  ON public.blog_posts FOR ALL USING (true);

-- FK from builder_interviews to blog_posts
ALTER TABLE public.builder_interviews
  ADD CONSTRAINT fk_interview_blog_post
  FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id);
