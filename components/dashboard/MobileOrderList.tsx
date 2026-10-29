"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BlockData } from "@/lib/profile-types";

interface Props {
  /** Bloques visibles, YA en el orden de celular (sortForMobile). */
  blocks: BlockData[];
  typeLabels: Record<string, string>;
  onDragEnd: (event: DragEndEvent) => void;
}

function blockTitle(b: BlockData): string {
  const x = b as any;
  return String(x.title || x.name || x.project || x.label || x.username || "").trim();
}

function Row({ block, label }: { block: BlockData; label: string }) {
  const t = useTranslations("dashboard");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const title = blockTitle(block);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 touch-none"
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
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">{label}</p>
        {title && <p className="text-sm font-semibold text-white/80 break-words line-clamp-2">{title}</p>}
      </div>
    </li>
  );
}

/** Lista lateral reordenable (@dnd-kit) con el orden que ve un celular. */
export function MobileOrderList({ blocks, typeLabels, onDragEnd }: Props) {
  const t = useTranslations("dashboard");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ol aria-label={t("page.mobileOrderListLabel")} className="flex flex-col gap-2">
          {blocks.map((b) => (
            <Row key={b.id} block={b} label={typeLabels[b.type] || b.type} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
