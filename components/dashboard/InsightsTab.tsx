"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  LucideIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Tooltip } from "@/components/ui/Tooltip";
import Link from "next/link";

type TFn = (key: string, values?: Record<string, any>) => string;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyPoint { date: string; count: number; }
interface ReferrerItem { source: string; visitors: number; }
interface BrowserItem { browser: string; visitors: number; }
interface OSItem { os: string; visitors: number; }
interface DeviceItem { device: string; visitors: number; }
interface ClickedBlock { block_id: string; clicks: number; }

interface RecentVisitor {
  id: string;
  visitor_user_id: string | null;
  visitor_username: string | null;
  visitor_name: string | null;
  visitor_avatar: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  created_at: string;
  page_views: number;
  block_clicks: number;
  visits: number;
  clicked_blocks: ClickedBlock[];
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
  totalRecentVisitors: number;
  rangeDays: number;
  startDate: string;
  endDate: string;
  granularity: "hour" | "day";
  onlineNow: number;
}

interface Props {
  accentColor: string;
  blocks: any[];
  subscriptionTier?: "free" | "pro";
  onOptimizeBoard?: () => void;
  onLastTrialViewConsumed?: () => void;
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
    'X': '✦',
    'Google': '🔎',
    'Facebook': '👥',
    'Instagram': '📸',
    'LinkedIn': '💼',
    'YouTube': '▶',
    'Reddit': '💬',
    'TikTok': '🎵',
    'GitHub': '🐙',
    'Direct/None': '↗',
  };
  return map[source] || source.charAt(0).toUpperCase();
}

function getBrowserEmoji(browser: string): string {
  const map: Record<string, string> = {
    'Chrome': '◎',
    'Safari': '🧭',
    'Firefox': '🦊',
    'Edge': '🌊',
    'Opera': '◉',
    'Samsung Internet': '📱',
    'Instagram': '📷',
    'Facebook': '🔵',
    'Twitter': '✦',
    'LinkedIn': '💼',
  };
  return map[browser] || '🌐';
}

function getOSTooltip(os: string, t: TFn): string {
  const keys: Record<string, string> = {
    'Mac OS': 'insights.osTooltipMacOs',
    'Windows': 'insights.osTooltipWindows',
    'iOS': 'insights.osTooltipIos',
    'Android': 'insights.osTooltipAndroid',
    'Linux': 'insights.osTooltipLinux',
  };
  return keys[os] ? t(keys[os]) : t('insights.osTooltipDefault');
}

function getBrowserTooltip(browser: string, t: TFn): string {
  const keys: Record<string, string> = {
    'Chrome': 'insights.browserTooltipChrome',
    'Safari': 'insights.browserTooltipSafari',
    'Firefox': 'insights.browserTooltipFirefox',
    'Edge': 'insights.browserTooltipEdge',
    'Samsung Internet': 'insights.browserTooltipSamsung',
    'Instagram': 'insights.browserTooltipInstagram',
    'Facebook': 'insights.browserTooltipFacebook',
    'LinkedIn': 'insights.browserTooltipLinkedin',
  };
  return keys[browser] ? t(keys[browser]) : t('insights.browserTooltipDefault');
}

function getReferrerTooltip(source: string, t: TFn): string {
  const keys: Record<string, string> = {
    'X': 'insights.referrerTooltipX',
    'Google': 'insights.referrerTooltipGoogle',
    'LinkedIn': 'insights.referrerTooltipLinkedin',
    'GitHub': 'insights.referrerTooltipGithub',
    'Instagram': 'insights.referrerTooltipInstagram',
    'YouTube': 'insights.referrerTooltipYoutube',
    'Direct/None': 'insights.referrerTooltipDirect',
  };
  return keys[source] ? t(keys[source]) : t('insights.referrerTooltipDefault', { source });
}

function getDeviceTooltip(device: string, t: TFn): string {
  const keys: Record<string, string> = {
    'Mobile': 'insights.deviceTooltipMobile',
    'Desktop': 'insights.deviceTooltipDesktop',
    'Tablet': 'insights.deviceTooltipTablet',
  };
  return keys[device] ? t(keys[device]) : t('insights.deviceTooltipDefault');
}

