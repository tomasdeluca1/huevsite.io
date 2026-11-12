"use client";

import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  pending = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={cancelLabel}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => {
          if (!pending) onCancel();
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-body"
        className="relative z-[510] w-full max-w-sm rounded-[2rem] border border-red-500/30 bg-[var(--surface)] p-6 text-center shadow-2xl sm:p-8"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Trash2 size={32} />
        </div>
        <h3 id="delete-dialog-title" className="mb-3 text-2xl font-black text-white">
          {title}
        </h3>
        <p id="delete-dialog-body" className="mb-8 text-sm leading-relaxed text-[var(--text-dim)]">
          {body}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            autoFocus
            className="min-h-11 flex-1 rounded-2xl bg-[var(--surface2)] py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="min-h-11 flex-1 rounded-2xl bg-red-500 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
