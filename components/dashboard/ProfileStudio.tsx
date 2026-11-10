"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Copy, Check, Eye, EyeOff, GripVertical, Pencil, Share2 } from "lucide-react";
import type { BlockData, ProfileData } from "@/lib/profile-types";
import { getContrastColor } from "@/lib/profile-types";
import { LINK_BOX_STYLES, type LinkBoxStyle, type ProfileLayoutMode } from "@/lib/profile-layout";
import { studioLinkRows } from "@/lib/link-layout";
import { LinksProfile } from "@/components/profile/LinksProfile";
import { MobilePreviewFrame } from "@/components/dashboard/MobilePreviewFrame";
import { BoxStylePicker } from "@/components/dashboard/BoxStylePicker";

type SaveState = "idle" | "saving" | "saved" | "error";

interface Props {
  profile: ProfileData;
  blocks: BlockData[];
  isSubSite: boolean;
  saveState: SaveState;
  copied: boolean;
  onLayout: (layout: ProfileLayoutMode) => void;
  onGlobalBox: (style: LinkBoxStyle) => void;
  onBoxStyle: (block: BlockData, style: LinkBoxStyle | null) => void;
  onToggleVisible: (block: BlockData) => void;
  onReorder: (orderedIds: string[]) => void;
  onBasics: (patch: { displayName: string; tagline: string }) => void;
  onAddProject: (title: string, link: string) => void;
  onEdit: (block: BlockData) => void;
  onEditProfile: () => void;
  onShare: () => void;
  onCopy: () => void;
  onOpenGrid: () => void;
  onOpenStats: () => void;
  statsLocked: boolean;
  onBackToMain: () => void;
  previewPath: string;
  previewKey: number;
}