const DATE_FILTERS = [
  { label: '3M', value: 90 },
  { label: '1M', value: 30 },
  { label: '7D', value: 7 },
  { label: '1D', value: 1 },
];

function getVisitorAvatar(visitor: RecentVisitor) {
  return visitor.visitor_avatar || '/huevsite-avatar.png';
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

function SparklineChart({ data, accentColor, granularity }: { data: DailyPoint[]; accentColor: string; granularity: "hour" | "day" }) {
  const t = useTranslations("dashboard");
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
        const label = granularity === "hour"
          ? new Date(d.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          : `${d.date.split('-')[2]}/${d.date.split('-')[1]}`;
        ctx.fillText(label, padH + i * stepX, H - 12);
      }
    });
  }, [data, accentColor, maxVal, granularity]);

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
            <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">
              {granularity === "hour"
                ? new Date(tooltip.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                : new Date(tooltip.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_var(--accent-glow)]" style={{ backgroundColor: accentColor, '--accent-glow': accentColor } as any} />
              <span className="text-white text-lg font-black tracking-tight">{tooltip.count}</span>
              <span className="text-white/30 text-[10px] font-bold">{t("insights.viewsUpper")}</span>
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
  onClick,
  active = false,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  icon?: string;
  sublabel?: string;
  tooltip?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 border-b py-3.5 text-left transition-all last:border-0 sm:gap-4 sm:px-1 ${
        active ? "border-white/[0.05] bg-white/[0.035]" : "border-white/[0.03]"
      } ${onClick ? "cursor-pointer hover:bg-white/[0.02]" : "cursor-default"}`}
    >
      <div className="z-10 flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
        {icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[12px] transition-colors ${
            active
              ? "border-[var(--accent)]/20 bg-[var(--accent-dim)]"
              : "border-white/5 bg-white/5 group-hover:bg-white/10"
          }`}>
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
            <span className={`shrink-0 text-sm font-black transition-colors ${active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
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
      <div className={`pointer-events-none absolute -inset-x-2 -inset-y-0.5 rounded-xl transition-opacity ${
        active ? "bg-[var(--accent)]/[0.08] opacity-100" : "bg-white/[0.01] opacity-0 group-hover:opacity-100"
      }`} />
    </button>
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
  const t = useTranslations("dashboard");
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
                aria-label={t("insights.moreInfoAbout", { label })}
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

export function InsightsTab({ accentColor, blocks, subscriptionTier, onOptimizeBoard, onLastTrialViewConsumed }: Props) {
  const t = useTranslations("dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referrerTab, setReferrerTab] = useState('Referrer');
  const [locationTab, setLocationTab] = useState('Browser');
  const [rangeDays, setRangeDays] = useState(1);
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorIdentityFilter, setVisitorIdentityFilter] = useState<"all" | "identified" | "anonymous">("all");
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<{ kind: "browser" | "os" | "device"; value: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const recentVisitorsRef = useRef<HTMLDivElement>(null);
  const VISITORS_PER_PAGE = 8;

  const fetchInsights = async ({ range = rangeDays }: { range?: number } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("range", String(range));
      const res = await fetch(`/api/analytics/insights?${params.toString()}`);
      if (!res.ok) throw new Error(t("insights.errorLoading"));
      const insights = await res.json();
      setData(insights);
      if (insights.lastTrialInsightsView) {
        onLastTrialViewConsumed?.();
      }
      setVisitorPage(1);
      setSelectedVisitorId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchInsights({ range: rangeDays });
  }, [rangeDays]);

  useEffect(() => {
    setSelectedTechnology(null);
    setVisitorIdentityFilter("all");
  }, [rangeDays]);

  const technologyFilteredVisitors = useMemo(() => {
    const visitors = data?.recentVisitors || [];
    if (!selectedTechnology) return visitors;

    return visitors.filter((visitor) => {
      if (selectedTechnology.kind === "browser") return visitor.browser === selectedTechnology.value;
      if (selectedTechnology.kind === "os") return visitor.os === selectedTechnology.value;
      return visitor.device === selectedTechnology.value;
    });
  }, [data?.recentVisitors, selectedTechnology]);

  const filteredReferrers = useMemo(() => {
    const counts = new Map<string, number>();

    for (const visitor of technologyFilteredVisitors) {
      const key = visitor.referrer || "Direct/None";
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 8);
  }, [technologyFilteredVisitors]);

  const filteredBlockStats = useMemo(() => {
    const counts = new Map<string, number>();

    for (const visitor of technologyFilteredVisitors) {
      for (const clicked of visitor.clicked_blocks) {
        counts.set(clicked.block_id, (counts.get(clicked.block_id) || 0) + clicked.clicks);
      }
    }

    return counts;
  }, [technologyFilteredVisitors]);

  const visibleVisitors = useMemo(() => {
    return technologyFilteredVisitors.filter((visitor) => {
      const isAnonymous = !visitor.visitor_user_id && !visitor.visitor_username;

      if (visitorIdentityFilter === "anonymous") return isAnonymous;
      if (visitorIdentityFilter === "identified") return !isAnonymous;
      return true;
    });
  }, [technologyFilteredVisitors, visitorIdentityFilter]);

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(visibleVisitors.length / VISITORS_PER_PAGE));
    if (visitorPage > maxPages) {
      setVisitorPage(maxPages);
    }
  }, [visibleVisitors.length, visitorPage]);

  useEffect(() => {
    if (selectedVisitorId && !visibleVisitors.some((visitor) => visitor.id === selectedVisitorId)) {
      setSelectedVisitorId(null);
    }
  }, [selectedVisitorId, visibleVisitors]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 animate-spin flex items-center justify-center" style={{ animationDuration: '3s' }}>
                <RefreshCw size={24} className="text-white/20" />
            </div>
            <div className="absolute -inset-4 bg-[var(--accent)]/10 blur-2xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase">{t("insights.loading")}</p>
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
          onClick={() => fetchInsights({ range: rangeDays })}
          className="btn-accent !py-2.5 !px-6 !rounded-xl !text-xs gap-2"
        >
          <RefreshCw size={14} /> {t("insights.retry")}
        </button>
      </div>
    );
  }

  // Block leaderboard
  const topBlocks = Array.from(filteredBlockStats.entries())
    .map(([id, clicks]) => {
      const block = blocks.find(b => b.id === id);
      return { id, clicks, title: block?.data?.title || block?.type || t("insights.blockFallback"), type: block?.type };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  const maxRef = filteredReferrers[0]?.visitors || 1;
  const maxBrowser = data?.browsers?.[0]?.visitors || 1;
  const maxOS = data?.operatingSystems?.[0]?.visitors || 1;
  const maxDevice = data?.devices?.[0]?.visitors || 1;
  const maxBlocks = topBlocks[0]?.clicks || 1;

  const peakDay = data?.dailyVisitors?.reduce((max, d) => d.count > max.count ? d : max, { date: '', count: 0 });
  const totalDailyVisitors = data?.dailyVisitors?.reduce((sum, day) => sum + day.count, 0) || 0;
  const averageDailyVisitors = data?.dailyVisitors?.length ? Math.round(totalDailyVisitors / data.dailyVisitors.length) : 0;
  const activeDays = data?.dailyVisitors?.filter((day) => day.count > 0).length || 0;
  const filteredTotalClicks = topBlocks.reduce((sum, block) => sum + block.clicks, 0);

  // huevsite attribution: clicks huevsite drove to the user's project links.
  const isPro = subscriptionTier === "pro";
  const projectClicks = topBlocks.filter((b) => b.type === "project");
  const projectClickTotal = projectClicks.reduce((s, b) => s + b.clicks, 0);
  const selectedVisitor = visibleVisitors.find((visitor) => visitor.id === selectedVisitorId) || null;
  const selectedVisitorIndex = selectedVisitor ? visibleVisitors.findIndex((visitor) => visitor.id === selectedVisitor.id) : -1;
  const totalVisitorPages = Math.max(1, Math.ceil(visibleVisitors.length / VISITORS_PER_PAGE));
  const paginatedVisitors = visibleVisitors.slice((visitorPage - 1) * VISITORS_PER_PAGE, visitorPage * VISITORS_PER_PAGE);
  const summaryChips = [
    { label: t("insights.summaryDailyAverage"), value: averageDailyVisitors },
    { label: t("insights.summaryActiveDays"), value: activeDays },
    { label: t("insights.summaryPeak"), value: peakDay?.count || 0 },
  ];
  const activeTechnologyLabel = selectedTechnology ? `${selectedTechnology.kind.toUpperCase()}: ${selectedTechnology.value}` : null;
  const activeVisitorFilterLabel = visitorIdentityFilter === "anonymous" ? t("insights.filterAnonymous") : visitorIdentityFilter === "identified" ? t("insights.filterIdentified") : null;

  const handleTechnologyToggle = (kind: "browser" | "os" | "device", value: string) => {
    setSelectedTechnology((current) => {
      const nextValue = current?.kind === kind && current.value === value ? null : { kind, value };
      setVisitorPage(1);
      return nextValue;
    });
  };

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
            <Tooltip content={t("insights.liveNowTooltip")} position="bottom">
                <div className="group flex cursor-help items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 transition-all animate-pulse hover:animate-none">
                    <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-500">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-60" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-xl leading-none">{data?.onlineNow || 0}</span>
                        <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">{t("insights.liveNow")}</span>
                    </div>
                </div>
            </Tooltip>

            <div className="hidden h-10 w-px bg-white/5 lg:block" />

            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:min-w-[160px]">
                <span className="text-white/60 text-xs font-bold font-mono tracking-tight">{t("insights.period")}</span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest font-black">
                  {data?.startDate === data?.endDate ? data?.startDate : `${data?.startDate} → ${data?.endDate}`}
                </span>
            </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02] p-1">
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRangeDays(filter.value)}
                className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                  rangeDays === filter.value
                    ? "bg-white text-black"
                    : "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchInsights({ range: rangeDays })}
          className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:border-white/20 hover:bg-white/10 sm:w-auto"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
            {t("insights.refreshData")}
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        <StatCard
          label={t("insights.kpiUniqueVisitors")}
          value={formatNum(data?.uniqueVisitors || 0)}
          icon={Users}
          accent={accentColor}
          trend="neutral"
          tooltip={t("insights.kpiUniqueVisitorsTooltip")}
        />
        <StatCard
          label={t("insights.kpiTotalViews")}
          value={formatNum(data?.totalPageViews || 0)}
          icon={BarChart3}
          accent={accentColor}
          sub="HUEVSITE"
          trend="neutral"
          tooltip={t("insights.kpiTotalViewsTooltip")}
        />
        <StatCard
          label={t("insights.kpiBounceRate")}
          value={`${data?.bounceRate || 0}%`}
          icon={TrendingUp}
          accent={accentColor}
          trend={data?.bounceRate && data.bounceRate < 60 ? 'up' : 'down'}
          tooltip={t("insights.kpiBounceRateTooltip")}
        />
        <StatCard
          label={t("insights.kpiCtr")}
          value={`${data?.ctr || 0}%`}
          icon={MousePointer2}
          accent={accentColor}
          sub="CLICKS"
          trend="neutral"
          tooltip={t("insights.kpiCtrTooltip")}
        />
      </div>

      {/* ── huevsite attribution ── */}
      <div className="rounded-3xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              {t("insights.attributionTitle")}
            </div>
            <div className="text-2xl font-[950] text-white tracking-tight mt-0.5">
              {formatNum(projectClickTotal)}{" "}
              <span className="text-xs font-black uppercase tracking-widest text-white/30">
                {t("insights.attributionClicks")}
              </span>
            </div>
          </div>
          <MousePointer2 size={20} className="text-[var(--accent)]" />
        </div>
        <p className="text-xs text-white/40 mb-3">{t("insights.attributionSubtitle")}</p>
        {isPro ? (
          projectClicks.length > 0 ? (
            <div className="space-y-1.5">
              {projectClicks.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-white/70">{b.title}</span>
                  <span className="font-black text-white shrink-0 ml-3">{formatNum(b.clicks)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">{t("insights.attributionEmpty")}</p>
          )
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/50">
            {t("insights.attributionProTeaser")}
          </div>
        )}
      </div>

      {/* ── Charts & Lists Grid ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:gap-4">
        
        {/* Main Chart */}
        <SectionCard
            title={t("insights.trafficTitle")}
            description={t("insights.trafficDescription")}
          badge={DATE_FILTERS.find((filter) => filter.value === rangeDays)?.label || `${rangeDays}d`}
            className="min-h-[320px] md:col-span-2 xl:col-span-12"
        >
             <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                   <h3 className="mb-2 flex flex-wrap items-end gap-x-3 gap-y-2 text-4xl tracking-tighter text-white font-[950] font-display sm:text-5xl">
                        {formatNum(data?.uniqueVisitors || 0)}
                        <span className="text-xs font-black uppercase tracking-[.25em] text-white/20 font-display sm:text-sm">{t("insights.totalBuilders")}</span>
                   </h3>
                   <p className="max-w-2xl text-xs font-medium text-white/30 sm:text-sm">{t("insights.trafficChartSubtitle")}</p>
                </div>
                <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 lg:items-end">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-white/20 font-display">{t("insights.peakTraffic")}</div>
                    <div className="text-xl font-black tracking-tight text-white/70 font-display sm:text-2xl">{peakDay?.count || 0} <span className="ml-1 text-[10px] uppercase text-white/20">{t("insights.viewsUnit")}</span></div>
                    <div className="mt-1 text-[10px] text-white/20 font-mono">{peakDay?.date ? new Date(peakDay.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : ''}</div>
                </div>
            </div>
            {data?.dailyVisitors && data.dailyVisitors.length > 0 && (
                <>
                  <SparklineChart data={data.dailyVisitors} accentColor={accentColor} granularity={data.granularity} />
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
          title={t("insights.sourcesTitle")}
          description={t("insights.sourcesDescription")}
          badge={activeTechnologyLabel || t("insights.sourcesBadge", { n: filteredReferrers.length })}
          tabs={['Referrer']}
          activeTab={referrerTab}
          setActiveTab={setReferrerTab}
          className="md:col-span-1 xl:col-span-4"
        >
          <div className="space-y-1">
            {filteredReferrers.length === 0 ? (
                <EmptyState
                  icon={Globe2}
                  title={t("insights.sourcesEmptyTitle")}
                  description={selectedTechnology ? t("insights.sourcesEmptyFiltered") : t("insights.sourcesEmptyDescription")}
                />
            ) : (
                filteredReferrers.map((item, i) => (
                <BarRow
                    key={i}
                    label={item.source}
                    value={item.visitors}
                    max={maxRef}
                    accent={accentColor}
                    icon={getReferrerIcon(item.source)}
                    tooltip={getReferrerTooltip(item.source, t)}
                />
                ))
            )}
          </div>
        </SectionCard>

        {/* Browser / Tech */}
        <SectionCard
          title={t("insights.technologyTitle")}
          description={t("insights.technologyDescription")}
          badge={activeTechnologyLabel || locationTab}
          tabs={['Browser', 'OS', 'Device']}
          activeTab={locationTab}
          setActiveTab={setLocationTab}
          className="md:col-span-1 xl:col-span-4"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {t("insights.tapRowToFilter")}
            </div>
            {selectedTechnology && (
              <button
                type="button"
                onClick={() => setSelectedTechnology(null)}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55 transition-all hover:border-white/20 hover:text-white"
              >
                {t("insights.clearFilter")}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {locationTab === 'Browser' && (
                <>
                {(data?.browsers || []).length === 0 ? (
                    <EmptyState
                      icon={Monitor}
                      title={t("insights.browserEmptyTitle")}
                      description={t("insights.browserEmptyDescription")}
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
                        tooltip={getBrowserTooltip(item.browser, t)}
                        active={selectedTechnology?.kind === "browser" && selectedTechnology.value === item.browser}
                        onClick={() => handleTechnologyToggle("browser", item.browser)}
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
                      title={t("insights.osEmptyTitle")}
                      description={t("insights.osEmptyDescription")}
                    />
                ) : (
                    (data?.operatingSystems || []).slice(0, 8).map((item, i) => (
                    <BarRow
                        key={i}
                        label={item.os}
                        value={item.visitors}
                        max={maxOS}
                        accent={accentColor}
                        icon={item.os === 'Mac OS' ? '🍎' : item.os === 'Windows' ? '🪟' : item.os === 'Android' ? '🤖' : item.os === 'iOS' ? '📱' : '💻' }
                        tooltip={getOSTooltip(item.os, t)}
                        active={selectedTechnology?.kind === "os" && selectedTechnology.value === item.os}
                        onClick={() => handleTechnologyToggle("os", item.os)}
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
                      title={t("insights.deviceEmptyTitle")}
                      description={t("insights.deviceEmptyDescription")}
                    />
                ) : (
                    (data?.devices || []).map((item, i) => (
                    <BarRow
                        key={i}
                        label={item.device}
                        value={item.visitors}
                        max={maxDevice}
                        accent={accentColor}
                        icon={item.device === 'Mobile' ? '📱' : item.device === 'Tablet' ? '💻' : '🖥️'}
                        tooltip={getDeviceTooltip(item.device, t)}
                        active={selectedTechnology?.kind === "device" && selectedTechnology.value === item.device}
                        onClick={() => handleTechnologyToggle("device", item.device)}
                    />
                    ))
                )}
                </>
            )}
          </div>
        </SectionCard>

        {/* Content Leaderboard */}
        <SectionCard
          title={t("insights.blocksRankingTitle")}
          description={t("insights.blocksRankingDescription")}
          badge={activeTechnologyLabel || t("insights.blocksRankingBadge", { n: topBlocks.length })}
          className="md:col-span-2 xl:col-span-4"
        >
             <div className="space-y-1">
                {topBlocks.length === 0 ? (
                    <EmptyState
                      icon={MousePointer2}
                      title={t("insights.blocksEmptyTitle")}
                      description={selectedTechnology ? t("insights.blocksEmptyFiltered") : t("insights.blocksEmptyDescription")}
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
                            tooltip={t("insights.blockShareTooltip", { pct: Math.round((block.clicks / Math.max(filteredTotalClicks || 1, 1)) * 100) })}
                        />
                    ))
                )}
            </div>
        </SectionCard>

        {/* Recent Activity / Visitors */}
        <SectionCard
          title={t("insights.recentVisitsTitle")}
          description={t("insights.recentVisitsDescription")}
          badge={activeVisitorFilterLabel || activeTechnologyLabel || t("insights.recentVisitsBadge", { n: visibleVisitors.length })}
          className="md:col-span-2 xl:col-span-12"
        >
             <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { label: t("insights.visitorFilterAll"), value: "all" },
                  { label: t("insights.visitorFilterIdentified"), value: "identified" },
                  { label: t("insights.visitorFilterAnonymous"), value: "anonymous" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setVisitorIdentityFilter(filter.value as "all" | "identified" | "anonymous");
                      setVisitorPage(1);
                    }}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      visitorIdentityFilter === filter.value
                        ? "border-white/20 bg-white text-black"
                        : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
             </div>
             <div ref={recentVisitorsRef} className="space-y-3 md:hidden">
                {visibleVisitors.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title={t("insights.visitorsEmptyTitle")}
                    description={visitorIdentityFilter === "anonymous" ? t("insights.visitorsEmptyAnonymous") : selectedTechnology ? t("insights.visitorsEmptyFiltered") : t("insights.visitorsEmptyDescription")}
                  />
                ) : (
                  paginatedVisitors.map((visitor) => (
                    <button
                      key={visitor.id}
                      type="button"
                      onClick={() => setSelectedVisitorId(visitor.id)}
                      className="w-full rounded-[1.6rem] border border-white/[0.05] bg-white/[0.02] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all hover:border-white/[0.14]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {visitor.visitor_avatar ? (
                            <img src={getVisitorAvatar(visitor)} className="h-full w-full object-cover" alt="" />
                          ) : <img src={getVisitorAvatar(visitor)} className="h-full w-full object-cover" alt="" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">
                            {visitor.visitor_username ? `@${visitor.visitor_username}` : (visitor.visitor_name || 'Anonymous Visitor')}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/20 font-mono">
                            {visitor.id.slice(0, 8)}... · {timeAgo(visitor.created_at)} · {t("insights.viewsCount", { n: visitor.page_views })}
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
                    </button>
                  ))
                )}
             </div>

             <div className="hidden min-h-[520px] overflow-hidden rounded-[1.75rem] border border-white/[0.05] bg-white/[0.02] md:flex md:flex-col">
                <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/[0.05]">
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">{t("insights.tableUserId")}</th>
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">{t("insights.tableSource")}</th>
                            <th className="px-4 pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-white/20">{t("insights.tableTechReference")}</th>
                            <th className="px-4 pb-4 pt-4 text-right text-[10px] font-black uppercase tracking-widest text-white/20">{t("insights.tableTime")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {visibleVisitors.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center">
                                     <Users className="mx-auto mb-4 h-10 w-10 text-white/5" />
                                     <p className="text-xs font-bold uppercase tracking-widest text-white/20">{t("insights.tableEmpty")}</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedVisitors.map((visitor, i) => (
                                <tr key={visitor.id} className="group cursor-pointer transition-colors hover:bg-white/[0.02]" onClick={() => setSelectedVisitorId(visitor.id)}>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[var(--accent)]/30 transition-colors">
                                                {visitor.visitor_avatar ? (
                                                    <img src={getVisitorAvatar(visitor)} className="w-full h-full object-cover" alt="" />
                                                ) : <img src={getVisitorAvatar(visitor)} className="w-full h-full object-cover" alt="" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white leading-none mb-1">
                                                    {visitor.visitor_username ? `@${visitor.visitor_username}` : (visitor.visitor_name || 'Anonymous Visitor')}
                                                </span>
                                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                                                  {visitor.id.slice(0, 8)}... {visitor.city || visitor.country ? `· ${[visitor.city, visitor.country].filter(Boolean).join(", ")}` : ""}
                                                </span>
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
                                            {visitor.device && <span className="text-[10px] text-white/40">{visitor.device === 'Mobile' ? '📱' : visitor.device === 'Tablet' ? '💻' : '🖥️'} {visitor.os}</span>}
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            {visitor.browser && <span className="text-[10px] text-white/40">{getBrowserEmoji(visitor.browser)} {visitor.browser}</span>}
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] text-white/40">{t("insights.pvClicks", { pv: visitor.page_views, clicks: visitor.block_clicks })}</span>
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
             </div>
             
             {visibleVisitors.length > 0 && (
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                  {t("insights.paginationShowing", { from: (visitorPage - 1) * VISITORS_PER_PAGE + 1, to: Math.min(visitorPage * VISITORS_PER_PAGE, visibleVisitors.length), total: visibleVisitors.length })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitorPage((page) => Math.max(1, page - 1))}
                    disabled={visitorPage === 1}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/55 transition-all hover:border-white/20 hover:text-white disabled:opacity-30"
                  >
                    {t("insights.previous")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitorPage((page) => Math.min(totalVisitorPages, page + 1))}
                    disabled={visitorPage === totalVisitorPages}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/55 transition-all hover:border-white/20 hover:text-white disabled:opacity-30"
                  >
                    {t("insights.next")}
                  </button>
                </div>
              </div>
             )}
             <div className="mt-4 flex justify-center">
                 <button className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 transition-colors hover:text-white/60">
                    {t("insights.exploreEachVisit")} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                 </button>
             </div>
        </SectionCard>

      {mounted && createPortal(
        <AnimatePresence>
          {selectedVisitor && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2200] bg-black/90 backdrop-blur-xl"
                onClick={() => setSelectedVisitorId(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                className="fixed inset-0 z-[2210] p-0 sm:p-3 lg:p-4"
              >
              <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050507] shadow-[0_50px_180px_rgba(0,0,0,0.78)]">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#050507] px-5 py-4 sm:px-6">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">
                  {t("insights.visitorOfTotal", { index: selectedVisitorIndex + 1, total: visibleVisitors.length || 0 })}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVisitorId(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition-all hover:border-white/20 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#050507] p-5 sm:p-6 md:p-8">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/5">
                      <img src={getVisitorAvatar(selectedVisitor)} className="h-full w-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-black tracking-tight text-white">
                        {selectedVisitor.visitor_username ? `@${selectedVisitor.visitor_username}` : (selectedVisitor.visitor_name || 'Anonymous Visitor')}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        {selectedVisitor.visitor_name && selectedVisitor.visitor_username ? selectedVisitor.visitor_name : t("insights.visitorOfYourHuevsite")}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/25 font-mono">
                        {selectedVisitor.city || selectedVisitor.country ? [selectedVisitor.city, selectedVisitor.country].filter(Boolean).join(", ") : t("insights.locationUnavailable")} · {timeAgo(selectedVisitor.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVisitor.visitor_username && (
                      <Link
                        href={`/${selectedVisitor.visitor_username}?from=insights&return_to=/dashboard?tab=insights`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/70 transition-all hover:border-white/20 hover:text-white"
                      >
                        {t("insights.viewProfile")} <ExternalLink size={14} />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVisitorId(null);
                        recentVisitorsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/65 transition-all hover:border-white/20 hover:text-white"
                    >
                      {t("insights.backToVisits")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-[1.6rem] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.statSessions")}</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">{selectedVisitor.visits}</div>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.statPageViews")}</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">{selectedVisitor.page_views}</div>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.statClicks")}</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">{selectedVisitor.block_clicks}</div>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.statSource")}</div>
                    <div className="mt-2 text-sm font-black tracking-tight text-white">{selectedVisitor.referrer || "Direct/Social"}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.technicalContext")}</div>
                    <div className="space-y-2 text-sm text-white/60">
                      <div>{selectedVisitor.device || t("insights.unknownDevice")} · {selectedVisitor.os || t("insights.unknownOs")}</div>
                      <div>{selectedVisitor.browser || t("insights.unknownBrowser")}</div>
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/25">{t("insights.interactionTitle")}</div>
                    {selectedVisitor.clicked_blocks.length > 0 ? (
                      <div className="space-y-2">
                        {selectedVisitor.clicked_blocks.slice(0, 6).map((clicked) => {
                          const block = blocks.find((item) => item.id === clicked.block_id);
                          const blockLabel = (block as any)?.title || (block as any)?.label || (block as any)?.name || block?.type || t("insights.blockFallback");
                          return (
                            <div key={clicked.block_id} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2">
                              <span className="truncate text-sm font-bold text-white/75">{blockLabel}</span>
                              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{t("insights.clicksCount", { n: clicked.clicks })}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-white/35">{t("insights.noClicksInPeriod")}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#050507] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    const previousVisitor = visibleVisitors[selectedVisitorIndex - 1];
                    if (previousVisitor) setSelectedVisitorId(previousVisitor.id);
                  }}
                  disabled={selectedVisitorIndex <= 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/65 transition-all hover:border-white/20 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> {t("insights.previous")}
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                  {t("insights.navigateWithoutClosing")}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVisitor = visibleVisitors[selectedVisitorIndex + 1];
                    if (nextVisitor) setSelectedVisitorId(nextVisitor.id);
                  }}
                  disabled={selectedVisitorIndex === -1 || selectedVisitorIndex >= visibleVisitors.length - 1}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/65 transition-all hover:border-white/20 hover:text-white disabled:opacity-30"
                >
                  {t("insights.next")} <ChevronRight size={14} />
                </button>
              </div>
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      </div>

      {/* ── CTA / Tip ── */}
      <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors pointer-events-none" />
        <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
             <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                <TrendingUp className="w-8 h-8 text-[var(--accent)]" />
             </div>
             <div className="min-w-0">
                <h4 className="text-xl font-black text-white mb-2">{t("insights.ctaTitle")}</h4>
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
                    {t("insights.ctaDescription")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    {t("insights.ctaPillTopRows")}
                  </div>
                  <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    {t("insights.ctaPillReviewBlocks")}
                  </div>
                </div>
             </div>
             <div className="w-full md:ml-auto md:w-auto">
                 <button
                   onClick={() => {
                     if (onOptimizeBoard) {
                       onOptimizeBoard();
                       return;
                     }
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   className="btn-accent !w-full !rounded-2xl !px-8 !py-4 !text-sm font-[950] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)] md:!w-auto"
                 >
                    {t("insights.optimizeBoard")}
                 </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
}
