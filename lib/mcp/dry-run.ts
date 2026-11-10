import type { McpBlock, McpProfile, McpStore, ToolOutcome } from "@/lib/mcp/types";

// dry_run: el tool corre su lógica de siempre (validación, cupo, dueño) contra
// un store que lee la base real y guarda las escrituras en memoria. El agente
// ve cómo quedaría el perfil y la lista de escrituras, y nada se persiste.

export type DryRunWrite = { op: string; target: string; fields?: string[] };

export type DryRunStore = McpStore & { writes: DryRunWrite[] };

export function dryRunStore(real: McpStore): DryRunStore {
  let profilePatch: Record<string, unknown> = {};
  const blockData = new Map<string, Record<string, unknown>>();
  const inserted: McpBlock[] = [];
  const deleted = new Set<string>();
  const writes: DryRunWrite[] = [];
  let seq = 0;

  const overlay = (blocks: McpBlock[]): McpBlock[] => [
    ...blocks
      .filter((block) => !deleted.has(block.id))
      .map((block) => (blockData.has(block.id) ? { ...block, data: blockData.get(block.id)! } : block)),
    ...inserted.filter((block) => !deleted.has(block.id)),
  ];

  return {
    writes,
    async getProfile(userId) {
      const profile = await real.getProfile(userId);
      return profile ? ({ ...profile, ...profilePatch } as McpProfile) : null;
    },
    async updateProfile(_userId, patch) {
      profilePatch = { ...profilePatch, ...patch };
      writes.push({ op: "update", target: "profile", fields: Object.keys(patch) });
    },
    async listMainBlocks(userId) {
      return overlay(await real.listMainBlocks(userId));
    },
    async countVisibleMainBlocks(userId, boardIndex) {
      const removed = (await real.listMainBlocks(userId)).filter(
        (block) => deleted.has(block.id) && block.visible && (block.board_index ?? 0) === boardIndex
      ).length;
      const added = inserted.filter(
        (block) => !deleted.has(block.id) && block.visible && block.board_index === boardIndex
      ).length;
      return (await real.countVisibleMainBlocks(userId, boardIndex)) - removed + added;
    },
    async insertBlock(userId, input) {
      seq += 1;
      const block: McpBlock = {
        id: `dry-run-${seq}`,
        user_id: userId,
        type: input.type,
        data: input.data,
        visible: true,
        sub_site_id: null,
        board_index: input.boardIndex,
        order: Number.MAX_SAFE_INTEGER,
        col_span: input.colSpan,
        row_span: input.rowSpan,
        created_at: new Date().toISOString(),
      };
      inserted.push(block);
      writes.push({ op: "create", target: `block:${input.type}`, fields: Object.keys(input.data) });
      return block;
    },
    async updateBlockData(userId, blockId, data) {
      const current = overlay(await real.listMainBlocks(userId)).find((block) => block.id === blockId);
      if (!current) return null;
      const changed = Object.keys(data).filter(
        (key) => JSON.stringify(data[key]) !== JSON.stringify(current.data?.[key])
      );
      const pending = inserted.find((block) => block.id === blockId);
      if (pending) pending.data = data;
      else blockData.set(blockId, data);
      writes.push({ op: "update", target: `block:${current.type}:${blockId}`, fields: changed });
      return { ...current, data };
    },
    async deleteProject(userId, blockId) {
      const current = overlay(await real.listMainBlocks(userId)).find(
        (block) => block.id === blockId && block.type === "project"
      );
      if (!current) return false;
      deleted.add(blockId);
      writes.push({ op: "delete", target: `block:project:${blockId}` });
      return true;
    },
    async insertActivity(_userId, type) {
      writes.push({ op: "create", target: `activity:${type}` });
      return { id: "dry-run-activity", created_at: new Date().toISOString() };
    },
    async createLaunch() {
      // announce_launch no acepta dry_run: las reglas de lanzamiento viven en la
      // base (cupo mensual, semana repetida) y simularlas daría un sí que puede ser un no.
      throw new Error("dry_run no simula lanzamientos");
    },
    async syncGithub() {
      return { updated: [] };
    },
    async recomputeScore() {
      // El score se recalcula al escribir de verdad.
    },
  };
}

export async function runDryRun(
  real: McpStore,
  run: (store: McpStore) => Promise<ToolOutcome>
): Promise<ToolOutcome> {
  const store = dryRunStore(real);
  const outcome = await run(store);
  if (!outcome.ok) return outcome;
  return {
    ok: true,
    data: {
      dry_run: true,
      persisted: false,
      writes: store.writes,
      note: "Vista previa: no se guardó nada. Volvé a llamar sin dry_run para aplicar. El builder score no se recalcula en la vista previa.",
      preview: outcome.data,
    },
  };
}
