-- Builder story video: allow builders to upload their video (1 per interview),
-- stored privately in a dedicated Supabase Storage bucket. Admin can mark
-- individual videos as public for blog embeds.

-- Add video columns to builder_interviews
ALTER TABLE public.builder_interviews
  ADD COLUMN IF NOT EXISTS story_video_path TEXT,
  ADD COLUMN IF NOT EXISTS story_video_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS story_video_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS story_video_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS story_video_is_public BOOLEAN NOT NULL DEFAULT false;

-- Create private bucket for builder videos.
-- file_size_limit: 500 MB (524288000 bytes) — enough for a 5-10 min vertical video
-- allowed_mime_types: common web-friendly video formats
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'builder-videos',
  'builder-videos',
  false,
  524288000,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS on storage.objects for this bucket.
-- All access is via service role from server routes (signed upload URLs for
-- builders, signed playback URLs for everyone). No direct client access needed.

DROP POLICY IF EXISTS "builder_videos_service_role_all" ON storage.objects;

CREATE POLICY "builder_videos_service_role_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'builder-videos')
  WITH CHECK (bucket_id = 'builder-videos');
