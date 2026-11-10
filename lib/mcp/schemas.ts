import { z } from "zod";
import { linkBoxStyleSchema } from "@/lib/profile-layout";
import { mcpProfileColumnSchema } from "@/lib/profile-schemas";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

const platformKeys = Object.keys(SOCIAL_PLATFORMS) as [string, ...string[]];

const httpUrl = z
  .string()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), "El link tiene que empezar con http:// o https://");

export const mcpSocialLinkSchema = z.object({
  platform: z.enum(platformKeys),
  url: z.string().trim().min(1).max(500).refine((value) => /^https?:\/\//i.test(value), "La URL tiene que empezar con http:// o https://"),
  label: z.string().max(80).optional(),
});

export const mcpStackSchema = z.array(z.string().trim().min(1).max(40)).max(40);

export const updateProfileInputSchema = mcpProfileColumnSchema.extend({
  // Bio lives on the hero block (data.description). There is no profiles.bio column.
  bio: z.string().max(2000).optional(),
  country: z.string().max(2).optional(),
  links: z.array(mcpSocialLinkSchema).max(30).optional(),
  stack: mcpStackSchema.optional(),
  // Override profilePatchSchema's z.string().url(), which allows javascript: and data:.
  image: httpUrl.optional(),
});

export const projectWriteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  link: httpUrl.optional(),
  stack: mcpStackSchema.optional(),
  status: z.enum(["idea", "building", "launched"]).optional(),
  metrics: z.string().max(200).optional(),
  launchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  imageUrl: httpUrl.optional(),
  faviconUrl: httpUrl.optional(),
  imageMode: z.enum(["og", "favicon"]).optional(),
  showStatus: z.boolean().optional(),
  archived: z.boolean().optional(),
  boxStyle: linkBoxStyleSchema.nullable().optional(),
});

export const createProjectInputSchema = projectWriteSchema;

export const updateProjectInputSchema = projectWriteSchema.partial().extend({
  project_id: z.string().uuid(),
});

export const deleteProjectInputSchema = z.object({
  project_id: z.string().uuid(),
  confirm: z.literal(true),
});

export const postUpdateInputSchema = z.object({
  project_id: z.string().uuid(),
  note: z.string().trim().min(1).max(500),
  set_description: z.boolean().optional(),
});

export const announceLaunchInputSchema = z.object({
  project_id: z.string().uuid(),
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
});

export const syncGithubInputSchema = z.object({
  block_id: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

export const emptyInputSchema = z.object({}).strict();

export const PROJECT_DATA_KEYS = [
  "title",
  "description",
  "link",
  "stack",
  "status",
  "metrics",
  "launchDate",
  "imageUrl",
  "faviconUrl",
  "imageMode",
  "showStatus",
  "archived",
  "boxStyle",
] as const;
