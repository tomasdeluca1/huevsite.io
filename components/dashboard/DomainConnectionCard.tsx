"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Copy, Globe, Loader2, ShieldCheck } from "lucide-react";

interface DomainGuide {
  normalized: string;
  isSubdomain: boolean;
  host: string;
  targetType: string;
  targetValue: string;
  recommendation: string;
  steps: string[];
}

interface VerificationResult {
  isValid: boolean;
  message: string;
  needsTxtVerification?: boolean;
  txtRecord?: {
    host: string;
    value: string;
  };
}

interface Props {
  domain: string;
  currentDomain?: string;
  domainGuide: DomainGuide;
  verifying: boolean;
  verificationResult: VerificationResult | null;
  onDomainChange: (value: string) => void;
  onSave: () => void;
  onVerify: () => void;
}

export function DomainConnectionCard({
  domain,
  currentDomain,
  domainGuide,
  verifying,
  verificationResult,
  onDomainChange,
  onSave,
  onVerify,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visibleNotification, setVisibleNotification] = useState<VerificationResult | null>(null);
  const hasInput = domainGuide.normalized.length > 0;
  const hasSavedDomain = Boolean(currentDomain);
  const canVerify = hasSavedDomain && !verifying;
  const isSavedMatch = hasSavedDomain && currentDomain === domainGuide.normalized;
  const lastVerificationSignature = useRef<string | null>(null);

  const setupCards = [
    {
      label: "Tipo",
      value: domainGuide.targetType,
      help: "Tipo de registro que tenés que crear.",
      copyable: false,
    },
    {
      label: "Host",
      value: domainGuide.host,
      help: "Campo host o name en tu proveedor DNS.",
      copyable: true,
    },
    {
      label: "Apunta a",
      value: domainGuide.targetValue,
      help: "Destino al que debe apuntar el registro.",
      copyable: true,
    },
  ];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setVisibleNotification(verificationResult);
  }, [verificationResult]);

  useEffect(() => {
    if (!verificationResult) return;

    const signature = `${verificationResult.isValid}:${verificationResult.message}`;
    if (lastVerificationSignature.current === signature) return;
    lastVerificationSignature.current = signature;

    if (!verificationResult.isValid) return;

    let cancelled = false;

    const run = async () => {
      const mod = await import("canvas-confetti");
      if (cancelled) return;
      const confetti = mod.default;

      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 28,
        ticks: 220,
        gravity: 0.9,
        scalar: 0.85,
        origin: { x: 0.18, y: 0.15 },
        colors: ["#C8FF00", "#ffffff", "#7dd3fc"],
      });

      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 28,
        ticks: 220,
        gravity: 0.9,
        scalar: 0.85,
        origin: { x: 0.82, y: 0.15 },
        colors: ["#C8FF00", "#ffffff", "#7dd3fc"],
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [verificationResult]);

  useEffect(() => {
    if (!visibleNotification) return;

    const timeout = window.setTimeout(() => {
      setVisibleNotification(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [visibleNotification]);

  return (
    <div className="space-y-5 md:space-y-6">
      {mounted && createPortal(
        <AnimatePresence>
          {visibleNotification && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="fixed top-6 left-1/2 z-[620] w-[min(92vw,680px)] -translate-x-1/2"
            >
              <div className={`rounded-[1.6rem] border px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
                visibleNotification.isValid
                  ? "border-green-400/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.16),rgba(8,8,8,0.92))] text-green-100"
                  : "border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(8,8,8,0.92))] text-amber-50"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                    visibleNotification.isValid
                      ? "border-green-300/20 bg-green-400/10 text-green-300"
                      : "border-amber-300/20 bg-amber-400/10 text-amber-200"
                  }`}>
                    {visibleNotification.isValid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                      {visibleNotification.isValid ? "Success" : "Warning"}
                    </p>
                    <p className="mt-1 text-base font-[900] tracking-tight text-white">
                      {visibleNotification.isValid ? "Dominio verificado" : "Chequeo pendiente"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/78">{visibleNotification.message}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="p-0 md:p-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              <ShieldCheck size={12} />
              Dominio custom
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-[950] tracking-tighter text-white">Conectá tu dominio con un flujo claro.</h3>
              <p className="mt-2 max-w-2xl text-sm md:text-[15px] text-white/50 leading-relaxed">Guardalo, copiá el DNS correcto y corré el check cuando propague.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${domainGuide.isSubdomain ? "bg-sky-400" : "bg-emerald-400"}`} />
            {domainGuide.isSubdomain ? "Subdominio" : "Dominio raiz"}
          </div>
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {["Dominio", "DNS", "Check"].map((step, index) => (
            <div key={step} className="flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-black text-white/70">
                  {index + 1}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">{step}</span>
              </div>
              {index < 2 && <div className="h-px w-6 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="rounded-[1.9rem] border border-white/8 bg-black/20 p-5 md:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Dominio</p>
              <h4 className="mt-2 text-xl md:text-2xl font-[950] tracking-tight text-white">Elegí el host exacto que querés usar.</h4>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">Nosotros lo registramos automáticamente. Vos sólo configurás el DNS.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              isSavedMatch
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : hasSavedDomain
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : "border-white/10 bg-white/[0.03] text-white/40"
            }`}>
              {isSavedMatch ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isSavedMatch ? "Coincide con el guardado" : hasSavedDomain ? "Distinto al guardado" : "Sin guardar"}
            </div>
          </div>

          <div className="relative group">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--accent)] transition-all size-5" />
            <input
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              placeholder="midominio.com"
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] pl-14 pr-5 py-5 text-lg md:text-xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-3">
            <button
              onClick={onSave}
              className="w-full py-4 rounded-[1.25rem] bg-[var(--accent)] text-black font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-xs md:text-sm"
            >
              Guardar y registrar dominio
            </button>
            <div className="flex items-center justify-center px-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.2em] text-white/45 md:col-span-2">
              {hasSavedDomain ? "Listo para verificar" : "Guardalo primero"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-3">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-4 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Dominio a guardar</p>
              <code className="block break-all text-sm md:text-base font-mono text-white">
                {domainGuide.normalized || "tudominio.com"}
              </code>
              <p className="text-xs text-white/40 leading-relaxed">
                Este valor tiene que coincidir exactamente con el host que querés abrir en el navegador.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-4 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Modo</p>
              <p className="text-sm font-semibold text-white">
                {domainGuide.isSubdomain ? "Subdominio" : "Dominio raíz"}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">{domainGuide.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.85rem] border border-white/8 bg-white/[0.02] p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">DNS</p>
              <h5 className="mt-2 text-lg font-[900] tracking-tight text-white">Creá este registro en tu proveedor.</h5>
            </div>
            <div className="px-3 py-1.5 rounded-full border border-white/10 bg-black/20 text-[10px] font-black uppercase tracking-widest text-white/45">
              {domainGuide.targetType}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {setupCards.map((card) => {
              const content = (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{card.label}</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <code className="block break-all text-sm md:text-base font-mono text-white">{card.value}</code>
                    {card.copyable ? <Copy size={14} className="text-white/30 shrink-0" /> : null}
                  </div>
                </>
              );

              if (card.copyable) {
                return (
                  <button
                    key={card.label}
                    onClick={() => copy(card.value)}
                    className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-left hover:bg-white/[0.04] transition-all"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div key={card.label} className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-left">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-white/45 leading-relaxed">
            {domainGuide.isSubdomain
              ? <>En subdominios usá el host exacto. Ej: <code className="font-mono">huevsite</code>, no <code className="font-mono">@</code>.</>
              : <>Si querés sumar <code className="font-mono">www</code>, agregá un <code className="font-mono">CNAME</code> a <code className="font-mono">cname.vercel-dns.com</code>.</>}
          </div>
        </div>

        {verificationResult?.needsTxtVerification && verificationResult.txtRecord && (
          <div className="rounded-[1.85rem] border border-amber-500/20 bg-amber-500/5 p-5 md:p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Verificación de ownership</p>
              <h5 className="mt-2 text-lg font-[900] tracking-tight text-white">Tu dominio está en otra cuenta de Vercel.</h5>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Para reclamar el ownership, agregá este registro TXT en tu proveedor DNS y luego corré el check nuevamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => copy(verificationResult.txtRecord!.host)}
                className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-left hover:bg-white/[0.04] transition-all"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Tipo / Host</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <code className="block text-xs font-mono text-amber-300 mb-1">TXT</code>
                    <code className="block break-all text-sm md:text-base font-mono text-white">{verificationResult.txtRecord.host}</code>
                  </div>
                  <Copy size={14} className="text-white/30 shrink-0 mt-1" />
                </div>
              </button>
              <button
                onClick={() => copy(verificationResult.txtRecord!.value)}
                className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-left hover:bg-white/[0.04] transition-all"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Valor</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <code className="block break-all text-sm md:text-base font-mono text-white">{verificationResult.txtRecord.value}</code>
                  <Copy size={14} className="text-white/30 shrink-0" />
                </div>
              </button>
            </div>

            <p className="text-xs text-white/40 leading-relaxed">
              Una vez que el registro TXT propague (puede tardar unos minutos), volvé a correr el check.
            </p>
          </div>
        )}

        <div className="rounded-[1.85rem] border border-white/8 bg-black/20 p-5 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Estado</p>
              <h5 className="mt-2 text-lg font-[900] tracking-tight text-white">Cuando termines el DNS, corré el check.</h5>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">Si da OK y todavía no abre, normalmente falta SSL.</p>
            </div>
            {verificationResult ? (
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                verificationResult.isValid
                  ? "bg-green-500/10 border border-green-500/20 text-green-300"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-200"
              }`}>
                {verificationResult.isValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {verificationResult.isValid ? "DNS detectado" : "Pendiente"}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Dominio guardado</p>
              <code className="mt-2 block break-all text-sm font-mono text-white">{currentDomain || "Todavia no guardaste ninguno"}</code>
            </div>
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Siguiente paso</p>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                {verificationResult?.needsTxtVerification
                  ? "Agregá el registro TXT de arriba en tu DNS y corré el check de nuevo."
                  : hasSavedDomain
                    ? "Corré el check. Si da OK y no abre, esperá un poco más por SSL."
                    : "Guardá el dominio y después configurá el DNS."}
              </p>
            </div>
          </div>

          <button
            onClick={onVerify}
            disabled={!canVerify}
            className="w-full py-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] text-white/80 font-black uppercase tracking-widest hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs md:text-sm"
          >
            {verifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Verificando
              </span>
            ) : (
              "Check status"
            )}
          </button>
        </div>

        {!hasInput && (
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.02] p-4 text-xs text-white/45 leading-relaxed">
            Tip: si escribís un subdominio como <code className="font-mono">app.tudominio.com</code>, la guía cambia sola y te muestra el host exacto que tenés que crear.
          </div>
        )}
      </div>
    </div>
  );
}
