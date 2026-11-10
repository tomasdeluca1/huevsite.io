"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LAB_OPTIONS, type LabOptionId } from "./options";
import type { LabProfile } from "./load-profile";
import {
  BadgeRow,
  BdlsMark,
  LogrosBody,
  MountIn,
  StatsLine,
  useCloseOnEscape,
  weekRange,
} from "./pieces";

interface Props {
  profile: LabProfile;
  option: LabOptionId;
  shot: boolean;
  abierto: boolean;
}

export function LabClient({ profile, option, shot, abierto }: Props) {
  const meta = LAB_OPTIONS.find((item) => item.id === option) ?? LAB_OPTIONS[0];

  return (
    <div className="landing min-h-screen bg-[var(--bg)] font-display text-white selection:bg-[var(--accent)] selection:text-black">
      <div className="noise" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --accent: ${profile.accentColor};
              --accent-dim: ${profile.accentColor}1f;
              --accent-mid: ${profile.accentColor}4d;
              --radius-xl: ${profile.borderRadius || "1.5rem"};
            }
          `,
        }}
      />
      <div
        className="pointer-events-none fixed left-[-10%] top-[-10%] h-[50%] w-[70%] opacity-[0.08] blur-[120px]"
        style={{ backgroundColor: profile.accentColor }}
      />

      <main
        className={`relative mx-auto min-h-screen px-3 pb-24 pt-5 sm:px-6 md:pt-10 lg:px-8 ${
          option === "d" ? "max-w-[1440px]" : "max-w-7xl"
        } ${option === "f" ? "pb-28" : ""}`}
      >
        {shot ? (
          <div
            data-lab-label
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/40 bg-[#C8FF00]/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8FF00]"
          >
            Opción {meta.letra}
            <span className="font-sans text-[12px] font-medium normal-case tracking-normal text-white/75">
              {meta.nombre}
            </span>
          </div>
        ) : (
          <LabBar username={profile.username} option={option} />
        )}

        <Stage profile={profile} option={option} abierto={abierto} />

        <p className="mt-16 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
          // builder logic · {profile.displayName}
        </p>
      </main>
    </div>
  );
}

function LabBar({ username, option }: { username: string; option: LabOptionId }) {
  const current = LAB_OPTIONS.find((item) => item.id === option) ?? LAB_OPTIONS[0];
  return (
    <nav className="mb-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3 md:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          Laboratorio · no indexado
        </p>
        <p className="text-[11px] text-white/40">No cambia huevsite.io/{username}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {LAB_OPTIONS.map((item) => {
          const active = item.id === option;
          return (
            <Link
              key={item.id}
              href={`/lab/perfil-opciones?u=${username}&opcion=${item.id}`}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                active ? "bg-[#C8FF00] text-black" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.letra} · {item.nombre}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-white/60">{current.linea}</p>
    </nav>
  );
}

function Stage({
  profile,
  option,
  abierto,
}: {
  profile: LabProfile;
  option: LabOptionId;
  abierto: boolean;
}) {
  const header = (
    <ProfileHeader
      accentColor={profile.accentColor}
      subscriptionTier={profile.subscriptionTier}
      borderRadius={profile.borderRadius}
      subSites={profile.subSites}
      blocks={profile.blocks}
      username={profile.username}
      showEcosystem={profile.showEcosystem}
    />
  );
  const grid = (
    <ProfileGrid
      blocks={profile.blocks}
      accentColor={profile.accentColor}
      displayName={profile.displayName}
      tagline={profile.tagline}
      subscriptionTier={profile.subscriptionTier}
      isWinner={profile.isWinner}
      winnerWeek={profile.winnerWeek}
      badges={[]}
      subSites={profile.subSites}
      username={profile.username}
    />
  );

  if (option === "b") {
    return (
      <>
        <Ribbon profile={profile} />
        {header}
        {grid}
      </>
    );
  }

  if (option === "d") {
    return (
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {header}
          {grid}
        </div>
        <aside data-lab-aside className="mt-8 lg:sticky lg:top-6 lg:mt-0">
          <SideCard profile={profile} />
        </aside>
      </div>
    );
  }

  if (option === "e") {
    return (
      <>
        {header}
        <div className="relative">
          {grid}
          {profile.winnerWeek && <Seal week={profile.winnerWeek} />}
        </div>
        <FooterBand profile={profile} />
      </>
    );
  }

  if (option === "c") {
    return (
      <>
        {header}
        <LogrosDrawer profile={profile} startOpen={abierto} />
        {grid}
      </>
    );
  }

  if (option === "f") {
    return (
      <>
        {header}
        {grid}
        <FloatingLogros profile={profile} startOpen={abierto} />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="relative">
        {grid}
        <UnderName profile={profile} />
      </div>
    </>
  );
}

function UnderName({ profile }: { profile: LabProfile }) {
  const strip = (
    <div className="space-y-2">
      <StatsLine
        followers={profile.followers}
        following={profile.following}
        nominations={profile.nominations}
        score={profile.builderScore}
      />
      <BadgeRow badges={profile.badges} winnerWeek={profile.winnerWeek} mode="icon" />
    </div>
  );
  return (
    <MountIn kind="under-name" fallback={<div className="mb-4">{strip}</div>}>
      {strip}
    </MountIn>
  );
}

function Seal({ week }: { week: string }) {
  const label = `Builder de la Semana, ${weekRange(week)}`;
  return (
    <MountIn kind="seal">
      <span
        title={label}
        aria-label={label}
        className="grid h-4 w-4 place-items-center rounded-full bg-[#C8FF00] text-[9px] font-black leading-none text-black ring-2 ring-[#050505] md:h-5 md:w-5 md:text-[10px]"
      >
        ★
      </span>
    </MountIn>
  );
}

function Ribbon({ profile }: { profile: LabProfile }) {
  return (
    <section className="relative z-10 mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-3 py-2.5 md:flex-row md:items-center md:px-4">
        <div className="min-w-0 flex-1">
          {profile.winnerWeek ? (
            <BdlsMark week={profile.winnerWeek} notaHref={profile.notaHref} compact />
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Logros</p>
          )}
        </div>
        <StatsLine
          followers={profile.followers}
          following={profile.following}
          nominations={profile.nominations}
          score={profile.builderScore}
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-t border-white/5 px-3 py-2 [scrollbar-width:none] md:px-4">
        <BadgeRow badges={profile.badges} winnerWeek={profile.winnerWeek} nowrap />
      </div>
    </section>
  );
}

function SideCard({ profile }: { profile: LabProfile }) {
  const stats = [
    { n: profile.followers, label: "Seguidores" },
    { n: profile.following, label: "Siguiendo" },
    { n: profile.nominations, label: "Nominaciones" },
    { n: profile.builderScore, label: "Score", accent: true },
  ];
  return (
    <div className="rounded-[var(--radius-xl)] border border-white/10 bg-[#0E0E0F]/80 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Logros</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className={`font-mono text-lg font-bold leading-none ${item.accent ? "text-[var(--accent)]" : "text-white"}`}>
              {item.n}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">{item.label}</div>
          </div>
        ))}
      </div>
      {profile.winnerWeek && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <BdlsMark week={profile.winnerWeek} notaHref={profile.notaHref} compact />
        </div>
      )}
      <div className="mt-3">
        <BadgeRow badges={profile.badges} winnerWeek={profile.winnerWeek} />
      </div>
    </div>
  );
}

function FooterBand({ profile }: { profile: LabProfile }) {
  return (
    <section data-lab-footer className="mt-10 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Logros</p>
        <StatsLine
          followers={profile.followers}
          following={profile.following}
          nominations={profile.nominations}
          score={profile.builderScore}
        />
      </div>
      <div className="mt-3">
        <BadgeRow badges={profile.badges} winnerWeek={profile.winnerWeek} />
      </div>
    </section>
  );
}

function LogrosDrawer({ profile, startOpen }: { profile: LabProfile; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  useCloseOnEscape(open, () => setOpen(false));

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[13px] font-bold text-white hover:border-white/25"
          aria-expanded={open}
        >
          <span className="text-[var(--accent)]" aria-hidden="true">◆</span>
          Logros
          <span className="font-mono text-[11px] font-medium text-white/45">{profile.badges.length}</span>
        </button>
        <span className="font-mono text-[11px] text-white/40">score {profile.builderScore}</span>
      </div>
      {open && (
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Cerrar logros"
            onClick={() => setOpen(false)}
          />
          <div
            data-lab-sheet
            className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0E0E0F] p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[380px] md:rounded-none md:border-y-0 md:border-r-0"
          >
            <LogrosBody
              badges={profile.badges}
              winnerWeek={profile.winnerWeek}
              notaHref={profile.notaHref}
              followers={profile.followers}
              following={profile.following}
              nominations={profile.nominations}
              score={profile.builderScore}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

function FloatingLogros({ profile, startOpen }: { profile: LabProfile; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  useCloseOnEscape(open, () => setOpen(false));

  return (
    <>
    {open && (
      <button
        type="button"
        className="fixed inset-0 z-[170] bg-black/60"
        aria-label="Cerrar logros"
        onClick={() => setOpen(false)}
      />
    )}
    <div className="fixed inset-x-4 bottom-4 z-[180] flex max-h-[calc(100dvh-2rem)] flex-col items-end justify-end gap-3 md:inset-x-auto md:right-6 md:w-[380px]">
      {open && (
        <div
          data-lab-sheet
          className="min-h-0 w-full shrink overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#0E0E0F] p-4 shadow-2xl"
          style={{ maxHeight: "calc(100dvh - 8rem)", minHeight: 0 }}
        >
          <LogrosBody
            badges={profile.badges}
            winnerWeek={profile.winnerWeek}
            notaHref={profile.notaHref}
            followers={profile.followers}
            following={profile.following}
            nominations={profile.nominations}
            score={profile.builderScore}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-[#C8FF00] px-4 text-[13px] font-black text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        aria-expanded={open}
      >
        Logros
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black/10 font-mono text-[11px]">
          {profile.badges.length}
        </span>
      </button>
    </div>
    </>
  );
}
