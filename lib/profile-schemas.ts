import { z } from "zod";

// Same object the dashboard PATCH /api/profile validates against.
// accent_color and border_radius land in a public <style> tag, so the
// patterns are an injection guard, not a style preference.
export const profilePatchSchema = z.object({
  name: z.string().max(100).optional(),
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Username solo puede tener letras, números, guiones y guiones bajos").optional(),
  // Accept "" so the dashboard can send the field unconditionally without a
  // 400. An empty string is normalized to null below (clears the email).
  email: z.string().email().or(z.literal("")).optional(),
  tagline: z.string().max(200).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "accent_color debe ser un color hex de 6 dígitos (ej: #C8FF00)").optional(),
  layout: z.string().optional(),
  roles: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  available: z.boolean().optional(),
  github_handle: z.string().max(50).optional(),
  image: z.string().url().or(z.literal("")).optional(),
  has_seen_update_feb25: z.boolean().optional(),
  custom_domain: z.string().max(253).optional(),
  border_radius: z.string().regex(/^(0|\d+(\.\d+)?(rem|px|em))$/, "border_radius debe ser un valor CSS válido (ej: 1.5rem, 12px, 0)").optional(),
  is_onboarding_test_user: z.boolean().optional(),
  newsletter_subscribed: z.boolean().optional(),
  show_ecosystem: z.boolean().optional(),
  published_board: z.number().int().min(0).max(2).optional(),
  board_names: z.record(z.string().max(40)).optional(),
});

// Fields an agent may change. Username, email, custom domain, newsletter and
// board publishing stay in the dashboard: those paths talk to Vercel, beehiiv
// or the account identity, and the MCP must not send mail or rename the URL.
export const mcpProfileColumnSchema = profilePatchSchema.pick({
  name: true,
  tagline: true,
  accent_color: true,
  layout: true,
  roles: true,
  location: true,
  available: true,
  github_handle: true,
  image: true,
  border_radius: true,
});
