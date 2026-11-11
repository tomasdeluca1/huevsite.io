import type { McpBlock } from "@/lib/mcp/types";

// Layout de la grilla del perfil público. En escritorio la grilla es de 4
// columnas con grid-auto-flow: dense; en tablet, 2; en celular, 1 (ahí todo se
// apila y el tamaño no importa). Un layout queda prolijo cuando se arma por
// "estantes": cada estante suma exactamente 4 columnas y todos sus bloques
// tienen la misma altura. Con anchos de 1, 2 o 4 eso también cierra en 2 columnas.

export const GRID_COLUMNS = 4;

export type LayoutPatch = {
  order?: number;
  col_span?: number;
  row_span?: number;
  visible?: boolean;
};

export type LayoutPlan = {
  layout: Map<string, LayoutPatch>;
  data: Map<string, Record<string, unknown>>;
  notes: string[];
};

// Tamaño base por tipo [columnas, filas].
const PRESETS: Record<string, [number, number]> = {
  hero: [2, 2],
  building: [2, 2],
  ecosystem: [4, 2],
  media: [2, 2],
  github: [1, 2],
  project: [1, 2],
  social: [2, 1],
  stack: [2, 1],
  writing: [2, 1],
  achievement: [2, 1],
  custom: [2, 1],
  collab: [2, 1],
  community: [1, 1],
  certification: [1, 1],
  metric: [1, 1],
  cv: [1, 1],
};

// Orden de lectura: identidad, lo que está haciendo, proyectos, prueba, contacto.
const PRIORITY: Record<string, number> = {
  hero: 0,
  building: 1,
  project: 2,
  ecosystem: 3,
  github: 4,
  metric: 5,
  achievement: 6,
  certification: 7,
  media: 8,
  writing: 9,
  stack: 10,
  community: 11,
  collab: 12,
  custom: 13,
  cv: 14,
  social: 15,
};

// Tipos que no tiene sentido mostrar dos veces.
const SINGLETONS = new Set(["hero", "social", "stack", "cv", "ecosystem"]);

// Textos de relleno que el dashboard pone al crear un bloque.
const PLACEHOLDERS = new Set([
  "Nombre del proyecto",
  "Descripción breve",
  "Mi proyecto nuevo",
  "Descripción del proyecto",
  "Contanos qué estás haciendo...",
  "Tu nombre",
  "Mi primer post",
  "1k Followers en X",
  "Trabajos Anteriores",
  "AWS Certified Solutions Architect",
]);

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function blockLabel(block: McpBlock): string {
  const data = rec(block.data);
  const firstPost = Array.isArray(data.posts) ? str(rec(data.posts[0]).title) : "";
  const label = str(data.title) || str(data.name) || str(data.project) || str(data.label) || str(data.username) || firstPost;
  return label || block.type;
}

function presetOf(type: string): [number, number] {
  return PRESETS[type] || [1, 1];
}

function snapCols(cols: number): number {
  if (cols >= 3) return 4;
  return cols <= 1 ? 1 : 2;
}

function contentScore(block: McpBlock): number {
  const data = rec(block.data);
  let score = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key === "board_index") continue;
    if (typeof value === "string" && value.trim() && !PLACEHOLDERS.has(value.trim())) score += 1;
    else if (Array.isArray(value) && value.length > 0) score += 1;
    else if (value && typeof value === "object" && !Array.isArray(value)) score += 1;
  }
  if (block.type === "social") score += usableLinks(data.links).length * 2;
  return score;
}

function usableLinks(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map(rec).filter((link) => str(link.url) !== "");
}

function duplicateKey(block: McpBlock): string | null {
  if (SINGLETONS.has(block.type)) return block.type;
  if (block.type === "github") {
    const username = str(rec(block.data).username).toLowerCase();
    return username ? `github:${username}` : null;
  }
  return null;
}

function isPlaceholderBlock(block: McpBlock): boolean {
  const data = rec(block.data);
  const main = str(data.title) || str(data.project) || str(data.name);
  return main !== "" && PLACEHOLDERS.has(main);
}