function SortableRow({
  id,
  title,
  subtitle,
  hidden,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  hidden: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("dashboard.studio");
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${hidden ? "opacity-50" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/50 hover:bg-white/5 hover:text-white"
          aria-label={t("drag")}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-black text-white">{title}</p>
          {subtitle && <p className="truncate text-xs text-white/40">{subtitle}</p>}
        </div>
        {children}
      </div>
    </li>
  );
}

export function ProfileStudio(props: Props) {
  const t = useTranslations("dashboard.studio");
  const {
    profile,
    blocks,
    isSubSite,
    saveState,
    copied,
    onLayout,
    onGlobalBox,
    onBoxStyle,
    onToggleVisible,
    onReorder,
    onBasics,
    onAddProject,
    onEdit,
    onEditProfile,
    onShare,
    onCopy,
    onOpenGrid,
    onOpenStats,
    statsLocked,
    onBackToMain,
    previewPath,
    previewKey,
  } = props;

  const hero = blocks.find((block) => block.type === "hero");
  const initialName = profile.displayName || "";
  const initialBio = profile.tagline || (hero && "tagline" in hero ? hero.tagline : "") || "";
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [stats, setStats] = useState<{ views: number; clicks: number } | null>(null);

  useEffect(() => {
    setName(initialName);
    setBio(initialBio);
  }, [initialName, initialBio]);

  useEffect(() => {
    if (!profile.hasProAccess) return;
    let cancelled = false;
    fetch("/api/analytics/insights?range=7")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setStats({ views: data?.totalPageViews || 0, clicks: data?.totalClicks || 0 });
      })
      .catch(() => {
        if (!cancelled) setStats({ views: 0, clicks: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [profile.hasProAccess, profile.id]);

  useEffect(() => {
    if (name === initialName && bio === initialBio) return;
    const timer = window.setTimeout(() => onBasics({ displayName: name, tagline: bio }), 700);
    return () => window.clearTimeout(timer);
  }, [name, bio, initialName, initialBio, onBasics]);

  const rows = useMemo(() => studioLinkRows(blocks as never), [blocks]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = rows.map((row) => row.blockId);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  const layout = profile.profileLayout === "links" ? "links" : "portfolio";
  const globalBox = profile.linkBoxStyle || "pill";
  const ink = getContrastColor(profile.accentColor);
  const statusText = saveState === "saving" ? t("saving") : saveState === "saved" ? t("saved") : saveState === "error" ? t("saveError") : "";

  const preview = layout === "links" && !isSubSite ? (
    <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#070807] py-4">
      <LinksProfile
        blocks={blocks as never}
        globalStyle={globalBox}
        username={profile.username}
        displayName={name || profile.displayName}
        avatarUrl={profile.avatarUrl}
        bio={bio}
        accentColor={profile.accentColor}
        borderRadius={profile.borderRadius}
        preview
        showEcosystem={profile.showEcosystem}
        subSites={profile.subSites}
      />
    </div>
  ) : (
    <MobilePreviewFrame path={previewPath} reloadKey={previewKey} />
  );

  const editor = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black"
          style={{ background: profile.accentColor, color: ink }}
        >
          <Share2 size={16} /> {t("share")}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-bold text-white"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t("copied") : t("copy")}
        </button>
        <a
          href={previewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 px-4 text-sm font-bold text-white/80"
        >
          {t("view")}
        </a>
        {statusText && (
          <span className="text-xs font-bold text-white/50" role="status">
            {statusText}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={onOpenStats} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{t("statsScore")}</span>
          <span className="text-xl font-black text-white">{profile.builderScore || 0}</span>
        </button>
        <button type="button" onClick={onOpenStats} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{t("statsViews")}</span>
          <span className="text-xl font-black text-white">{stats ? stats.views : statsLocked ? "Pro" : "..."}</span>
        </button>
        <button type="button" onClick={onOpenStats} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{t("statsClicks")}</span>
          <span className="text-xl font-black text-white">{stats ? stats.clicks : statsLocked ? "Pro" : "..."}</span>
        </button>
      </div>
      <p className="text-[11px] text-white/35">{stats ? t("statsRange") : statsLocked ? t("statsLocked") : ""}</p>

      <fieldset className="rounded-2xl border border-white/10 p-3">
        <legend className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{t("layoutLabel")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["portfolio", "links"] as const).map((mode) => {
            const active = layout === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => onLayout(mode)}
                className="min-h-11 rounded-xl border px-3 text-sm font-black"
                style={{
                  background: active ? profile.accentColor : "transparent",
                  color: active ? ink : "rgba(255,255,255,0.7)",
                  borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                }}
              >
                {mode === "portfolio" ? t("layoutPortfolio") : t("layoutLinks")}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/45">{t("layoutHint")}</p>
      </fieldset>

      {layout === "links" && (
        <BoxStylePicker value={globalBox} onChange={(value) => value && onGlobalBox(value)} />
      )}

      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <button type="button" onClick={onEditProfile} className="mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:mx-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center font-black text-white/50">{(name || "?").slice(0, 1)}</span>
          )}
        </button>
        <div className="grid gap-2">
          <label className="block text-left">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{t("name")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold text-white"
            />
          </label>
          <label className="block text-left">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{t("bio")}</span>
            <input
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={200}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            />
          </label>
        </div>
      </div>

      {isSubSite ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-left">
          <p className="text-sm text-white/70">{t("subsiteNote")}</p>
          <button type="button" onClick={onBackToMain} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-black" style={{ background: profile.accentColor, color: ink }}>
            {t("backToMain")}
          </button>
        </div>
      ) : (
        <>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center">
              <p className="text-base font-black text-white">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-white/50">{t("emptyBody")}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={rows.map((row) => row.blockId)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {rows.map((row) => {
                    const block = blocks.find((item) => item.id === row.blockId);
                    if (!block) return null;
                    return (
                      <SortableRow key={row.blockId} id={row.blockId} title={row.type === "social" ? t("rowSocial") : row.type === "writing" ? t("rowNotes") : row.title} subtitle={row.subtitle} hidden={row.hidden}>
                        {layout === "links" && row.type !== "github" && (
                          <select
                            id={`box-${row.blockId}`}
                            aria-label={t("boxPerLink")}
                            value={row.boxStyle ?? ""}
                            onChange={(event) => onBoxStyle(block, event.target.value ? (event.target.value as LinkBoxStyle) : null)}
                            className="order-last mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-2 text-xs font-bold text-white sm:mt-0 sm:w-auto sm:max-w-[9.5rem]"
                          >
                            <option value="">{t("boxFollowGlobal")}</option>
                            {LINK_BOX_STYLES.map((style) => (
                              <option key={style} value={style}>{t(style === "pill" ? "boxPill" : style === "card" ? "boxCard" : style === "compact" ? "boxCompact" : style === "featured" ? "boxFeatured" : "boxExpandable")}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleVisible(block)}
                          aria-label={row.hidden ? t("show") : t("hide")}
                          className="grid h-11 w-11 place-items-center rounded-xl text-white/60 hover:bg-white/5"
                        >
                          {row.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(block)}
                          aria-label={t("editDetails")}
                          className="grid h-11 w-11 place-items-center rounded-xl text-white/60 hover:bg-white/5"
                        >
                          <Pencil size={16} />
                        </button>
                      </SortableRow>
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <form
            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const nextTitle = title.trim();
              if (!nextTitle) return;
              onAddProject(nextTitle, url.trim());
              setTitle("");
              setUrl("");
            }}
          >
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("addTitle")}
              aria-label={t("addTitle")}
              className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t("addUrl")}
              aria-label={t("addUrl")}
              inputMode="url"
              className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            />
            <button
              type="submit"
              className="min-h-11 rounded-xl px-4 text-sm font-black"
              style={{ background: profile.accentColor, color: ink }}
            >
              {t("add")}
            </button>
          </form>
        </>
      )}

      <button type="button" onClick={onOpenGrid} className="text-sm font-bold text-white/50 underline-offset-4 hover:text-white hover:underline">
        {t("openGrid")}
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex gap-2 lg:hidden">
        <button type="button" onClick={() => setMobilePane("edit")} className={`min-h-11 flex-1 rounded-xl text-sm font-black ${mobilePane === "edit" ? "bg-white text-black" : "bg-white/5 text-white/60"}`}>
          {t("edit")}
        </button>
        <button type="button" onClick={() => setMobilePane("preview")} className={`min-h-11 flex-1 rounded-xl text-sm font-black ${mobilePane === "preview" ? "bg-white text-black" : "bg-white/5 text-white/60"}`}>
          {t("preview")}
        </button>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className={mobilePane === "preview" ? "hidden lg:block" : ""}>{editor}</div>
        <div className={mobilePane === "edit" ? "hidden lg:block" : ""}>{preview}</div>
      </div>
    </div>
  );
}
