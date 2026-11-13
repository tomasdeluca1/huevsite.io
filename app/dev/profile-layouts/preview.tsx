"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { LinksProfile } from "@/components/profile/LinksProfile";
import { ProfileStudio } from "@/components/dashboard/ProfileStudio";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { applyLinkOrder } from "@/lib/link-layout";
import type { LinkBoxStyle, ProfileLayoutMode } from "@/lib/profile-layout";
import type { BlockData, ProfileData } from "@/lib/profile-types";

const avatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#1c3d34"/><circle cx="120" cy="96" r="42" fill="#d7c4a3"/><path d="M48 210c12-48 40-72 72-72s60 24 72 72" fill="#123"/><rect x="78" y="78" width="84" height="18" rx="8" fill="#111"/></svg>`,
  );

function fixture(mixed: boolean): ProfileData {
  return {
    username: "alice",
    displayName: "Alice",
    tagline: "Discover my work and see where you can find me",
    avatarUrl: avatar,
    accentColor: "#C8FF00",
    subscriptionTier: "pro",
    hasProAccess: true,
    twitterShareUnlocked: false,
    extraBlocksFromShare: 0,
    showEcosystem: false,
    subSites: [],
    builderScore: 420,
    profileLayout: "links",
    linkBoxStyle: "pill",
    borderRadius: "1.5rem",
    blocks: [
      {
        id: "hero",
        type: "hero",
        order: 0,
        col_span: 2,
        row_span: 2,
        visible: true,
        name: "Alice",
        avatarUrl: avatar,
        tagline: "Discover my work and see where you can find me",
        status: "building",
        location: "Buenos Aires",
      },
      {
        id: "web",
        type: "project",
        order: 1,
        col_span: 1,
        row_span: 2,
        visible: true,
        title: "Website",
        description: "El sitio principal.",
        link: "https://alice.dev",
        stack: [],
        boxStyle: mixed ? "pill" : null,
      },
      {
        id: "folio",
        type: "project",
        order: 2,
        col_span: 1,
        row_span: 2,
        visible: true,
        title: "Portfolio",
        description: "Trabajos elegidos, con foto y contexto.",
        link: "https://alice.dev/work",
        stack: [],
        boxStyle: mixed ? "featured" : null,
      },
      {
        id: "pin",
        type: "project",
        order: 3,
        col_span: 1,
        row_span: 1,
        visible: true,
        title: "Pinterest",
        description: "Tableros y referencias.",
        link: "https://pinterest.com/alice",
        stack: [],
        boxStyle: mixed ? "expandable" : null,
      },
      ...(mixed
        ? [{
            id: "ig",
            type: "custom" as const,
            order: 4,
            col_span: 1,
            row_span: 1,
            visible: true,
            label: "IG",
            title: "Instagram",
            description: "",
            link: "https://instagram.com/alice",
            boxStyle: "compact" as const,
          }]
        : []),
      {
        id: "social",
        type: "social",
        order: 5,
        col_span: 1,
        row_span: 1,
        visible: true,
        links: [
          { platform: "twitter", url: "https://x.com/alice" },
          { platform: "github", url: "https://github.com/alice" },
          { platform: "linkedin", url: "https://linkedin.com/in/alice" },
          { platform: "instagram", url: "https://instagram.com/alice" },
          { platform: "youtube", url: "https://youtube.com/@alice" },
          { platform: "tiktok", url: "https://tiktok.com/@alice" },
        ],
      },
    ],
  };
}

export function LayoutPreview({ view }: { view: string }) {
  const t = useTranslations("dashboard.page");
  const [profile, setProfile] = useState(() => fixture(view === "mix"));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const mixed = view === "mix";
  const deleting = profile.blocks.find((block) => block.id === deletingId);
  const deletingTitle = deleting && deleting.type === "project" ? deleting.title : "";

  if (view === "portfolio") {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
        <style>{`:root { --accent: ${profile.accentColor}; --radius-xl: 1.5rem; }`}</style>
        <div className="mx-auto max-w-6xl">
          <ProfileGrid
            blocks={profile.blocks}
            accentColor={profile.accentColor}
            displayName={profile.displayName}
            tagline={profile.tagline}
            username={profile.username}
          />
        </div>
      </main>
    );
  }

  if (view === "studio") {
    return (
      <main className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
        <style>{`:root { --accent: ${profile.accentColor}; --dashboard-radius: 1.5rem; }`}</style>
        <ProfileStudio
          profile={profile}
          blocks={profile.blocks}
          isSubSite={false}
          saveState="saved"
          copied={false}
          onLayout={(layout: ProfileLayoutMode) => setProfile((prev) => ({ ...prev, profileLayout: layout }))}
          onGlobalBox={(style: LinkBoxStyle) => setProfile((prev) => ({ ...prev, linkBoxStyle: style }))}
          onBoxStyle={(block, style) =>
            setProfile((prev) => ({
              ...prev,
              blocks: prev.blocks.map((item) => (item.id === block.id ? { ...item, boxStyle: style } : item)),
            }))
          }
          onToggleVisible={(block) =>
            setProfile((prev) => ({
              ...prev,
              blocks: prev.blocks.map((item) => (item.id === block.id ? { ...item, visible: item.visible === false } : item)),
            }))
          }
          onReorder={(ids) => setProfile((prev) => ({ ...prev, blocks: applyLinkOrder(prev.blocks, ids) as BlockData[] }))}
          onBasics={({ displayName, tagline }) => setProfile((prev) => ({ ...prev, displayName, tagline }))}
          onAddProject={(title, link) =>
            setProfile((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: `new-${prev.blocks.length}`,
                  type: "project",
                  order: prev.blocks.length,
                  col_span: 1,
                  row_span: 1,
                  visible: true,
                  title,
                  description: "",
                  link,
                  stack: [],
                },
              ],
            }))
          }
          onDeleteProject={(block) => setDeletingId(block.id)}
          onEdit={() => {}}
          onEditProfile={() => {}}
          onShare={() => {}}
          onCopy={() => {}}
          onOpenGrid={() => setProfile((prev) => ({ ...prev, profileLayout: "portfolio" }))}
          onOpenStats={() => {}}
          statsLocked={false}
          onBackToMain={() => {}}
          previewPath="/alice"
          previewKey={profile.blocks.length}
        />
        <ConfirmDeleteDialog
          open={!!deleting}
          title={t("deleteProjectConfirmTitle")}
          body={t("deleteProjectConfirmBody", { title: deletingTitle || t("deleteProjectFallback") })}
          cancelLabel={t("cancel")}
          confirmLabel={t("deleteProject")}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            setProfile((prev) => ({ ...prev, blocks: prev.blocks.filter((block) => block.id !== deletingId) }));
            setDeletingId(null);
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40" style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,255,0,0.18), transparent 46%)" }} />
      <div className="relative">
        <LinksProfile
          blocks={fixture(mixed).blocks}
          globalStyle={mixed ? "pill" : "pill"}
          username="alice"
          displayName="Alice"
          avatarUrl={avatar}
          bio="Discover my work and see where you can find me"
          accentColor="#C8FF00"
          borderRadius="1.5rem"
          preview
        />
      </div>
    </main>
  );
}
