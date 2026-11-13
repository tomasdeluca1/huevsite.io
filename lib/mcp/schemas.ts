import { z } from "zod";
import { avatarFocusSchema } from "@/lib/avatar-focus";
import { linkBoxStyleSchema } from "@/lib/profile-layout";
import { mcpProfileColumnSchema } from "@/lib/profile-schemas";
import { normalizeStoredLink } from "@/lib/social-url";

const httpUrl = z
  .string()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), "El link tiene que empezar con http:// o https://");

export const mcpSocialLinkSchema = z
  .object({
    platform: z.string().trim().min(1).max(40),
    url: z.string().trim().min(1).max(500),
    handle: z.string().max(500).optional(),
    label: z.string().max(80).optional(),
  })
  .superRefine((link, ctx) => {
    const result = normalizeStoredLink(link);
    if (!result.ok && result.code !== "empty") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
    }
  })
  .transform((link) => {
    const result = normalizeStoredLink(link);
    if (!result.ok) return { platform: link.platform, url: link.url, ...(link.label ? { label: link.label } : {}) };
    return {
      platform: result.link.platform,
      url: result.link.url,
      handle: result.link.handle,
      ...(link.label ? { label: link.label } : {}),
      ...(result.link.favicon ? { favicon: result.link.favicon } : {}),
    };
  });

export const mcpStackSchema = z.array(z.string().trim().min(1).max(40)).max(40);

const dryRun = z
  .boolean()
  .optional()
  .describe("true: devuelve cómo quedaría el perfil y qué se escribiría, sin guardar nada.");

export const updateProfileInputSchema = mcpProfileColumnSchema.extend({
  dry_run: dryRun,
  // Bio lives on the hero block (data.description). There is no profiles.bio column.
  bio: z.string().max(2000).optional(),
  country: z.string().max(2).optional(),
  links: z.array(mcpSocialLinkSchema).max(30).optional(),
  stack: mcpStackSchema.optional(),
  // Override profilePatchSchema's z.string().url(), which allows javascript: and data:.
  image: httpUrl.optional(),
  // Encuadre de la foto en el hero: x/y 0-100 (punto que queda al centro), zoom 1-3.
  image_focus: avatarFocusSchema
    .optional()
    .describe("Encuadre de la foto de perfil: x e y de 0 a 100 (el punto de la foto que queda al centro del círculo) y zoom de 1 a 3."),
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

export const createProjectInputSchema = projectWriteSchema.extend({ dry_run: dryRun });

export const updateProjectInputSchema = projectWriteSchema.partial().extend({
  project_id: z.string().uuid(),
  dry_run: dryRun,
});

export const deleteProjectInputSchema = z.object({
  project_id: z.string().uuid(),
  confirm: z.literal(true),
  dry_run: dryRun,
});

export const postUpdateInputSchema = z.object({
  project_id: z.string().uuid(),
  note: z.string().trim().min(1).max(500),
  set_description: z.boolean().optional(),
  dry_run: dryRun,
});

export const announceLaunchInputSchema = z.object({
  project_id: z.string().uuid(),
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
});

export const syncGithubInputSchema = z.object({
  block_id: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

export const arrangeBlocksInputSchema = z.object({
  tidy: z
    .boolean()
    .optional()
    .describe("true: arma un layout prolijo. Oculta bloques duplicados (por ejemplo dos hero con la misma bio), saca links vacíos, ordena (perfil, en qué estoy, proyectos, prueba, contacto) y acomoda los tamaños para que la grilla no tenga huecos."),
  keep_sizes: z
    .boolean()
    .optional()
    .describe("Con tidy: respeta el ancho y alto que eligió la persona en vez de usar el tamaño base de cada tipo."),
  blocks: z
    .array(
      z.object({
        id: z.string().uuid(),
        order: z.number().int().min(0).max(500).optional(),
        col_span: z.number().int().min(1).max(4).optional(),
        row_span: z.number().int().min(1).max(4).optional(),
        visible: z.boolean().optional(),
      })
    )
    .max(60)
    .optional()
    .describe("Cambios a mano por bloque (ids de get_my_profile.grid.blocks). Se aplican después de tidy y lo pisan."),
  dry_run: dryRun,
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