// Huecos en la grilla de 4 columnas, simulando grid-auto-flow: dense.
export function gridHoles(blocks: Array<Pick<McpBlock, "col_span" | "row_span">>, columns = GRID_COLUMNS): number {
  const filled: boolean[][] = [];
  const free = (r: number, c: number) => !(filled[r] && filled[r][c]);
  let bottom = 0;
  for (const block of blocks) {
    const cols = Math.min(columns, Math.max(1, block.col_span || 1));
    const rows = Math.max(1, block.row_span || 1);
    let placed = false;
    for (let r = 0; !placed; r++) {
      for (let c = 0; c + cols <= columns && !placed; c++) {
        let fits = true;
        for (let dr = 0; dr < rows && fits; dr++) {
          for (let dc = 0; dc < cols && fits; dc++) fits = free(r + dr, c + dc);
        }
        if (!fits) continue;
        for (let dr = 0; dr < rows; dr++) {
          filled[r + dr] = filled[r + dr] || [];
          for (let dc = 0; dc < cols; dc++) filled[r + dr][c + dc] = true;
        }
        bottom = Math.max(bottom, r + rows);
        placed = true;
      }
    }
  }
  let holes = 0;
  for (let r = 0; r < bottom; r++) {
    for (let c = 0; c < columns; c++) if (free(r, c)) holes += 1;
  }
  return holes;
}

export type LayoutIssue = { code: string; message: string; block_ids?: string[] };

export function boardBlocks(blocks: McpBlock[], boardIndex: number): McpBlock[] {
  return blocks
    .filter((block) => block.sub_site_id == null && (block.board_index ?? 0) === boardIndex)
    .sort((a, b) => a.order - b.order);
}

export function layoutIssues(board: McpBlock[]): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const visible = board.filter((block) => block.visible);

  const groups = new Map<string, McpBlock[]>();
  for (const block of visible) {
    const key = duplicateKey(block);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), block]);
  }
  for (const [key, group] of Array.from(groups.entries())) {
    if (group.length < 2) continue;
    const type = key.split(":")[0];
    issues.push({
      code: `duplicate_${type}`,
      message: type === "hero"
        ? `Hay ${group.length} bloques de perfil (hero) visibles: la bio aparece repetida.`
        : `Hay ${group.length} bloques ${type} visibles que muestran lo mismo.`,
      block_ids: group.map((block) => block.id),
    });
  }

  if (visible.length > 0 && !visible.some((block) => block.type === "hero")) {
    issues.push({ code: "no_hero", message: "No hay bloque de perfil (hero) visible." });
  } else if (visible[0] && visible[0].type !== "hero") {
    issues.push({ code: "hero_not_first", message: "El bloque de perfil no es el primero de la grilla." });
  }

  const placeholders = visible.filter(isPlaceholderBlock);
  if (placeholders.length > 0) {
    issues.push({
      code: "placeholder",
      message: "Hay bloques visibles con el texto de ejemplo del dashboard.",
      block_ids: placeholders.map((block) => block.id),
    });
  }

  const emptyLinks = visible.filter(
    (block) => block.type === "social" && Array.isArray(rec(block.data).links) &&
      (rec(block.data).links as unknown[]).length !== usableLinks(rec(block.data).links).length
  );
  if (emptyLinks.length > 0) {
    issues.push({
      code: "empty_links",
      message: "El bloque de redes tiene links vacíos.",
      block_ids: emptyLinks.map((block) => block.id),
    });
  }

  const holes = gridHoles(visible);
  if (holes > 0) {
    issues.push({ code: "grid_holes", message: `La grilla de escritorio tiene ${holes} huecos vacíos.` });
  }
  return issues;
}

type Item = { block: McpBlock; cols: number; rows: number };

