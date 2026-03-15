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
  Clock
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const padB = 28;
    const padT = 12;
    const padH = 8;
    const chartH = H - padB - padT;
    const stepX = (W - padH * 2) / (data.length - 1);

    ctx.clearRect(0, 0, W, H);

    const pts = data.map((d, i) => ({
      x: padH + i * stepX,
      y: padT + chartH - (d.count / maxVal) * chartH
    }));

    // Draw bars
    const barW = stepX * 0.5;
    data.forEach((d, i) => {
      const x = padH + i * stepX;
      const barH = (d.count / maxVal) * chartH;
      const y = padT + chartH - barH;
      ctx.fillStyle = accentColor + '33';
      ctx.beginPath();
      ctx.roundRect(x - barW / 2, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();
    });

    // Draw smooth line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const cpX = (pts[i].x + pts[i + 1].x) / 2;
      const cpY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, cpX, cpY);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = accentColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill gradient under line
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    gradient.addColorStop(0, accentColor + '22');
    gradient.addColorStop(1, accentColor + '00');
    ctx.lineTo(pts[pts.length - 1].x, padT + chartH);
    ctx.lineTo(pts[0].x, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw dots
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
    });

    // X-axis labels (show every ~5 days)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (i === 0 || i === data.length - 1 || i % 7 === 0) {
        const parts = d.date.split('-');
        const label = `${parts[2]}/${parts[1]}`;
        ctx.fillText(label, padH + i * stepX, H - 6);
      }
    });
  }, [data, accentColor, maxVal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = canvas.width;
    const padH = 8;
    const stepX = (W - padH * 2) / (data.length - 1);
    const idx = Math.min(Math.max(Math.round((mouseX - padH) / stepX), 0), data.length - 1);
    const d = data[idx];
    const x = padH + idx * stepX;
    setTooltip({ x: (x / W) * 100, y: 20, date: d.date, count: d.count });
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={900}
        height={200}
        className="w-full h-[180px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair' }}
      />
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm z-20"
            style={{ left: `${Math.min(Math.max(tooltip.x, 5), 80)}%`, top: '10px' }}
          >
            <div className="text-white/40 text-[10px] font-mono mb-1">{tooltip.date}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-white font-bold">{tooltip.count}</span>
              <span className="text-white/40 text-[10px]">visitors</span>
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
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0 group">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {icon && (
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] shrink-0 border border-white/5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="relative h-7 flex items-center">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-md transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: accent + '22' }}
            />
            <span className="relative text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate pl-2">
              {label}
            </span>
          </div>
          {sublabel && <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest">{sublabel}</div>}
        </div>
      </div>
      <span className="text-sm font-black text-white/70 shrink-0">{formatNum(value)}</span>
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
}: {
  title?: string;
  tabs?: string[];
  activeTab?: string;
  setActiveTab?: (t: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      {(title || tabs) && (
        <div className="flex items-center gap-4 px-5 pt-4 pb-3 border-b border-white/[0.05]">
          {title && <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</span>}
          {tabs && tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab?.(tab)}
              className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors pb-0.5 ${
                activeTab === tab
                  ? 'text-white border-b border-white'
                  : 'text-white/25 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div className="px-5 py-3">{children}</div>
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
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        {trend && trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-white tracking-tight">{value}</div>
        <div className="text-[11px] text-white/40 font-semibold mt-0.5">{label}</div>
        {sub && <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest mt-1">{sub}</div>}
      </div>
    </div>
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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: accentColor }} />
        <p className="text-white/30 text-xs font-mono tracking-widest uppercase">Crunching data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-500/40" />
        <p className="text-white/50 text-sm">{error}</p>
        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw size={12} /> Reintentar
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border"
            style={{ borderColor: accentColor + '40', color: accentColor }}
          >
            <Circle size={6} className="fill-current animate-pulse" />
            {data?.onlineNow || 0} online now
          </div>
        </div>
        <button
          onClick={fetchInsights}
          className="flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/50 transition-colors font-mono uppercase tracking-widest"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Unique Visitors"
          value={formatNum(data?.uniqueVisitors || 0)}
          sub="Last 30 days"
          accent={accentColor}
          icon={Users}
        />
        <StatCard
          label="Total Page Views"
          value={formatNum(data?.totalPageViews || 0)}
          sub="All time"
          accent={accentColor}
          icon={BarChart3}
        />
        <StatCard
          label="Bounce Rate"
          value={`${data?.bounceRate || 0}%`}
          sub="Single-visit sessions"
          accent={accentColor}
          trend={data?.bounceRate && data.bounceRate < 60 ? 'up' : 'down'}
          icon={TrendingUp}
        />
        <StatCard
          label="CTR"
          value={`${data?.ctr || 0}%`}
          sub="Clicks / Views"
          accent={accentColor}
          icon={MousePointer2}
        />
      </div>

      {/* ── Visitors Chart ── */}
      {data?.dailyVisitors && data.dailyVisitors.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Visitors — Last 30 Days</div>
              <div className="text-2xl font-black text-white">{formatNum(data.uniqueVisitors)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest">Peak day</div>
              <div className="text-sm font-black text-white/60">{peakDay?.count || 0}</div>
              <div className="text-[9px] text-white/20 font-mono">{peakDay?.date?.slice(5) || ''}</div>
            </div>
          </div>
          <SparklineChart data={data.dailyVisitors} accentColor={accentColor} />
        </div>
      )}

      {/* ── Referrers + Browsers/OS/Device ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Referrers */}
        <SectionCard
          tabs={['Referrer']}
          activeTab={referrerTab}
          setActiveTab={setReferrerTab}
        >
          <div className="flex justify-between mb-1 px-0.5">
            <span className="text-[9px] text-white/20 font-mono uppercase">Source</span>
            <span className="text-[9px] text-white/20 font-mono uppercase">Visitors ↓</span>
          </div>
          {(data?.referrers || []).length === 0 ? (
            <div className="py-10 text-center text-white/20 text-xs">No referrer data yet</div>
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
        </SectionCard>

        {/* Browser / OS / Device */}
        <SectionCard
          tabs={['Browser', 'OS', 'Device']}
          activeTab={locationTab}
          setActiveTab={setLocationTab}
        >
          <div className="flex justify-between mb-1 px-0.5">
            <span className="text-[9px] text-white/20 font-mono uppercase">{locationTab}</span>
            <span className="text-[9px] text-white/20 font-mono uppercase">Visitors ↓</span>
          </div>
          {locationTab === 'Browser' && (
            <>
              {(data?.browsers || []).length === 0 ? (
                <div className="py-10 text-center text-white/20 text-xs">No data yet</div>
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
                <div className="py-10 text-center text-white/20 text-xs">No data yet</div>
              ) : (
                (data?.operatingSystems || []).slice(0, 8).map((item, i) => (
                  <BarRow
                    key={i}
                    label={item.os}
                    value={item.visitors}
                    max={maxOS}
                    accent={accentColor}
                  />
                ))
              )}
            </>
          )}
          {locationTab === 'Device' && (
            <>
              {(data?.devices || []).length === 0 ? (
                <div className="py-10 text-center text-white/20 text-xs">No data yet</div>
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
        </SectionCard>
      </div>

      {/* ── Block Leaderboard ── */}
      {topBlocks.length > 0 && (
        <SectionCard title="Block Click Leaderboard">
          <div className="flex justify-between mb-1 px-0.5">
            <span className="text-[9px] text-white/20 font-mono uppercase">Block</span>
            <span className="text-[9px] text-white/20 font-mono uppercase">Clicks ↓</span>
          </div>
          {topBlocks.map((block, i) => (
            <BarRow
              key={block.id}
              label={block.title}
              value={block.clicks}
              max={maxBlocks}
              accent={accentColor}
              sublabel={block.type}
              icon={String(i + 1)}
            />
          ))}
        </SectionCard>
      )}

      {/* ── Recent Visitors ── */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-4 px-5 pt-4 pb-3 border-b border-white/[0.05]">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Profile Visitors</span>
          <div className="ml-auto flex items-center gap-1 text-[9px] text-white/20 font-mono">
            <Clock size={9} /> Last 30 days
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(data?.recentVisitors || []).length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-white/20 text-sm mb-2">No visitors tracked yet</div>
              <div className="text-white/10 text-xs">Share your profile to start seeing visitors here</div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-3 px-5 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
                <span>Visitor</span>
                <span className="hidden sm:block">Source</span>
                <span className="text-right">Time</span>
              </div>
              {(data?.recentVisitors || []).slice(0, 15).map((visitor, i) => (
                <motion.div
                  key={visitor.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Visitor info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {visitor.visitor_avatar ? (
                        <img src={visitor.visitor_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={14} className="text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/70">
                        {visitor.visitor_username
                          ? `@${visitor.visitor_username}`
                          : visitor.visitor_name
                          ? visitor.visitor_name
                          : 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {visitor.device && (
                          <span className="text-[9px] text-white/20 font-mono">
                            {visitor.device === 'Mobile' ? '📱' : visitor.device === 'Tablet' ? '💻' : '🖥️'} {visitor.os}
                          </span>
                        )}
                        {visitor.browser && (
                          <span className="text-[9px] text-white/20 font-mono">
                            {getBrowserEmoji(visitor.browser)} {visitor.browser}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="hidden sm:flex items-center">
                    {visitor.referrer ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-white/40 font-mono">
                          {visitor.referrer}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/20 font-mono">Direct</span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-end">
                    <span className="text-[10px] text-white/30 font-mono">{timeAgo(visitor.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Pro Tip ── */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor + '15', border: `1px solid ${accentColor}30` }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          <span className="text-white font-bold">Pro Tip:</span>{' '}
          Blocks at the top of your profile typically get 40% more clicks. Move your most important links up in the editor.
        </p>
      </div>
    </motion.div>
  );
}
