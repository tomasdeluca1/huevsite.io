"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  MousePointer2,
  BarChart3,
  TrendingUp,
  Loader2,
  AlertCircle,
  Globe,
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Clock,
  Layout,
  Globe2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        className="w-full h-[220px]"
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
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  icon?: string;
  sublabel?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/[0.03] last:border-0 group relative">
      <div className="flex items-center gap-3.5 flex-1 min-w-0 z-10">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[12px] shrink-0 border border-white/5 group-hover:bg-white/10 transition-colors">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors truncate">
              {label}
            </span>
            <span className="text-sm font-black text-white/80 group-hover:text-white transition-colors">
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
      <div className="absolute -inset-x-2 -inset-y-0.5 rounded-xl bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  tabs,
  activeTab,
  setActiveTab,
  children,
  className = "",
}: {
  title?: string;
  tabs?: string[];
  activeTab?: string;
  setActiveTab?: (t: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white/[0.015] border border-white/[0.05] backdrop-blur-sm overflow-hidden flex flex-col ${className}`}>
      {(title || tabs) && (
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
          {title && <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] font-display">{title}</span>}
          {tabs && (
            <div className="flex items-center gap-4">
               {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab?.(tab)}
                        className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all relative py-1 px-3 rounded-lg font-display ${
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
      <div className="p-6 flex-1">{children}</div>
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
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: typeof Users;
}) {
  return (
    <motion.div 
        whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="flex flex-col justify-between p-6 rounded-3xl bg-white/[0.015] border border-white/[0.05] hover:border-white/20 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,var(--glow-color)_0%,transparent_70%)] opacity-10 blur-2xl pointer-events-none" style={{ '--glow-color': accent } as any} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {trend && trend !== 'neutral' && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend === 'up' ? 'Good' : 'Drop'}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <div className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 font-display">{label}</div>
        <div className="flex items-baseline gap-2">
            <div className="text-4xl font-[950] text-white tracking-tighter leading-none font-display">{value}</div>
            {sub && <span className="text-[9px] text-white/10 font-bold uppercase tracking-widest translate-y-[-2px] font-display">{sub}</span>}
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
  const [visitorsTab, setVisitorsTab] = useState('Recent');

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-4 py-2 gap-3 group">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-60" />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-black text-xl leading-none">{data?.onlineNow || 0}</span>
                    <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">Live now</span>
                </div>
            </div>
            
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            
            <div className="flex flex-col">
                <span className="text-white/60 text-xs font-bold font-mono tracking-tight">Periodo</span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest font-black">Últimos 30 días</span>
            </div>
        </div>

        <button
          onClick={fetchInsights}
          className="flex items-center gap-2.5 px-5 h-12 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all text-xs text-white/60 font-black uppercase tracking-widest group"
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
          Actualizar datos
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Visitantes únicos"
          value={formatNum(data?.uniqueVisitors || 0)}
          icon={Users}
          accent={accentColor}
          trend="neutral"
        />
        <StatCard
          label="Vistas totales"
          value={formatNum(data?.totalPageViews || 0)}
          icon={BarChart3}
          accent={accentColor}
          sub="HUEVSITE"
          trend="neutral"
        />
        <StatCard
          label="Tasa de Rebote"
          value={`${data?.bounceRate || 0}%`}
          icon={TrendingUp}
          accent={accentColor}
          trend={data?.bounceRate && data.bounceRate < 60 ? 'up' : 'down'}
        />
        <StatCard
          label="Interacción (CTR)"
          value={`${data?.ctr || 0}%`}
          icon={MousePointer2}
          accent={accentColor}
          sub="CLICKS"
          trend="neutral"
        />
      </div>

      {/* ── Charts & Lists Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <SectionCard 
            title="Tráfico de audiencia" 
            className="lg:col-span-3 min-h-[400px]"
        >
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-5xl font-[950] text-white tracking-tighter mb-1 font-display">
                        {formatNum(data?.uniqueVisitors || 0)}
                        <span className="text-sm font-black text-white/20 uppercase tracking-[.25em] ml-4 font-display">Builders totales</span>
                   </h3>
                   <p className="text-white/30 text-xs font-medium">Visualización de tráfico único diario acumulado en el tiempo.</p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[.2em] mb-1 font-display">Pico de tráfico</div>
                    <div className="text-2xl font-black text-white/70 tracking-tight font-display">{peakDay?.count || 0} <span className="text-[10px] text-white/20 uppercase ml-1">vistas</span></div>
                    <div className="text-[10px] font-mono text-white/20 mt-1">{peakDay?.date ? new Date(peakDay.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : ''}</div>
                </div>
            </div>
            {data?.dailyVisitors && data.dailyVisitors.length > 0 && (
                <SparklineChart data={data.dailyVisitors} accentColor={accentColor} />
            )}
        </SectionCard>

        {/* Origin / Sources */}
        <SectionCard
          title="Orígenes de tráfico"
          tabs={['Referrer']}
          activeTab={referrerTab}
          setActiveTab={setReferrerTab}
          className="lg:col-span-1"
        >
          <div className="space-y-1">
            {(data?.referrers || []).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                    <Globe2 className="w-8 h-8 text-white/5" />
                    <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Esperando visitas...</span>
                </div>
            ) : (
                (data?.referrers || []).slice(0, 8).map((item, i) => (
                <BarRow
                    key={i}
                    label={item.source}
                    value={item.visitors}
                    max={maxRef}
                    accent={accentColor}
                    icon={getReferrerIcon(item.source)}
                />
                ))
            )}
          </div>
        </SectionCard>

        {/* Browser / Tech */}
        <SectionCard
          title="Tecnología"
          tabs={['Browser', 'OS', 'Device']}
          activeTab={locationTab}
          setActiveTab={setLocationTab}
          className="lg:col-span-1"
        >
          <div className="space-y-1">
            {locationTab === 'Browser' && (
                <>
                {(data?.browsers || []).length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                        <Monitor className="w-8 h-8 text-white/5" />
                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">No hay datos</span>
                    </div>
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
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                         <Layout className="w-8 h-8 text-white/5" />
                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Cargando...</span>
                    </div>
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
                    <div className="py-20 text-center text-white/20 text-[10px] font-black uppercase">Direct only</div>
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
        <SectionCard title="Ranking de bloques" className="lg:col-span-1">
             <div className="space-y-1">
                {topBlocks.length === 0 ? (
                    <div className="py-20 text-center text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">Sin clics por ahora</div>
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
                        />
                    ))
                )}
            </div>
        </SectionCard>

        {/* Recent Activity / Visitors */}
        <SectionCard title="Visitas recientes" className="lg:col-span-3">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/[0.05]">
                            <th className="pb-4 px-2 text-[10px] font-black uppercase tracking-widest text-white/20">Usuario / ID</th>
                            <th className="pb-4 px-2 text-[10px] font-black uppercase tracking-widest text-white/20">Fuente</th>
                            <th className="pb-4 px-2 text-[10px] font-black uppercase tracking-widest text-white/20">Referencia tech</th>
                            <th className="pb-4 px-2 text-[10px] font-black uppercase tracking-widest text-white/20 text-right">Tiempo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {(data?.recentVisitors || []).length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center">
                                     <Users className="w-10 h-10 text-white/5 mx-auto mb-4" />
                                     <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Aún no hay visitas registradas</p>
                                </td>
                            </tr>
                        ) : (
                            data?.recentVisitors.slice(0, 10).map((visitor, i) => (
                                <tr key={visitor.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-2">
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
                                    <td className="py-4 px-2">
                                        {visitor.referrer ? (
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-tight">{visitor.referrer}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-white/20 font-mono">Direct/Social</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-3">
                                            {visitor.device && <span className="text-[10px] text-white/40">{visitor.device === 'Mobile' ? '📱' : '🖥️'} {visitor.os}</span>}
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            {visitor.browser && <span className="text-[10px] text-white/40">{getBrowserEmoji(visitor.browser)} {visitor.browser}</span>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <span className="text-xs font-mono text-white/30 font-bold">{timeAgo(visitor.created_at)}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
             
             <div className="mt-8 flex justify-center">
                 <button className="flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white/60 transition-colors uppercase tracking-[0.3em] group">
                    Ver historial completo <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                 </button>
             </div>
        </SectionCard>

      </div>

      {/* ── CTA / Tip ── */}
      <div className="relative p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 shadow-2xl">
                <TrendingUp className="w-8 h-8 text-[var(--accent)]" />
             </div>
             <div>
                <h4 className="text-xl font-black text-white mb-2">Maximiza tu visibilidad</h4>
                <p className="text-[var(--text-dim)] text-sm max-w-xl leading-relaxed">
                    Los bloques en la parte superior del perfil tienen un 40% más de interacción. 
                    Intenta mover tus proyectos más destacados a las primeras filas para capturar la atención de los reclutadores en los primeros 3 segundos.
                </p>
             </div>
             <div className="md:ml-auto">
                 <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-accent !px-8 !py-4 !rounded-2xl !text-sm font-[950] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                    Optimizar mi board
                 </button>
             </div>
        </div>
      </div>
    </motion.div>
  );
}