// Arma el layout prolijo de un board. No toca otros boards ni sub-sitios.
// keepSizes: respeta el ancho y alto que eligió la persona (ajustados a 1, 2 o 4
// columnas); si no, usa el tamaño base de cada tipo.
export function planTidy(board: McpBlock[], opts: { keepSizes?: boolean } = {}): LayoutPlan {
  const plan: LayoutPlan = { layout: new Map(), data: new Map(), notes: [] };
  const visible = board.filter((block) => block.visible);
  const hidden = board.filter((block) => !block.visible);

  // 1. Duplicados: queda el más completo (empate: el primero en la grilla).
  const keep: McpBlock[] = [];
  const groups = new Map<string, McpBlock[]>();
  for (const block of visible) {
    const key = duplicateKey(block);
    if (!key) {
      keep.push(block);
      continue;
    }
    groups.set(key, [...(groups.get(key) || []), block]);
  }
  for (const group of Array.from(groups.values())) {
    const ranked = [...group].sort((a, b) => contentScore(b) - contentScore(a) || a.order - b.order);
    keep.push(ranked[0]);
    for (const extra of ranked.slice(1)) {
      plan.layout.set(extra.id, { visible: false });
      plan.notes.push(`Oculto el ${extra.type} duplicado "${blockLabel(extra)}" (queda "${blockLabel(ranked[0])}").`);
    }
  }

  // 2. Links vacíos del bloque de redes.
  for (const block of keep) {
    if (block.type !== "social") continue;
    const data = rec(block.data);
    if (!Array.isArray(data.links)) continue;
    const links = usableLinks(data.links);
    if (links.length !== data.links.length) {
      plan.data.set(block.id, { ...data, links });
      plan.notes.push(`Saco ${data.links.length - links.length} link(s) vacío(s) del bloque de redes.`);
    }
  }

  // 3. Orden de lectura, estable dentro de cada tipo.
  // El primer proyecto es el protagonista: va a 2x2 en vez de 1x2.
  let leadProject = true;
  const queue: Item[] = keep
    .sort((a, b) => (PRIORITY[a.type] ?? 50) - (PRIORITY[b.type] ?? 50) || a.order - b.order)
    .map((block) => {
      let [presetCols, presetRows] = presetOf(block.type);
      if (block.type === "project" && leadProject) {
        presetCols = 2;
        leadProject = false;
      }
      return opts.keepSizes
        ? { block, cols: snapCols(block.col_span || 1), rows: Math.min(4, Math.max(1, block.row_span || 1)) }
        : { block, cols: presetCols, rows: presetRows };
    });

  // 4. Estantes de 4 columnas. Si el que sigue no entra, busca más adelante uno
  //    que sí; si igual sobra lugar, ensancha bloques del estante (1→2, 2→4).
  const shelves: Item[][] = [];
  while (queue.length > 0) {
    const shelf: Item[] = [queue.shift()!];
    let room = GRID_COLUMNS - shelf[0].cols;
    for (let i = 0; i < queue.length && room > 0 && i < 6; ) {
      if (queue[i].cols <= room) {
        room -= queue[i].cols;
        shelf.push(queue.splice(i, 1)[0]);
      } else {
        i += 1;
      }
    }
    while (room > 0) {
      const one = [...shelf].reverse().find((item) => item.cols === 1);
      if (one) {
        one.cols = 2;
        room -= 1;
        continue;
      }
      const two = [...shelf].reverse().find((item) => item.cols === 2);
      if (two && room >= 2) {
        two.cols = 4;
        room -= 2;
        continue;
      }
      break;
    }
    const height = Math.max(...shelf.map((item) => item.rows));
    for (const item of shelf) item.rows = height;
    shelves.push(shelf);
  }

  // 5. Escribir orden y tamaño. Los ocultos van al final, en su orden.
  let order = 0;
  for (const item of shelves.flat()) {
    const patch: LayoutPatch = {};
    if (item.block.order !== order) patch.order = order;
    if (item.block.col_span !== item.cols) patch.col_span = item.cols;
    if (item.block.row_span !== item.rows) patch.row_span = item.rows;
    if (Object.keys(patch).length > 0) plan.layout.set(item.block.id, patch);
    order += 1;
  }
  const hiddenNow = [...hidden, ...visible.filter((block) => plan.layout.get(block.id)?.visible === false)]
    .sort((a, b) => a.order - b.order);
  for (const block of hiddenNow) {
    if (block.order !== order) plan.layout.set(block.id, { ...(plan.layout.get(block.id) || {}), order });
    order += 1;
  }
  return plan;
}

export function applyPatch(block: McpBlock, patch: LayoutPatch | undefined): McpBlock {
  return patch ? { ...block, ...patch } : block;
}

export function layoutView(board: McpBlock[]) {
  const sorted = [...board].sort((a, b) => a.order - b.order);
  return {
    columns: GRID_COLUMNS,
    blocks: sorted.map((block) => ({
      id: block.id,
      type: block.type,
      label: blockLabel(block),
      visible: block.visible,
      order: block.order,
      col_span: block.col_span,
      row_span: block.row_span,
    })),
    issues: layoutIssues(sorted),
  };
}
