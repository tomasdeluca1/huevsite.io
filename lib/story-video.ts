// Shared helpers for the builder story video flow.
// Bucket, path layout, and validation live here so builder and admin endpoints
// cannot drift.

export const STORY_VIDEO_BUCKET = "builder-videos";

// 500 MB — matches the bucket-level file_size_limit in the migration.
export const STORY_VIDEO_MAX_BYTES = 524_288_000;

export const STORY_VIDEO_ALLOWED_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
] as const;

export type StoryVideoMime = (typeof STORY_VIDEO_ALLOWED_MIME)[number];

export function isAllowedStoryVideoMime(mime: string): mime is StoryVideoMime {
  return (STORY_VIDEO_ALLOWED_MIME as readonly string[]).includes(mime);
}

// Deterministic path derived from interview id. Using a timestamp suffix so a
// replacement upload lands on a fresh key (the previous one is deleted
// explicitly in the complete/delete endpoints).
export function buildStoryVideoPath(
  interviewId: string,
  mime: string
): string {
  const ext = mimeToExt(mime);
  const stamp = Date.now();
  return `${interviewId}/story-${stamp}.${ext}`;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    case "video/x-m4v":
      return "m4v";
    default:
      return "bin";
  }
}

// Verifies the path was produced by buildStoryVideoPath for this interview.
// Prevents a compromised client from overwriting another interview's video.
export function pathBelongsToInterview(
  path: string,
  interviewId: string
): boolean {
  return path.startsWith(`${interviewId}/story-`);
}
