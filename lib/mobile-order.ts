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
