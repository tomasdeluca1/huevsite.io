"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Copy, X } from "lucide-react";
import { ConnectPanel } from "@/components/mcp/ConnectPanel";
import { isMcpTokenExpired, type McpTokenTtl } from "@/lib/mcp/token-expiry";
import { SITE_URL } from "@/lib/site-url";

type TokenRow = {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
};

type AuditRow = {
  id: string;
  tool: string;
  ok: boolean;
  error_code: string | null;
  created_at: string;
};

type Limits = { maxActive: number; hourly: number };
type Connection = { clientId: string; clientName: string; lastUsedAt: string | null };

const MCP_URL = `${SITE_URL}/api/mcp`;

export function McpAccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [limits, setLimits] = useState<Limits>({ maxActive: 5, hourly: 60 });
  const [name, setName] = useState("");
  const [ttl, setTtl] = useState<McpTokenTtl>("90d");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setFreshToken(null);
      setCopied(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [res, apps] = await Promise.all([
        fetch("/api/mcp/tokens"),
        fetch("/api/mcp/connections"),
      ]);
      const data = await res.json().catch(() => ({}));
      const appData = await apps.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || t("mcp.error"));
        return;
      }
      setError("");
      setTokens(data.tokens || []);
      setAudit(data.audit || []);
      setConnections(appData.connections || []);
      if (data.limits) setLimits(data.limits);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  if (!isOpen) return null;

  const refresh = async () => {
    const res = await fetch("/api/mcp/tokens");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t("mcp.error"));
      return;
    }
    setTokens(data.tokens || []);
    setAudit(data.audit || []);
    if (data.limits) setLimits(data.limits);
    const apps = await fetch("/api/mcp/connections");
    const appData = await apps.json().catch(() => ({}));
    setConnections(appData.connections || []);
  };

  const disconnect = async (clientId: string) => {
    setError("");
    const res = await fetch(`/api/mcp/connections?client_id=${encodeURIComponent(clientId)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t("mcp.error"));
      return;
    }
    await refresh();
  };

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Agente", ttl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("mcp.error"));
        return;
      }
      setFreshToken(data.token);
      setName("");
      setTtl("90d");
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id: string) => {
    setError("");
    const res = await fetch(`/api/mcp/tokens/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t("mcp.error"));
      return;
    }
    await refresh();
  };

  const copy = async () => {
    if (!freshToken) return;
    try {
      await navigator.clipboard.writeText(freshToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const active = tokens.filter((token) => !token.revoked_at);
  const revoked = tokens.filter((token) => token.revoked_at);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";
  const expiryText = (expiresAt: string | null) => {
    if (!expiresAt) return t("mcp.noExpiry");
    const date = formatExpiryDate(expiresAt, dateLocale);
    return date ? `${t("mcp.expires")}: ${date}` : t("mcp.expired");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative flex max-h-[min(820px,92vh)] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
                <Bot size={16} />
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">MCP</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">{t("mcp.title")}</h3>
              <p className="mt-1 text-sm text-white/50">{t("mcp.intro")}</p>
              <Link href="/mcp" className="mt-2 inline-flex text-xs font-bold text-[var(--accent)] underline-offset-4 hover:underline">
                {t("mcp.docs")}
              </Link>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-white/40 hover:bg-white/5 hover:text-white" aria-label={t("mcp.close")}>
              <X size={16} />
            </button>
          </div>

          <div className="custom-scrollbar space-y-5 overflow-y-auto px-6 py-4">
            <ConnectPanel mcpUrl={MCP_URL} />

            <section>
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Apps conectadas</h4>
              {connections.length === 0 ? (
                <p className="text-sm text-white/40">Cuando entres desde Cursor, Claude o ChatGPT, la app aparece acá.</p>
              ) : (
                <ul className="space-y-2">
                  {connections.map((app) => (
                    <li key={app.clientId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">{app.clientName}</div>
                        <div className="truncate font-mono text-[10px] text-white/35">{app.clientId}</div>
                      </div>
                      <button type="button" onClick={() => disconnect(app.clientId)} className="text-[10px] font-black uppercase tracking-widest text-red-300/80 hover:text-red-200">
                        Desconectar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <details className="rounded-2xl border border-white/10 p-4">
              <summary className="cursor-pointer text-sm font-black text-white/70">Token a mano</summary>
              <div className="mt-4 space-y-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              {t("mcp.limit", limits)}
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40" htmlFor="mcp-token-name">
                {t("mcp.nameLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  id="mcp-token-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("mcp.namePlaceholder")}
                  maxLength={60}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[var(--accent)]/40"
                />
                <button
                  type="button"
                  onClick={create}
                  disabled={loading}
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-xs font-black uppercase tracking-wide text-black disabled:opacity-50"
                >
                  {loading ? t("mcp.creating") : t("mcp.create")}
                </button>
              </div>
              <fieldset className="m-0 min-w-0 space-y-2 border-0 p-0">
                <legend className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{t("mcp.expiryLabel")}</legend>
                <div className="flex flex-wrap gap-2">
                  {TTL_CHOICES.map((choice) => (
                    <label
                      key={choice.value}
                      className={`cursor-pointer rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${ttl === choice.value ? "bg-[var(--accent)] text-black" : "bg-white/[0.03] text-white/50 hover:text-white"}`}
                    >
                      <input
                        type="radio"
                        name="mcp-token-ttl"
                        value={choice.value}
                        checked={ttl === choice.value}
                        onChange={() => setTtl(choice.value)}
                        className="sr-only"
                      />
                      {t(choice.labelKey)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {freshToken && (
              <div className="space-y-2 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
                <p className="text-xs font-bold text-[var(--accent)]">{t("mcp.once")}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all font-mono text-xs text-white">{freshToken}</code>
                  <button onClick={copy} className="shrink-0 rounded-xl bg-black/40 p-2 text-white" aria-label={t("mcp.copy")}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-300">{error}</p>}

            <section>
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{t("mcp.active")}</h4>
              {active.length === 0 ? (
                <p className="text-sm text-white/40">{t("mcp.empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {active.map((token) => {
                    const expired = isMcpTokenExpired(token.expires_at);
                    return (
                      <li key={token.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-bold text-white">{token.name}</div>
                            {expired && (
                              <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-200">
                                {t("mcp.expired")}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-white/35">
                            {token.token_prefix}… · {t("mcp.lastUsed")}: {token.last_used_at ? new Date(token.last_used_at).toLocaleString(dateLocale) : t("mcp.never")} · {expiryText(token.expires_at)}
                          </div>
                        </div>
                        <button type="button" onClick={() => revoke(token.id)} className="text-[10px] font-black uppercase tracking-widest text-red-300/80 hover:text-red-200">
                          {t("mcp.revoke")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {revoked.length > 0 && (
              <section>
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{t("mcp.revoked")}</h4>
                <ul className="space-y-1">
                  {revoked.map((token) => (
                    <li key={token.id} className="font-mono text-[11px] text-white/30">
                      {token.name} · {token.token_prefix}… · {expiryText(token.expires_at)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{t("mcp.audit")}</h4>
              {audit.length === 0 ? (
                <p className="text-sm text-white/40">{t("mcp.auditEmpty")}</p>
              ) : (
                <ul className="space-y-1">
                  {audit.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 font-mono text-[11px] text-white/50">
                      <span className={row.ok ? "text-white/70" : "text-red-300/80"}>
                        {row.tool}{row.error_code ? ` · ${row.error_code}` : ""}
                      </span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
              </div>
            </details>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const TTL_CHOICES: { value: McpTokenTtl; labelKey: "mcp.expiry30" | "mcp.expiry90" | "mcp.expiryNever" }[] = [
  { value: "30d", labelKey: "mcp.expiry30" },
  { value: "90d", labelKey: "mcp.expiry90" },
  { value: "never", labelKey: "mcp.expiryNever" },
];

function formatExpiryDate(value: string, locale: string): string | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
