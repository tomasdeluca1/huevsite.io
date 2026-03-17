"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  MousePointer2,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Monitor,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Layout,
  Globe2,
  ArrowRight,
  LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyPoint { date: string; count: number; }
interface ReferrerItem { source: string; visitors: number; }
interface BrowserItem { browser: string; visitors: number; }
interface OSItem { os: string; visitors: number; }
interface DeviceItem { device: string; visitors: number; }

interface RecentVisitor {
  id: string;
  visitor_username: string | null;
  visitor_name: string | null;
  visitor_avatar: string | null;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  created_at: string;
}

interface InsightsData {
  uniqueVisitors: number;
  totalClicks: number;
  totalPageViews: number;
  ctr: number;
  bounceRate: number;
  blockStats: Record<string, number>;
  dailyVisitors: DailyPoint[];
  referrers: ReferrerItem[];
  browsers: BrowserItem[];
  operatingSystems: OSItem[];
  devices: DeviceItem[];
  recentVisitors: RecentVisitor[];
  onlineNow: number;
}

interface Props {
  accentColor: string;
  blocks: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getReferrerIcon(source: string): string {
  const map: Record<string, string> = {
    'X': '𝕏',
    'Google': '🔍',
    'Facebook': 'f',
    'Instagram': '📷',
    'LinkedIn': 'in',
    'YouTube': '▶',
    'Reddit': '🔴',
    'TikTok': '♪',
    'GitHub': '⑃',
    'Direct/None': '→',
  };
  return map[source] || source.charAt(0).toUpperCase();
}

function getBrowserEmoji(browser: string): string {
  const map: Record<string, string> = {
    'Chrome': '🌐',
    'Safari': '🧭',
    'Firefox': '🦊',
    'Edge': '🔷',
    'Opera': '🔴',
    'Samsung Internet': '📱',
    'Instagram': '📷',
    'Facebook': '🔵',
    'Twitter': '🐦',
    'LinkedIn': '🔷',
  };
  return map[browser] || '🌐';
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/[0.06] bg-white/[0.015] px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
        <Icon className="h-5 w-5 text-white/25" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">{title}</div>
      <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-white/28">{description}</p>
    </div>
  );
}

// ─── MiniSparkline Chart ───────────────────────────────────────────────────────

