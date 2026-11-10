import { z } from "zod";

// Diseño público del perfil. `layout` (dev_heavy, founder_heavy, …) es otra
// cosa: el preset de la grilla. Estos dos campos son el modo Portfolio/Links
// y el formato global de los botones.
//
// El override por link vive en blocks.data.boxStyle.
// update_profile escribe profile_layout y link_box_style.
// update_project escribe boxStyle.

export const PROFILE_LAYOUTS = ["portfolio", "links"] as const;
export const LINK_BOX_STYLES = ["pill", "card", "compact", "featured", "expandable"] as const;

export type ProfileLayoutMode = (typeof PROFILE_LAYOUTS)[number];
export type LinkBoxStyle = (typeof LINK_BOX_STYLES)[number];

export const profileLayoutSchema = z.enum(PROFILE_LAYOUTS);
export const linkBoxStyleSchema = z.enum(LINK_BOX_STYLES);

export const profileLayoutPatchSchema = z.object({
  profile_layout: profileLayoutSchema.optional(),
  link_box_style: linkBoxStyleSchema.optional(),
});

export const projectBoxStyleSchema = z.object({
  boxStyle: linkBoxStyleSchema.nullable().optional(),
});

export function parseProfileLayout(value: unknown): ProfileLayoutMode {
  return value === "links" ? "links" : "portfolio";
}

export function parseLinkBoxStyle(value: unknown): LinkBoxStyle {
  return LINK_BOX_STYLES.includes(value as LinkBoxStyle) ? (value as LinkBoxStyle) : "pill";
}

/** null = seguir el formato global. */
export function parseBoxStyleOverride(value: unknown): LinkBoxStyle | null {
  if (value == null || value === "") return null;
  return LINK_BOX_STYLES.includes(value as LinkBoxStyle) ? (value as LinkBoxStyle) : null;
}

export function resolveBoxStyle(override: unknown, globalStyle: unknown): LinkBoxStyle {
  return parseBoxStyleOverride(override) ?? parseLinkBoxStyle(globalStyle);
}
