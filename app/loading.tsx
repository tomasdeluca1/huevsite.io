import { getTranslations } from "next-intl/server";

// Branded route loader: a mini browser window "building" a huevsite — its bento
// blocks assemble in the accent color while the URL bar types the profile path.
// Pure CSS animation (keyframes in globals.css), so it paints instantly with no
// client JS. Ties the loading moment to the product: building your website.
export default async function Loading() {
  const t = await getTranslations("meta");

  // Bento tiles: [colSpan, rowSpan] mimicking the huevsite grid. Each fades in
  // on a staggered delay so the "site" assembles block by block.
  const tiles: Array<{ span: string; h: string; accent?: boolean }> = [
    { span: "col-span-2", h: "h-10", accent: true },
    { span: "col-span-1", h: "h-10" },
    { span: "col-span-1", h: "h-8" },
    { span: "col-span-1", h: "h-8" },
    { span: "col-span-1", h: "h-8", accent: true },
    { span: "col-span-2", h: "h-7" },
    { span: "col-span-1", h: "h-7" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6">
      <div className="w-[280px] rounded-2xl border border-white/10 bg-[#0e0e0e] overflow-hidden shadow-2xl shadow-black/60">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]/70" />
          </div>
          <div className="flex-1 ml-1 h-5 rounded-md bg-white/[0.06] flex items-center px-2 overflow-hidden">
            <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
              huevsite.io/<span className="text-[var(--accent)]">you</span>
              <span className="loader-caret text-[var(--accent)]">▍</span>
            </span>
          </div>
        </div>

        {/* Bento blocks assembling */}
        <div className="p-3 grid grid-cols-3 gap-2">
          {tiles.map((tile, i) => (
            <div
              key={i}
              className={`loader-tile ${tile.span} ${tile.h} rounded-lg border ${
                tile.accent
                  ? "bg-[var(--accent)]/15 border-[var(--accent)]/30"
                  : "bg-white/[0.05] border-white/10"
              }`}
              style={{ animationDelay: `${i * 0.13}s` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] tracking-wide">
        <span className="logo !text-sm">huev<span style={{ color: "var(--accent)" }}>site</span>.io</span>
        <span className="opacity-50">·</span>
        <span>{t("loadingCaption")}</span>
      </div>
    </div>
  );
}