function SparklineChart({ data, accentColor }: { data: DailyPoint[]; accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Use higher resolution for Retina screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padB = 40;
    const padT = 20;
    const padH = 15;
    const chartW = W - padH * 2;
    const chartH = H - padB - padT;
    const stepX = chartW / (data.length - 1);

    ctx.clearRect(0, 0, W, H);

    const pts = data.map((d, i) => ({
      x: padH + i * stepX,
      y: padT + chartH - (d.count / maxVal) * chartH
    }));

    // Draw grid lines
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padT + (chartH / 3) * i;
        ctx.moveTo(padH, y);
        ctx.lineTo(W - padH, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw bars for background texture
    const barW = stepX * 0.4;
    data.forEach((d, i) => {
      const x = padH + i * stepX;
      const barH = (d.count / maxVal) * (chartH * 0.8);
      const y = padT + chartH - barH;
      ctx.fillStyle = accentColor + '08';
      ctx.beginPath();
      ctx.roundRect(x - barW / 2, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();
    });

    // Draw high-quality smooth line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    
    // Gradient stroke
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = accentColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    gradient.addColorStop(0, accentColor + '1a');
    gradient.addColorStop(1, accentColor + '00');
    ctx.lineTo(pts[pts.length - 1].x, padT + chartH);
    ctx.lineTo(pts[0].x, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Interaction dots (optional, only for key points or highlight)
    /*
    pts.forEach((p, i) => {
      if (data[i].count === maxVal) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
        ctx.strokeStyle = '#1a1a1f';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    */

    // X-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = 'bold 10px var(--font-display), sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (i === 0 || i === data.length - 1 || i % 7 === 0) {
        const parts = d.date.split('-');
        const label = `${parts[2]}/${parts[1]}`;
        ctx.fillText(label, padH + i * stepX, H - 12);
      }
    });
  }, [data, accentColor, maxVal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = rect.width;
    const padH = 15;
    const chartW = W - padH * 2;
    const stepX = chartW / (data.length - 1);
    
    const idx = Math.min(Math.max(Math.round((mouseX - padH) / stepX), 0), data.length - 1);
    const d = data[idx];
    const x = padH + idx * stepX;
    setTooltip({ x: (x / W) * 100, y: 20, date: d.date, count: d.count });
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="h-[200px] w-full sm:h-[220px] lg:h-[260px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair' }}
      />
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none bg-[#121214]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-20 flex flex-col items-center min-w-[120px]"
            style={{ 
                left: `${Math.min(Math.max(tooltip.x, 10), 90)}%`, 
                top: '0px',
                transform: 'translateX(-50%)'
            }}
          >
            <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">{new Date(tooltip.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_var(--accent-glow)]" style={{ backgroundColor: accentColor, '--accent-glow': accentColor } as any} />
              <span className="text-white text-lg font-black tracking-tight">{tooltip.count}</span>
              <span className="text-white/30 text-[10px] font-bold">VISTAS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bar Row ──────────────────────────────────────────────────────────────────

function BarRow({
  label,
  value,
  max,
  accent,
  icon,
  sublabel,
  tooltip,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  icon?: string;
  sublabel?: string;
  tooltip?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group relative flex items-center gap-3 py-3.5 sm:gap-4 sm:px-1 border-b border-white/[0.03] last:border-0">
      <div className="z-10 flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-[12px] transition-colors group-hover:bg-white/10">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-bold text-white transition-colors group-hover:text-[var(--accent)]">
                {label}
              </span>
              {tooltip && (
                <Tooltip content={tooltip}>
                   <div className="flex h-3 w-3 cursor-help items-center justify-center rounded-full bg-white/5 pointer-events-auto">
                     <AlertCircle size={8} className="text-white/20 hover:text-white/60" />
                   </div>
                </Tooltip>
              )}
            </div>
            <span className="shrink-0 text-sm font-black text-white/80 transition-colors group-hover:text-white">
              {formatNum(value)}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full relative"
              style={{ backgroundColor: accent }}
            >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </motion.div>
          </div>
          {sublabel && <div className="text-[9px] text-white/20 font-mono uppercase tracking-[0.2em] mt-1.5 font-black">{sublabel}</div>}
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-x-2 -inset-y-0.5 rounded-xl bg-white/[0.01] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  badge,
  tabs,
  activeTab,
  setActiveTab,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  badge?: string;
  tabs?: string[];
  activeTab?: string;
  setActiveTab?: (t: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm ${className}`}>
      {(title || tabs) && (
        <div className="flex flex-col gap-3 border-b border-white/[0.05] px-4 py-4 sm:px-6">
          {(title || description || badge) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {title && <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 font-display">{title}</span>}
                {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/28">{description}</p>}
              </div>
              {badge && (
                <div className="inline-flex shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  {badge}
                </div>
              )}
            </div>
          )}
          {tabs && (
            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
               {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab?.(tab)}
                        className={`relative shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all font-display ${
                        activeTab === tab
                            ? 'text-[var(--accent)] bg-[var(--accent-dim)]'
                            : 'text-white/20 hover:text-white/50 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  trend,
  icon: Icon,
  tooltip,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: typeof Users;
  tooltip?: string;
}) {
  return (
    <motion.div 
        whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="group relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/[0.05] bg-white/[0.015] p-4 transition-all hover:border-white/20 sm:min-h-[170px] sm:p-[18px] lg:min-h-[182px] lg:p-5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,var(--glow-color)_0%,transparent_70%)] opacity-10 blur-2xl pointer-events-none" style={{ '--glow-color': accent } as any} />
      
      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-transform group-hover:scale-110">
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex items-center gap-2">
          {tooltip && (
            <Tooltip content={tooltip} position="bottom">
              <button
                type="button"
                aria-label={`Más información sobre ${label}`}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/[0.28] transition-colors hover:border-white/[0.15] hover:text-white/60"
              >
                <AlertCircle size={14} />
              </button>
            </Tooltip>
          )}
          {trend && trend !== 'neutral' && (
            <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
              {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend === 'up' ? 'Good' : 'Drop'}
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 font-display">{label}</div>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="text-3xl leading-none tracking-tighter text-white font-[950] font-display sm:text-[2.5rem]">{value}</div>
            {sub && <span className="translate-y-[-1px] text-[9px] font-bold uppercase tracking-widest text-white/10 font-display">{sub}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InsightsTab({ accentColor, blocks }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referrerTab, setReferrerTab] = useState('Referrer');
  const [locationTab, setLocationTab] = useState('Browser');
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/insights");
      if (!res.ok) throw new Error("Error al cargar las métricas");
      const insights = await res.json();
      setData(insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 animate-spin flex items-center justify-center" style={{ animationDuration: '3s' }}>
                <RefreshCw size={24} className="text-white/20" />
            </div>
            <div className="absolute -inset-4 bg-[var(--accent)]/10 blur-2xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase">Analizando métricas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8 text-red-500/40" />
        </div>
        <p className="text-white/50 text-sm font-medium">{error}</p>
        <button
          onClick={fetchInsights}
          className="btn-accent !py-2.5 !px-6 !rounded-xl !text-xs gap-2"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  // Block leaderboard
  const topBlocks = Object.entries(data?.blockStats || {})
    .map(([id, clicks]) => {
      const block = blocks.find(b => b.id === id);
      return { id, clicks, title: block?.data?.title || block?.type || 'Bloque', type: block?.type };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  const maxRef = data?.referrers?.[0]?.visitors || 1;
  const maxBrowser = data?.browsers?.[0]?.visitors || 1;
  const maxOS = data?.operatingSystems?.[0]?.visitors || 1;
  const maxBlocks = topBlocks[0]?.clicks || 1;

  const peakDay = data?.dailyVisitors?.reduce((max, d) => d.count > max.count ? d : max, { date: '', count: 0 });
  const totalDailyVisitors = data?.dailyVisitors?.reduce((sum, day) => sum + day.count, 0) || 0;
  const averageDailyVisitors = data?.dailyVisitors?.length ? Math.round(totalDailyVisitors / data.dailyVisitors.length) : 0;
  const activeDays = data?.dailyVisitors?.filter((day) => day.count > 0).length || 0;
  const summaryChips = [
    { label: "Promedio diario", value: averageDailyVisitors },
    { label: "Días activos", value: activeDays },
    { label: "Pico", value: peakDay?.count || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
            <Tooltip content="Personas que están navegando tu perfil exacto en este momento." position="bottom">
                <div className="group flex cursor-help items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 transition-all animate-pulse hover:animate-none">
                    <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-500">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-60" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-xl leading-none">{data?.onlineNow || 0}</span>
                        <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">Live now</span>
                    </div>
                </div>
            </Tooltip>
            
            <div className="hidden h-10 w-px bg-white/5 lg:block" />
            
            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:min-w-[160px]">
                <span className="text-white/60 text-xs font-bold font-mono tracking-tight">Periodo</span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest font-black">Últimos 30 días</span>
            </div>
        </div>

        <button
          onClick={fetchInsights}
          className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:border-white/20 hover:bg-white/10 sm:w-auto"
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
          Actualizar datos
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        <StatCard
          label="Visitantes únicos"
          value={formatNum(data?.uniqueVisitors || 0)}
          icon={Users}
          accent={accentColor}
          trend="neutral"
          tooltip="Personas distintas que visitaron tu perfil basándose en su ID de navegador."
        />
        <StatCard
          label="Vistas totales"
          value={formatNum(data?.totalPageViews || 0)}
          icon={BarChart3}
          accent={accentColor}
          sub="HUEVSITE"
          trend="neutral"
          tooltip="Cantidad total de veces que se cargó tu perfil en los últimos 30 días."
        />
        <StatCard
          label="Tasa de Rebote"
          value={`${data?.bounceRate || 0}%`}
          icon={TrendingUp}
          accent={accentColor}
          trend={data?.bounceRate && data.bounceRate < 60 ? 'up' : 'down'}
          tooltip="Porcentaje de visitantes que salieron de tu perfil sin interactuar con ningún bloque."
        />
        <StatCard
          label="Interacción (CTR)"
          value={`${data?.ctr || 0}%`}
          icon={MousePointer2}
          accent={accentColor}
          sub="CLICKS"
          trend="neutral"
          tooltip="Click-Through Rate: El porcentaje de visitantes que hicieron clic en al menos uno de tus bloques."
        />
      </div>

      {/* ── Charts & Lists Grid ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:gap-4">
        
        {/* Main Chart */}
        <SectionCard 
            title="Tráfico de audiencia" 
            description="Seguí la evolución del tráfico diario y detectá cuándo tu perfil gana más atención."
            badge="30 días"
            className="min-h-[320px] md:col-span-2 xl:col-span-12"
        >
             <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                   <h3 className="mb-2 flex flex-wrap items-end gap-x-3 gap-y-2 text-4xl tracking-tighter text-white font-[950] font-display sm:text-5xl">
                        {formatNum(data?.uniqueVisitors || 0)}
                        <span className="text-xs font-black uppercase tracking-[.25em] text-white/20 font-display sm:text-sm">Builders totales</span>
                   </h3>
                   <p className="max-w-2xl text-xs font-medium text-white/30 sm:text-sm">Visualización de tráfico único diario acumulado en el tiempo.</p>
                </div>
                <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 lg:items-end">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-white/20 font-display">Pico de tráfico</div>
                    <div className="text-xl font-black tracking-tight text-white/70 font-display sm:text-2xl">{peakDay?.count || 0} <span className="ml-1 text-[10px] uppercase text-white/20">vistas</span></div>
                    <div className="mt-1 text-[10px] text-white/20 font-mono">{peakDay?.date ? new Date(peakDay.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : ''}</div>
                </div>
            </div>
            {data?.dailyVisitors && data.dailyVisitors.length > 0 && (
                <>
                  <SparklineChart data={data.dailyVisitors} accentColor={accentColor} />
                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {summaryChips.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{item.label}</div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-white">{formatNum(item.value)}</div>
                      </div>
                    ))}
                  </div>
                </>
            )}
        </SectionCard>

        {/* Origin / Sources */}
        <SectionCard
          title="Orígenes de tráfico"
          description="De dónde llega tu audiencia y qué canal te está trayendo mejores visitas."
          badge={`${data?.referrers?.length || 0} fuentes`}
          tabs={['Referrer']}
          activeTab={referrerTab}
          setActiveTab={setReferrerTab}
          className="md:col-span-1 xl:col-span-4"
        >
          <div className="space-y-1">
            {(data?.referrers || []).length === 0 ? (
                <EmptyState
                  icon={Globe2}
                  title="Esperando visitas"
                  description="Todavía no hay referencias detectadas. Cuando lleguen visitas vas a ver qué canales mejor convierten."
                />
            ) : (
                (data?.referrers || []).slice(0, 8).map((item, i) => (
                <BarRow
                    key={i}
                    label={item.source}
                    value={item.visitors}
                    max={maxRef}
                    accent={accentColor}
                    icon={getReferrerIcon(item.source)}
                    tooltip={item.source === 'Direct/None' ? 'Visitas directas, tráfico social no trackeado o sesiones privadas.' : undefined}
                />
                ))
            )}
          </div>
        </SectionCard>

        {/* Browser / Tech */}
        <SectionCard
          title="Tecnología"
          description="Con qué dispositivos, sistemas y navegadores están viendo tu perfil."
          badge={locationTab}
          tabs={['Browser', 'OS', 'Device']}
          activeTab={locationTab}
          setActiveTab={setLocationTab}
          className="md:col-span-1 xl:col-span-4"
        >
          <div className="space-y-1">
            {locationTab === 'Browser' && (
                <>
                {(data?.browsers || []).length === 0 ? (
                    <EmptyState
                      icon={Monitor}
                      title="Sin datos de browser"
                      description="Todavía no hay suficiente actividad para segmentar navegadores."
                    />
                ) : (
                    (data?.browsers || []).slice(0, 8).map((item, i) => (
                    <BarRow
                        key={i}
                        label={item.browser}
                        value={item.visitors}
                        max={maxBrowser}
                        accent={accentColor}
                        icon={getBrowserEmoji(item.browser)}
                    />
                    ))
                )}
                </>
            )}
            {locationTab === 'OS' && (
                <>
                {(data?.operatingSystems || []).length === 0 ? (
                    <EmptyState
                      icon={Layout}
                      title="Sin datos de sistema"
                      description="A medida que entren más visitas, acá vas a ver el reparto por sistema operativo."
                    />
                ) : (
                    (data?.operatingSystems || []).slice(0, 8).map((item, i) => (
                    <BarRow
                        key={i}
                        label={item.os}
                        value={item.visitors}
                        max={maxOS}
                        accent={accentColor}
                        icon={item.os === 'Mac OS' ? '' : item.os === 'Windows' ? '田' : item.os === 'Android' ? 'A' : item.os === 'iOS' ? 'i' : '?' }
                    />
                    ))
                )}
                </>
            )}
             {locationTab === 'Device' && (
                <>
                {(data?.devices || []).length === 0 ? (
                    <EmptyState
                      icon={Monitor}
                      title="Sin mix de dispositivos"
                      description="Todavía no hay suficiente señal para separar mobile, tablet y desktop."
                    />
                ) : (
                    (data?.devices || []).map((item, i) => (
                    <BarRow
                        key={i}
                        label={item.device}
                        value={item.visitors}
                        max={data?.devices[0]?.visitors || 1}
                        accent={accentColor}
                        icon={item.device === 'Mobile' ? '📱' : item.device === 'Tablet' ? '💻' : '🖥️'}
                    />
                    ))
                )}
                </>
            )}
          </div>
        </SectionCard>

        {/* Content Leaderboard */}
        <SectionCard
          title="Ranking de bloques"
          description="Los elementos que más clics están generando dentro de tu board."
          badge={`${topBlocks.length} bloques`}
          className="md:col-span-2 xl:col-span-4"
        >
             <div className="space-y-1">
                {topBlocks.length === 0 ? (
                    <EmptyState
                      icon={MousePointer2}
                      title="Sin clics por ahora"
                      description="Cuando tu audiencia empiece a interactuar, acá vas a ver qué bloques funcionan mejor."
                    />
                ) : (
                    topBlocks.map((block, i) => (
                        <BarRow
                            key={block.id}
                            label={block.title}
                            value={block.clicks}
                            max={maxBlocks}
                            accent={accentColor}
                            sublabel={block.type}
                            icon={String(i + 1)}
                            tooltip={`Este bloque recibió ${block.clicks} interacciones únicas.`}
                        />
                    ))
                )}
            </div>
        </SectionCard>

        {/* Recent Activity / Visitors */}
        <SectionCard
          title="Visitas recientes"
          description="Últimos visitantes detectados con su fuente y contexto técnico."
          badge={`${Math.min(data?.recentVisitors?.length || 0, 10)} recientes`}
          className="md:col-span-2 xl:col-span-12"
        >
             <div className="space-y-3 md:hidden">
                {(data?.recentVisitors || []).length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Sin visitas registradas"
                    description="En cuanto lleguen visitas vas a poder ver el detalle de cada sesión reciente desde acá."
                  />
                ) : (
                  data?.recentVisitors.slice(0, 10).map((visitor) => (
                    <div key={visitor.id} className="rounded-[1.6rem] border border-white/[0.05] bg-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {visitor.visitor_avatar ? (
                            <img src={visitor.visitor_avatar} className="h-full w-full object-cover" alt="" />
                          ) : <Users size={16} className="text-white/20" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">
                            {visitor.visitor_username ? `@${visitor.visitor_username}` : (visitor.visitor_name || 'Anonymous Visitor')}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/20 font-mono">
                            {visitor.id.slice(0, 8)}... · {timeAgo(visitor.created_at)}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-tight text-white/50">
                              {visitor.referrer || 'Direct/Social'}
                            </span>
                            {visitor.device && (
                              <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                                {visitor.device === 'Mobile' ? '📱' : visitor.device === 'Tablet' ? '💻' : '🖥️'} {visitor.os}
                              </span>
                            )}
                            {visitor.browser && (
                              <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                                {getBrowserEmoji(visitor.browser)} {visitor.browser}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>

             <div className="hidden overflow-x-auto rounded-[1.75rem] border border-white/[0.05] bg-white/[0.02] md:block">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/[0.05]">
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Usuario / ID</th>
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Fuente</th>
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Referencia tech</th>
                            <th className="px-4 pb-4 pt-4 text-right text-[10px] font-black uppercase tracking-widest text-white/20">Tiempo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {(data?.recentVisitors || []).length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center">
                                     <Users className="mx-auto mb-4 h-10 w-10 text-white/5" />
                                     <p className="text-xs font-bold uppercase tracking-widest text-white/20">Aún no hay visitas registradas</p>
                                </td>
                            </tr>
                        ) : (
                            data?.recentVisitors.slice(0, 10).map((visitor, i) => (
                                <tr key={visitor.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[var(--accent)]/30 transition-colors">
                                                {visitor.visitor_avatar ? (
                                                    <img src={visitor.visitor_avatar} className="w-full h-full object-cover" alt="" />
                                                ) : <Users size={16} className="text-white/20" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white leading-none mb-1">
                                                    {visitor.visitor_username ? `@${visitor.visitor_username}` : (visitor.visitor_name || 'Anonymous Visitor')}
                                                </span>
                                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{visitor.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {visitor.referrer ? (
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-tight">{visitor.referrer}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-white/20 font-mono">Direct/Social</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {visitor.device && <span className="text-[10px] text-white/40">{visitor.device === 'Mobile' ? '📱' : '🖥️'} {visitor.os}</span>}
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            {visitor.browser && <span className="text-[10px] text-white/40">{getBrowserEmoji(visitor.browser)} {visitor.browser}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-xs font-mono text-white/30 font-bold">{timeAgo(visitor.created_at)}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
             
             <div className="mt-6 flex justify-center sm:mt-8">
                 <button className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 transition-colors hover:text-white/60">
                    Ver historial completo <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                 </button>
             </div>
        </SectionCard>

      </div>

      {/* ── CTA / Tip ── */}
      <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors pointer-events-none" />
        <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
             <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                <TrendingUp className="w-8 h-8 text-[var(--accent)]" />
             </div>
             <div className="min-w-0">
                <h4 className="text-xl font-black text-white mb-2">Maximiza tu visibilidad</h4>
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
                    Los bloques en la parte superior del perfil tienen un 40% más de interacción. 
                    Intenta mover tus proyectos más destacados a las primeras filas para capturar la atención de los reclutadores en los primeros 3 segundos.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    Top rows convierten mejor
                  </div>
                  <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    Revisá bloques con menos clicks
                  </div>
                </div>
             </div>
             <div className="w-full md:ml-auto md:w-auto">
                 <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-accent !w-full !rounded-2xl !px-8 !py-4 !text-sm font-[950] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)] md:!w-auto">
                    Optimizar mi board
                 </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
}
