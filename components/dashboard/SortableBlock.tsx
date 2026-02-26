"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Sparkles, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { BlockData } from "@/lib/profile-types";
import { ReactNode } from "react";

interface Props {
  id: string;
  block: BlockData;
  children: ReactNode;
  onRemove: (id: string) => void;
  onEdit: (block: BlockData) => void;
  onResize?: (id: string, colSpan: number, rowSpan: number) => void;
}

export function SortableBlock({ id, block, children, onRemove, onEdit, onResize }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.4 : 1,
  };

  const getColSpanClass = (span: number) => {
    return span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : span === 4 ? "md:col-span-4" : "md:col-span-1";
  };

  const getRowSpanClass = (span: number) => {
    return span === 2 ? "md:row-span-2" : span === 3 ? "md:row-span-3" : "md:row-span-1";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getColSpanClass(block.col_span)} ${getRowSpanClass(block.row_span)} relative group rounded-[var(--radius-lg)]`}
    >
      {/* OVERLAY CONTROLS */}
      <div className="absolute top-3 right-3 flex gap-2 z-[60] opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
        <button
          onClick={() => onEdit(block)}
          className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border-bright)] hover:border-[var(--accent)] transition-all text-[var(--accent)] backdrop-blur-md shadow-lg"
          title="Editar contenido"
        >
          <Sparkles size={16} />
        </button>
        <button
          onClick={() => onRemove(id)}
          className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-red-500 backdrop-blur-md shadow-lg"
          title="Eliminar bloque"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* RESIZE CONTROLS (BOTTOM RIGHT) */}
      {onResize && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-[60] opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
          <div className="flex items-center bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border-bright)] rounded-lg overflow-hidden shadow-lg">
            <button 
              onClick={() => onResize(id, Math.max(1, block.col_span - 1), block.row_span)} 
              className="p-1.5 hover:bg-[var(--accent)] hover:text-black transition-colors" 
              title="Reducir Ancho"
            ><ChevronLeft size={12}/></button>
            <span className="text-[9px] font-mono px-1.5 font-bold text-[var(--accent)] select-none">{block.col_span}w</span>
            <button 
              onClick={() => onResize(id, Math.min(4, block.col_span + 1), block.row_span)} 
              className="p-1.5 hover:bg-[var(--accent)] hover:text-black transition-colors" 
              title="Aumentar Ancho"
            ><ChevronRight size={12}/></button>
          </div>
          <div className="flex items-center bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border-bright)] rounded-lg overflow-hidden shadow-lg">
            <button 
              onClick={() => onResize(id, block.col_span, Math.max(1, block.row_span - 1))} 
              className="p-1.5 hover:bg-[var(--accent)] hover:text-black transition-colors" 
              title="Reducir Alto"
            ><ChevronUp size={12}/></button>
            <span className="text-[9px] font-mono px-1.5 font-bold text-[var(--accent)] select-none">{block.row_span}h</span>
            <button 
              onClick={() => onResize(id, block.col_span, Math.min(3, block.row_span + 1))} 
              className="p-1.5 hover:bg-[var(--accent)] hover:text-black transition-colors" 
              title="Aumentar Alto"
            ><ChevronDown size={12}/></button>
          </div>
        </div>
      )}

      {/* DRAG HANDLE */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 p-2 cursor-grab active:cursor-grabbing z-[60] opacity-0 group-hover:opacity-100 transition-all transform -translate-y-1 group-hover:translate-y-0 text-[var(--text-muted)] hover:text-white bg-[var(--surface)]/50 rounded-lg backdrop-blur-md"
      >
        <GripVertical size={18} />
      </div>

      {/* HIGHLIGHT BORDER ON HOVER */}
      <div className="absolute inset-0 border-2 border-[var(--accent)] opacity-0 group-hover:opacity-20 rounded-[var(--radius-lg)] pointer-events-none transition-opacity duration-300" />

      {/* CONTENT */}
      <div className="h-full pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}
