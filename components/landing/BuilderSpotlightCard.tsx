"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Builder {
  username: string;
  name?: string | null;
  image?: string | null;
  tagline?: string | null;
  accent_color?: string | null;
  builder_score?: number | null;
  blocks?: any[];
}

function deriveCard(p: Builder, t: (key: string) => string) {
  const name = p.name || p.username;
  const tagline = (p.tagline || t("spotlightDefaultTagline")).trim();
  const blocks = (p.blocks || []).filter((b) => b && b.visible !== false);

  const building = blocks.find((b) => b.type === "building");
  const project = blocks.find((b) => b.type === "project");
  const stackBlock = blocks.find((b) => b.type === "stack");

  let projectLabel = t("spotlightBuildingNow");
  let projectTitle = "";
  let projectStack: string[] = [];
  if (building) {
    projectTitle = building.project || building.title || "";
    projectStack = Array.isArray(building.stack) ? building.stack : [];
  } else if (project) {
    projectLabel = t("spotlightProject");
    projectTitle = project.title || "";
    projectStack = Array.isArray(project.stack) ? project.stack : [];
  }

  const stackSource = stackBlock?.items?.length ? stackBlock.items : projectStack;
  const stackTags = (Array.isArray(stackSource) ? stackSource : []).filter(Boolean).slice(0, 3);
  const score = typeof p.builder_score === "number" ? p.builder_score : null;

  return { name, tagline, img: p.image, username: p.username, accent: p.accent_color || undefined, projectLabel, projectTitle, projectStack, stackTags, score };
}

export function BuilderSpotlightCard({ builders }: { builders: Builder[] }) {
  const t = useTranslations("landing");
  const list = useMemo(() => (builders || []).filter((b) => b && b.username).slice(0, 6), [builders]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (list.length <= 1 || paused) return;
    const timer = setInterval(() => setI((p) => (p + 1) % list.length), 4500);
    return () => clearInterval(timer);
  }, [list.length, paused]);

  if (list.length === 0) return null;
  const safeIndex = i % list.length;
  const c = deriveCard(list[safeIndex], t);

  const track = () => {
    if (typeof window !== "undefined") (window as any).umami?.track("landing_spotlight_click", { username: c.username });
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={c.username}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Link href={`/${c.username}`} target="_blank" onClick={track} className="hpp-card group block" style={{ textDecoration: "none" }}>
            <div className="hpp-header">
              <div className="hpp-avatar" style={{ overflow: "hidden", padding: 0, ...(c.img ? { background: "transparent" } : {}) }}>
                {c.img ? (
                  <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  c.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hpp-info" style={{ minWidth: 0 }}>
                <div className="hpp-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div className="hpp-role" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.tagline}</div>
              </div>
              {c.score != null && <div className="hpp-score">{c.score} pts</div>}
            </div>

            <div className="hpp-grid">
              <div className="hpp-block hpp-block--span2">
                <div className="hpp-block-label">{c.projectLabel}</div>
                <div className="hpp-block-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.projectTitle || c.name}
                </div>
                {c.projectStack.length > 0 && (
                  <div className="hpp-block-tech" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.projectStack.slice(0, 3).join(" · ")}
                  </div>
                )}
              </div>
              <div className="hpp-block hpp-block--accent">
                <div className="hpp-block-label">{c.score != null ? t("spotlightScore") : t("spotlightLive")}</div>
                <div className="hpp-block-num">{c.score != null ? c.score : "●"}</div>
              </div>
              {c.stackTags.length > 0 && (
                <div className="hpp-block">
                  <div className="hpp-block-label">{t("spotlightStack")}</div>
                  <div className="hpp-stack-tags">
                    {c.stackTags.map((t, idx) => (
                      <span key={idx}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hpp-url">
              <span className="hpp-url-prefix">huevsite.io/</span>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{c.username}</span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {list.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {list.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={t("spotlightViewBuilder", { index: idx + 1 })}
              style={{
                width: idx === safeIndex ? 18 : 6,
                height: 6,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                background: idx === safeIndex ? "var(--accent)" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
