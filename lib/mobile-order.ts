import type { BlockData } from "@/lib/profile-types"

// Orden propio de la vista celular. `mobileOrder === null` en TODOS los bloques
// significa "sigue el orden de escritorio". Funciones puras: sin red ni base.

type OrderedBlock = Pick<BlockData, "id" | "order" | "mobileOrder">

const hasValue = (b: OrderedBlock) => typeof b.mobileOrder === "number"

/** true si al menos un bloque tiene orden propio de celular. */
export function hasMobileOrder(blocks: OrderedBlock[]): boolean {
  return blocks.some(hasValue)
}

/**
 * Ordena para celular: primero los que tienen `mobileOrder` (ascendente), y los
 * `null` al FINAL (estado mixto). Desempata por `order` y, si también empata,
 * conserva el orden de entrada (Array.prototype.sort es estable).
 * Con todos en `null` devuelve exactamente el orden de escritorio.
 */
export function sortForMobile<T extends OrderedBlock>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => {
    const aHas = hasValue(a)
    const bHas = hasValue(b)
    if (aHas !== bHas) return aHas ? -1 : 1
    if (aHas && bHas && a.mobileOrder !== b.mobileOrder) {
      return (a.mobileOrder as number) - (b.mobileOrder as number)
    }
    return a.order - b.order
  })
}

/**
 * Fija el orden de celular de TODO el set (no solo del bloque movido) tomando
 * como punto de partida el orden efectivo actual: 0, 1, 2…
 */
export function materializeMobileOrder<T extends OrderedBlock>(
  blocks: T[]
): Array<{ id: string; mobile_order: number }> {
  return sortForMobile(blocks).map((b, i) => ({ id: b.id, mobile_order: i }))
}

/**
 * Valor de `mobile_order` para un bloque NUEVO: al final (max + 1) si el set ya
 * tiene orden propio, `null` si todo está en NULL (el bloque nace siguiendo
 * escritorio, igual que el resto).
 */
export function nextMobileOrder(blocks: OrderedBlock[]): number | null {
  let max = -1
  for (const b of blocks) {
    if (typeof b.mobileOrder === "number" && b.mobileOrder > max) max = b.mobileOrder
  }
  return max < 0 ? null : max + 1
}

export type ReorderPlan =
  | {
      ok: true
      view: "desktop" | "mobile"
      updates: Array<{ id: string; patch: { order: number } | { mobile_order: number | null } }>
    }
  | { ok: false }

/**
 * Interpreta el body de POST /api/blocks/reorder. Pura: decide TODO antes de que
 * la ruta toque la base, así un body inválido nunca produce una escritura parcial.
 *  - array pelado [{id, order}]                 -> escritorio, escribe solo `order`
 *  - { view: 'desktop', blocks: [{id, order}] } -> igual
 *  - { view: 'mobile', blocks: [...] }          -> escribe solo `mobile_order`
 *    (de `mobile_order`, o de `order` si falta); `null` = seguir escritorio.
 */
export function parseReorderBody(raw: unknown): ReorderPlan {
  const isArr = Array.isArray(raw)
  const obj = (isArr ? null : raw) as { view?: unknown; blocks?: unknown } | null
  if (!isArr && (obj === null || typeof obj !== "object")) return { ok: false }
  if (!isArr && obj!.view !== undefined && obj!.view !== "desktop" && obj!.view !== "mobile") {
    return { ok: false }
  }
  const view: "desktop" | "mobile" = !isArr && obj!.view === "mobile" ? "mobile" : "desktop"
  const items = isArr ? (raw as unknown[]) : obj!.blocks
  if (!Array.isArray(items) || items.length === 0) return { ok: false }

  const updates: Array<{ id: string; patch: { order: number } | { mobile_order: number | null } }> = []
  for (const it of items) {
    if (!it || typeof it !== "object" || typeof (it as any).id !== "string") return { ok: false }
    const i = it as { id: string; order?: unknown; mobile_order?: unknown }
    if (view === "mobile") {
      const v = i.mobile_order !== undefined ? i.mobile_order : i.order
      if (v !== null && !Number.isInteger(v)) return { ok: false }
      updates.push({ id: i.id, patch: { mobile_order: v as number | null } })
    } else {
      if (!Number.isInteger(i.order)) return { ok: false }
      updates.push({ id: i.id, patch: { order: i.order as number } })
    }
  }
  return { ok: true, view, updates }
}

export type BlockViewFields =
  | { ok: true; fields: { visible_on?: "both" | "desktop" | "mobile"; mobile_order?: number | null } }
  | { ok: false }

const VIEWS = ["both", "desktop", "mobile"]

/**
 * Normaliza y valida los campos de vista de PATCH /api/blocks/[id]. Pura.
 * Acepta snake (`visible_on`, `mobile_order`) o camel (`visibleOn`, `mobileOrder`),
 * pero NUNCA las dos grafías a la vez del mismo campo (ambigüedad => rechazo, así el
 * resultado no depende del orden de las claves). Lo que devuelve en `fields` es lo
 * ÚNICO que la ruta puede escribir en esas columnas: ni el gate Pro ni la escritura
 * miran el body crudo.
 */
export function parseBlockViewFields(body: unknown): BlockViewFields {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return { ok: true, fields: {} }
  const b = body as Record<string, unknown>
  const fields: { visible_on?: "both" | "desktop" | "mobile"; mobile_order?: number | null } = {}

  if ("visible_on" in b && "visibleOn" in b) return { ok: false }
  const v = "visible_on" in b ? b.visible_on : b.visibleOn
  if ("visible_on" in b || "visibleOn" in b) {
    if (typeof v !== "string" || !VIEWS.includes(v)) return { ok: false }
    fields.visible_on = v as "both" | "desktop" | "mobile"
  }

  if ("mobile_order" in b && "mobileOrder" in b) return { ok: false }
  const m = "mobile_order" in b ? b.mobile_order : b.mobileOrder
  if ("mobile_order" in b || "mobileOrder" in b) {
    if (m !== null && !(typeof m === "number" && Number.isInteger(m) && m >= 0)) return { ok: false }
    fields.mobile_order = m as number | null
  }
  return { ok: true, fields }
}
