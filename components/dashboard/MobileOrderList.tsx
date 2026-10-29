"use client";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BlockData } from "@/lib/profile-types";

interface Props {
  /** Bloques visibles, YA en el orden de celular (sortForMobile). */
  blocks: BlockData[];
  typeLabels: Record<string, string>;
  onDragEnd: (event: DragEndEvent) => void;
  /** Los mismos sensores del tablero (useSensors del dashboard). */
  sensors: SensorDescriptor<SensorOptions>[];
  /** Solo se pasa con acceso Pro (mismo criterio que onHide): sin esto no hay selector. */
  onViewChange?: (id: string, view: ViewOption) => void;
}

type ViewOption = "both" | "desktop" | "mobile";
const VIEW_OPTIONS: Array<{ value: ViewOption; key: string }> = [
  { value: "both", key: "page.visibleOnBoth" },
  { value: "desktop", key: "page.visibleOnDesktop" },
  { value: "mobile", key: "page.visibleOnMobile" },
];

function blockTitle(b: BlockData): string {
  const x = b as any;
  return String(x.title || x.name || x.project || x.label || x.username || "").trim();
}

function Row({ block, label, onViewChange }: { block: BlockData; label: string; onViewChange?: Props["onViewChange"] }) {
  const t = useTranslations("dashboard");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const title = blockTitle(block);
  const current: ViewOption = block.visibleOn || "both";
  // Solo con selector (Pro): sin Pro el perfil trata todo como "both" y no hay nada que atenuar.
  const hiddenOnMobile = !!onViewChange && current === "desktop";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 touch-none"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("page.mobileDragHandle")}
        className="shrink-0 cursor-grab active:cursor-grabbing text-white/40 hover:text-white p-1 -m-1"
      >
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">
        {/* La atenuación va solo en etiqueta y título; el cartel "No se ve en celular" queda
            fuera para conservar contraste legible (es la señal que no depende del color). */}
        <p className={`text-[10px] font-black uppercase tracking-[0.15em] text-white/35 ${hiddenOnMobile ? "opacity-65" : ""}`}>{label}</p>
        {title && <p className={`text-sm font-semibold text-white/80 break-words line-clamp-2 ${hiddenOnMobile ? "line-through opacity-65" : ""}`}>{title}</p>}
        {hiddenOnMobile && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
            <EyeOff size={12} aria-hidden="true" />
            {t("page.visibleOnNotInMobile")}
          </p>
        )}
      </div>
      {onViewChange && (
        <div role="group" aria-label={t("page.visibleOnLabel")} className="basis-full flex gap-1 pl-7">
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={current === o.value}
              onClick={() => current !== o.value && onViewChange(block.id, o.value)}
              className={`px-3 py-2 min-h-[40px] rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${current === o.value ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/45 hover:text-white hover:border-white/25"}`}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

/** Lista lateral reordenable (@dnd-kit) con el orden que ve un celular. */
export function MobileOrderList({ blocks, typeLabels, onDragEnd, sensors, onViewChange }: Props) {
  const t = useTranslations("dashboard");
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ol aria-label={t("page.mobileOrderListLabel")} className="flex flex-col gap-2">
          {blocks.map((b) => (
            <Row key={b.id} block={b} label={typeLabels[b.type] || b.type} onViewChange={onViewChange} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
