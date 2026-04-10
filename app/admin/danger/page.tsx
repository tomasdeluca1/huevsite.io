"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminAccountLookup {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  customDomain: string | null;
  email: string | null;
  createdAt: string | null;
}

export default function DangerPage() {
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [accountLookup, setAccountLookup] = useState<AdminAccountLookup | null>(
    null
  );
  const [lookingUpAccount, setLookingUpAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const normalizedDeleteUsername = deleteUsername
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  const expectedDeleteConfirmation = normalizedDeleteUsername
    ? `Eliminar @${normalizedDeleteUsername}`
    : "";

  const handleLookupAccount = async () => {
    if (!normalizedDeleteUsername) {
      setMsg({ type: "err", text: "Escribí un @username para buscar la cuenta." });
      setAccountLookup(null);
      return;
    }

    setLookingUpAccount(true);
    setDeleteConfirmation("");
    try {
      const res = await fetch(
        `/api/admin/users/delete?username=${encodeURIComponent(
          normalizedDeleteUsername
        )}`
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAccountLookup(null);
        throw new Error(json.error || "No se pudo buscar la cuenta.");
      }

      setAccountLookup(json.user);
      setMsg(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo buscar la cuenta.";
      setAccountLookup(null);
      setMsg({ type: "err", text: message });
    } finally {
      setLookingUpAccount(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!accountLookup) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: accountLookup.username,
          confirmation: deleteConfirmation,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "No se pudo eliminar la cuenta.");
      }

      setMsg({
        type: "ok",
        text: `Cuenta @${accountLookup.username} eliminada correctamente.`,
      });
      setDeleteUsername("");
      setDeleteConfirmation("");
      setAccountLookup(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la cuenta.";
      setMsg({ type: "err", text: message });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="section-label !text-red-400 mb-1">// zona de peligro</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Danger Zone
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl">
          Operaciones irreversibles. Doble confirmación obligatoria.
        </p>
      </header>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl mb-8 ${
            msg.type === "ok"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </motion.div>
      )}

      <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Trash2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-red-400 mb-2">
              <AlertTriangle size={12} /> irreversible
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Borrar una cuenta
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              Buscá un usuario por username, verificá que sea la cuenta correcta
              y confirmá manualmente antes de eliminarla.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={deleteUsername}
            onChange={(event) => {
              setDeleteUsername(event.target.value);
              setAccountLookup(null);
              setDeleteConfirmation("");
            }}
            placeholder="@username"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-red-400/50"
          />
          <button
            onClick={handleLookupAccount}
            disabled={lookingUpAccount}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lookingUpAccount ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Buscar cuenta"
            )}
          </button>
        </div>

        {accountLookup && (
          <div className="mt-5 space-y-5 rounded-[1.5rem] border border-red-500/15 bg-black/25 p-5">
            <div className="flex items-center gap-4">
              {accountLookup.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountLookup.image}
                  alt={accountLookup.username}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-lg font-black text-red-300">
                  {(accountLookup.name ?? accountLookup.username)[0]?.toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-lg font-black text-white">
                  {accountLookup.name || `@${accountLookup.username}`}
                </div>
                <div className="truncate text-sm font-mono text-white/45">
                  @{accountLookup.username}
                </div>
                {accountLookup.email && (
                  <div className="truncate text-xs text-white/40">
                    {accountLookup.email}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                  User ID
                </div>
                <div className="mt-2 break-all text-xs text-white/70">
                  {accountLookup.id}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                  Custom domain
                </div>
                <div className="mt-2 text-xs text-white/70">
                  {accountLookup.customDomain || "Sin dominio"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                  Creada
                </div>
                <div className="mt-2 text-xs text-white/70">
                  {accountLookup.createdAt
                    ? new Date(accountLookup.createdAt).toLocaleString()
                    : "Sin dato"}
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-amber-500/15 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100/80">
              Esta acción elimina acceso, perfil, bloques, sub-sites y assets.
              Para seguir, escribí exactamente:
              <div className="mt-3 rounded-xl bg-black/25 px-3 py-2 font-mono text-xs text-white">
                {expectedDeleteConfirmation}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={expectedDeleteConfirmation}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-red-400/50"
              />
              <button
                onClick={handleDeleteUser}
                disabled={
                  deletingAccount ||
                  deleteConfirmation !== expectedDeleteConfirmation
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/30 disabled:text-white/40"
              >
                {deletingAccount ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
