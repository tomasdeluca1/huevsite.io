"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { BlockData, EcosystemBlockData, getContrastColor } from "@/lib/profile-types";
import { X, Save, Sparkles, Search, Github, GripVertical, Globe, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { SOCIAL_PLATFORMS, SocialPlatformKey, buildSocialUrl, getUrlPreview } from "@/lib/social-platforms";
import { AIRewriteButton } from "@/components/dashboard/AIRewriteButton";
import { useTranslations } from "next-intl";

interface Props {
  block: BlockData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: BlockData) => void;
  accentColor?: string;
}

export function BlockEditorModal({ block, isOpen, onClose, onSave, accentColor = "#C8FF00" }: Props) {
  const t = useTranslations("dashboard");
  const [formData, setFormData] = useState<any>(block);
  const [mounted, setMounted] = useState(false);
  const [githubResults, setGithubResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshingGithub, setRefreshingGithub] = useState(false);
  const [githubRefreshError, setGithubRefreshError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar formData cuando cambia el bloque
  useEffect(() => {
    let initialData = { ...block };

    // Añadir IDs temporales para drag & drop estable
    if (initialData.type === 'social' && Array.isArray(initialData.links)) {
      initialData.links = initialData.links.map((l: any) => ({ ...l, _dragId: l._dragId || Math.random().toString(36).substr(2, 9) }));
    }
    if (initialData.type === 'community' && Array.isArray(initialData.communities)) {
      initialData.communities = initialData.communities.map((c: any) => ({ ...c, _dragId: c._dragId || Math.random().toString(36).substr(2, 9) }));
    }

    setFormData(initialData);
    setGithubSearch("");
    setGithubResults([]);
  }, [block]);

  const [githubSearch, setGithubSearch] = useState("");

  useEffect(() => {
    if (githubSearch.length < 3) {
      setGithubResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.github.com/search/users?q=${githubSearch}&per_page=5`);
        const data = await res.json();
        setGithubResults(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [githubSearch]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  // Pull fresh, real stats from the GitHub API (stars, repos, followers,
  // real contribution heatmap, per-month commits). Saved when the user saves
  // the block. Never clears existing stats on failure.
  const handleRefreshGithub = async () => {
    const username = (formData.username || "").trim();
    if (!username || refreshingGithub) return;
    setRefreshingGithub(true);
    setGithubRefreshError(null);
    try {
      const res = await fetch(`/api/github/import?username=${encodeURIComponent(username)}`);
      const data = res.ok ? await res.json() : null;
      if (data?.stats) {
        handleChange("stats", data.stats);
      } else {
        setGithubRefreshError(data?.error || t("blockEditor.github.fetchError"));
      }
    } catch {
      setGithubRefreshError(t("blockEditor.github.fetchError"));
    } finally {
      setRefreshingGithub(false);
    }
  };

  const handleSave = () => {
    const dataToSave = { ...formData };

    // Parsear strings a arrays para los stacks
    if (block.type === 'building' && typeof dataToSave.stack === 'string') {
      dataToSave.stack = dataToSave.stack.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    if (block.type === 'stack' && typeof dataToSave.items === 'string') {
      dataToSave.items = dataToSave.items.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    if (block.type === 'project' && typeof dataToSave.stack === 'string') {
      dataToSave.stack = dataToSave.stack.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    // Asegurar que las URLs sociales estén construidas desde el handle y limpiar IDs de drag
    if (block.type === 'social' && Array.isArray(dataToSave.links)) {
      dataToSave.links = dataToSave.links.map((l: any) => {
        const { _dragId, ...rest } = l;
        return {
          ...rest,
          url: l.url || buildSocialUrl(l.platform, l.handle || ""),
        };
      });
    }

    if (block.type === 'community' && Array.isArray(dataToSave.communities)) {
      dataToSave.communities = dataToSave.communities.map((c: any) => {
        const { _dragId, ...rest } = c;
        return rest;
      });
    }

    if (block.type === 'collab' && Array.isArray(dataToSave.users)) {
      dataToSave.users = dataToSave.users.map((u: any) => {
        const { _dragId, ...rest } = u;
        return rest;
      });
    }

    onSave(dataToSave);
    onClose();
  };

  const renderFields = () => {
    switch (block.type) {
      case "hero":
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <ImageUpload
                label={t("blockEditor.hero.avatarLabel")}
                value={formData.avatarUrl}
                onChange={(url) => handleChange("avatarUrl", url)}
                folder="avatars"
              />
              <p className="text-[10px] text-[var(--text-muted)] font-mono text-center">
                {t("blockEditor.hero.avatarHint")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.hero.nameLabel")}</div>
                <input
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                  placeholder={t("blockEditor.hero.namePlaceholder")}
                />
              </div>
               <div className="space-y-2">
                <div className="flex items-center justify-between section-label !text-[9px] px-1">
                  <span>{t("blockEditor.hero.taglineLabel")}</span>
                  <AIRewriteButton 
                    text={formData.tagline || ""} 
                    onSelect={(val) => handleChange("tagline", val)} 
                    accentColor={accentColor} 
                  />
                </div>
                <input
                  value={formData.tagline || ""}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder={t("blockEditor.hero.taglinePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between section-label !text-[9px] px-1">
                <span>{t("blockEditor.hero.bioLabel")}</span>
                <AIRewriteButton 
                  text={formData.description || ""} 
                  onSelect={(val) => handleChange("description", val)} 
                  accentColor={accentColor} 
                />
              </div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder={t("blockEditor.hero.bioPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.hero.statusLabel")}</div>
                <input
                  value={formData.status || ""}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder={t("blockEditor.hero.statusPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.hero.locationLabel")}</div>
                <input
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder={t("blockEditor.hero.locationPlaceholder")}
                />
              </div>
            </div>
          </div>
        );
      case "building":
      case "project":
        return (
          <div className="space-y-6">
            {block.type === "project" && (
              <ImageUpload
                label={t("blockEditor.project.previewLabel")}
                value={formData.imageUrl}
                onChange={(url) => handleChange("imageUrl", url)}
                folder="projects"
              />
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between section-label !text-[9px] px-1">
                <span>{t("blockEditor.project.titleLabel")}</span>
                <AIRewriteButton 
                  text={formData.project || formData.title || ""} 
                  onSelect={(val) => handleChange(block.type === "building" ? "project" : "title", val)} 
                  accentColor={accentColor} 
                />
              </div>
              <input
                value={formData.project || formData.title || ""}
                onChange={(e) => handleChange(block.type === "building" ? "project" : "title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between section-label !text-[9px] px-1">
                <span>{t("blockEditor.project.descriptionLabel")}</span>
                <AIRewriteButton
                  text={formData.description || ""}
                  onSelect={(val) => handleChange("description", val)}
                  accentColor={accentColor}
                />
              </div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
              />
            </div>
            {(block.type === "building" || block.type === "project") && (
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.project.stackLabel")}</div>
                <input
                  value={Array.isArray(formData.stack) ? formData.stack.join(", ") : formData.stack || ""}
                  onChange={(e) => handleChange("stack", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-sm"
                  placeholder="React, TypeScript, Tailwind"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.project.linkLabel")}</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
            {block.type === "project" && (
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.project.metricsLabel")}</div>
                <input
                  value={formData.metrics || ""}
                  onChange={(e) => handleChange("metrics", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="⭐ 3.2k, Forked 200, Version 1.0"
                />
              </div>
            )}
          </div>
        );
      case "metric":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.metric.labelLabel")}</div>
              <input
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all uppercase font-mono text-xs tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.metric.valueLabel")}</div>
              <input
                value={formData.value || ""}
                onChange={(e) => handleChange("value", e.target.value)}
                className="w-full p-6 block text-center rounded-2xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-5xl font-black tracking-tighter"
              />
            </div>
          </div>
        );
      case "stack":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.stack.itemsLabel")}</div>
              <textarea
                value={Array.isArray(formData.items) ? formData.items.join(", ") : formData.items || ""}
                onChange={(e) => handleChange("items", e.target.value)}
                className="w-full p-4 h-32 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed font-mono text-sm"
                placeholder="TypeScript, React, Node.js, PostgreSQL, Tailwind"
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              {t("blockEditor.stack.previewLabel")} {Array.isArray(formData.items) ? formData.items.join(", ") : formData.items}
            </div>
          </div>
        );
      case "social":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1 translate-y-2 opacity-50">{t("blockEditor.social.linksLabel")}</div>
            <Reorder.Group axis="y" values={formData.links || []} onReorder={(newLinks) => handleChange("links", newLinks)} className="space-y-3 pt-4">
              {(formData.links || []).map((linkObj: any, index: number) => {
                const platform = linkObj.platform || "twitter";
                const platformConfig = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
                const handle = linkObj.handle || "";
                const preview = handle ? getUrlPreview(platform, handle) : "";

                return (
                  <Reorder.Item
                    key={linkObj._dragId}
                    value={linkObj}
                    whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                    className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5 relative group/item sortable-item"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="drag-handle p-1.5 -ml-1 text-white/20 group-hover/item:text-white/40 transition-colors bg-white/5 rounded-lg">
                          <GripVertical size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ color: accentColor }}>
                          {platformConfig?.label || platform}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = [...formData.links];
                          newLinks.splice(index, 1);
                          handleChange("links", newLinks);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={platform}
                        onChange={(e) => {
                          const newLinks = [...formData.links];
                          newLinks[index] = { ...newLinks[index], platform: e.target.value, handle: "", url: "", favicon: undefined };
                          handleChange("links", newLinks);
                        }}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all text-sm font-medium"
                      >
                        {Object.entries(SOCIAL_PLATFORMS).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                      <div className="relative">
                        <input
                          value={handle}
                          onChange={(e) => {
                            const newHandle = e.target.value;
                            const newLinks = [...formData.links];
                            const url = buildSocialUrl(platform, newHandle);
                            let favicon = newLinks[index].favicon;
                            if (platform === "website" && newHandle.trim()) {
                              try {
                                const domain = new URL(newHandle.startsWith('http') ? newHandle : `https://${newHandle}`).hostname;
                                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                              } catch { /* invalid URL, skip favicon */ }
                            } else if (platform !== "website") {
                              favicon = undefined;
                            }
                            newLinks[index] = {
                              ...newLinks[index],
                              handle: newHandle,
                              url,
                              favicon,
                            };
                            handleChange("links", newLinks);
                          }}
                          className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all font-mono text-sm"
                          placeholder={platformConfig?.placeholder ?? t("blockEditor.social.handlePlaceholder")}
                        />
                      </div>
                    </div>
                    {preview && (
                      <p className="text-[10px] text-[var(--text-muted)] font-mono px-1 opacity-50 italic">
                        {preview}
                      </p>
                    )}
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
            <button
              type="button"
              onClick={() => handleChange("links", [...(formData.links || []), { platform: "twitter", handle: "", url: "", label: "", _dragId: Math.random().toString(36).substr(2, 9) }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              {t("blockEditor.social.addLink")}
            </button>
          </div>
        );
      case "community":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1 translate-y-2 opacity-50">{t("blockEditor.community.communitiesLabel")}</div>
            <Reorder.Group axis="y" values={formData.communities || []} onReorder={(newComms) => handleChange("communities", newComms)} className="space-y-3 pt-4">
              {(formData.communities || []).map((comm: any, index: number) => (
                <Reorder.Item
                  key={comm._dragId}
                  value={comm}
                  whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                  className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 relative group/item sortable-item"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="drag-handle p-1.5 -ml-1 text-white/20 group-hover/item:text-white/40 transition-colors bg-white/5 rounded-lg">
                        <GripVertical size={14} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ color: comm.color || accentColor }}>
                        {comm.name || t("blockEditor.community.itemFallback", { n: index + 1 })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newComms = [...formData.communities];
                        newComms.splice(index, 1);
                        handleChange("communities", newComms);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={comm.name || ""}
                      onChange={(e) => {
                        const newComms = [...formData.communities];
                        newComms[index] = { ...newComms[index], name: e.target.value };
                        handleChange("communities", newComms);
                      }}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all font-bold text-sm"
                      placeholder={t("blockEditor.community.namePlaceholder")}
                    />
                    <div className="flex items-center gap-3 bg-black/20 p-1.5 px-3 rounded-xl border border-white/5">
                      <div className="w-6 h-6 rounded-full border border-white/10 overflow-hidden shrink-0 relative">
                        <input
                          type="color"
                          value={comm.color || formData.accentColor || "#C8FF00"}
                          onChange={(e) => {
                            const newComms = [...formData.communities];
                            newComms[index] = { ...newComms[index], color: e.target.value };
                            handleChange("communities", newComms);
                          }}
                          className="absolute -inset-2 w-10 h-10 cursor-pointer"
                        />
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-black opacity-60">{t("blockEditor.community.badgeColor")}</div>
                    </div>
                  </div>

                  <input
                    value={comm.link || ""}
                    onChange={(e) => {
                      const newComms = [...formData.communities];
                      newComms[index] = { ...newComms[index], link: e.target.value };
                      handleChange("communities", newComms);
                    }}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all font-mono text-xs opacity-70"
                    placeholder="https://link-comunidad.com"
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button
              type="button"
              onClick={() => handleChange("communities", [...(formData.communities || []), { name: "", color: formData.accentColor || "#C8FF00", _dragId: Math.random().toString(36).substr(2, 9) }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              {t("blockEditor.community.addCommunity")}
            </button>
          </div>
        );
      case "writing":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1">{t("blockEditor.writing.postsLabel")}</div>
            {(formData.posts || [{ title: "", link: "", date: "" }]).map((post: any, index: number) => (
              <div key={index} className="space-y-3 p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                <input
                  value={post.title || ""}
                  onChange={(e) => {
                    const posts = [...(formData.posts || [])];
                    posts[index] = { ...posts[index], title: e.target.value };
                    handleChange("posts", posts);
                  }}
                  className="w-full p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                  placeholder={t("blockEditor.writing.titlePlaceholder")}
                />
                <input
                  value={post.link || ""}
                  onChange={(e) => {
                    const posts = [...(formData.posts || [])];
                    posts[index] = { ...posts[index], link: e.target.value };
                    handleChange("posts", posts);
                  }}
                  className="w-full p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                  placeholder="https://..."
                />
                <input
                  type="date"
                  value={post.date || ""}
                  onChange={(e) => {
                    const posts = [...(formData.posts || [])];
                    posts[index] = { ...posts[index], date: e.target.value };
                    handleChange("posts", posts);
                  }}
                  className="w-full p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-xs"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleChange("posts", [...(formData.posts || []), { title: "", link: "", date: "" }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              {t("blockEditor.writing.addPost")}
            </button>
          </div>
        );
      case "github":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.github.searchLabel")}</div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("blockEditor.github.searchPlaceholder")}
                  className="w-full p-4 pl-12 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-medium"
                  value={githubSearch}
                  onChange={(e) => setGithubSearch(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                </div>
              </div>

              {githubResults.length > 0 && (
                <div className="space-y-2 p-2 bg-black/20 rounded-2xl border border-[var(--border)]">
                  {githubResults.map((user: any) => (
                    <button
                      key={user.id}
                      onClick={async () => {
                        handleChange("username", user.login);
                        setGithubResults([]);
                        // Pull full real stats (stars, repos, followers, heatmap,
                        // monthly commits) via the authenticated GitHub service.
                        setRefreshingGithub(true);
                        setGithubRefreshError(null);
                        try {
                          const res = await fetch(`/api/github/import?username=${encodeURIComponent(user.login)}`);
                          const data = res.ok ? await res.json() : null;
                          if (data?.stats) {
                            handleChange("stats", data.stats);
                          } else {
                            setGithubRefreshError(data?.error || t("blockEditor.github.fetchError"));
                          }
                        } catch (err) {
                          console.error(err);
                          setGithubRefreshError(t("blockEditor.github.fetchError"));
                        } finally {
                          setRefreshingGithub(false);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface2)] transition-all group text-left"
                    >
                      <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-[var(--border)]" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{user.login}</div>
                        <div className="text-[10px] text-[var(--text-dim)] font-mono">github.com/{user.login}</div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest transition-opacity">
                        {t("blockEditor.github.select")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 py-4 border-t border-b border-[var(--border)]/50">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-[var(--border)] shrink-0">
                <Github size={24} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest font-mono">{t("blockEditor.github.selectedProfile")}</div>
                <div className="font-bold text-lg text-[var(--accent)] font-mono">@{formData.username || t("blockEditor.github.noProfile")}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">Advanced Stats</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">PRO Feature</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("showAdvanced", !formData.showAdvanced)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.showAdvanced ? 'bg-[#C8FF00]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.showAdvanced ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="section-label !text-[9px]">{t("blockEditor.github.realStatsLabel")}</div>
                <button
                  type="button"
                  onClick={handleRefreshGithub}
                  disabled={refreshingGithub || !formData.username}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  <RefreshCw size={12} className={refreshingGithub ? "animate-spin" : ""} />
                  {refreshingGithub ? t("blockEditor.github.refreshing") : t("blockEditor.github.refresh")}
                </button>
              </div>
              {githubRefreshError && (
                <div className="text-[10px] text-red-300 px-1">{githubRefreshError}</div>
              )}
              {formData.stats?.syncedAt && (
                <div className="text-[9px] text-[var(--text-disabled)] font-mono px-1">
                  {t("blockEditor.github.syncedAt", { date: new Date(formData.stats.syncedAt).toLocaleDateString() })}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-center group hover:border-[var(--accent)] transition-all">
                  <div className="text-[9px] text-[var(--text-disabled)] uppercase tracking-wider mb-1 font-mono">Stars</div>
                  <div className="font-black text-2xl tracking-tighter">{formData.stats?.stars || 0}</div>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-center group hover:border-[var(--accent)] transition-all">
                  <div className="text-[9px] text-[var(--text-disabled)] uppercase tracking-wider mb-1 font-mono">Repos</div>
                  <div className="font-black text-2xl tracking-tighter text-[var(--accent)]">{formData.stats?.repos || 0}</div>
                </div>
                <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-center group hover:border-[var(--accent)] transition-all">
                  <div className="text-[9px] text-[var(--text-disabled)] uppercase tracking-wider mb-1 font-mono">Followers</div>
                  <div className="font-black text-2xl tracking-tighter text-blue-400">{formData.stats?.followers || 0}</div>
                </div>
              </div>

              {formData.showAdvanced && (
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="text-xs font-bold text-white mb-2">{t("blockEditor.github.advancedMetrics")}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[8px] text-[var(--text-muted)] uppercase font-mono">{t("blockEditor.github.commits12mo")}</div>
                      <div className="font-black text-2xl tracking-tighter text-white">{formData.stats?.commitsThisYear ?? formData.stats?.totalCommits ?? 0}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Pull Requests</div>
                      <div className="font-black text-2xl tracking-tighter text-white">{formData.stats?.pullRequests ?? 0}</div>
                    </div>
                  </div>
                  {formData.stats?.topLanguages?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.stats.topLanguages.map((l: any, i: number) => (
                        <span key={i} className="text-[10px] font-mono text-[var(--text-dim)] bg-black/30 rounded-full px-2 py-0.5">
                          {l.name} {l.percent}%
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="p-5 bg-[var(--accent-dim)]/20 border border-[var(--accent)]/20 rounded-2xl flex gap-4 items-start">
              <div className="pt-1"><Sparkles size={16} className="text-[var(--accent)]" /></div>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                {t("blockEditor.github.infoPrefix")} <span className="text-white font-medium">{t("blockEditor.github.infoRefreshBold")}</span> {t("blockEditor.github.infoSuffix")} <br />
                <span className="text-white font-medium">{t("blockEditor.github.infoSave")}</span>
              </p>
            </div>
          </div>
        );
      case "cv":
        return (
          <div className="space-y-6">
            <FileUpload
              label={t("blockEditor.cv.fileLabel")}
              value={formData.fileUrl}
              onChange={(url) => handleChange("fileUrl", url)}
              folder="cvs"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.cv.buttonTitleLabel")}</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder={t("blockEditor.cv.buttonTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.cv.descriptionLabel")}</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-20 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder={t("blockEditor.cv.descriptionPlaceholder")}
              />
            </div>
          </div>
        );
      case "media":
        return (
          <div className="space-y-6">
            <FileUpload
              label={t("blockEditor.media.fileLabel")}
              value={formData.url}
              onChange={(url) => handleChange("url", url)}
              folder="media"
              accept="image/*,video/*"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.media.urlLabel")}</div>
              <input
                value={formData.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between section-label !text-[9px] px-1">
                <span>{t("blockEditor.media.titleLabel")}</span>
                <AIRewriteButton text={formData.title || ""} onSelect={(v) => handleChange("title", v)} accentColor={accentColor} />
              </div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder={t("blockEditor.media.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.media.linkLabel")}</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://otro-sitio.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between section-label !text-[9px] px-1">
                <span>{t("blockEditor.media.descriptionLabel")}</span>
                <AIRewriteButton text={formData.description || ""} onSelect={(v) => handleChange("description", v)} accentColor={accentColor} />
              </div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder={t("blockEditor.media.descriptionPlaceholder")}
              />
            </div>
          </div>
        );
      case "certification":
        return (
          <div className="space-y-6">
            <ImageUpload
              label={t("blockEditor.certification.iconLabel")}
              value={formData.icon}
              onChange={(url) => handleChange("icon", url)}
              folder="certs"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.certification.nameLabel")}</div>
              <input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder="AWS Certified Solutions Architect"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.certification.issuerLabel")}</div>
                <input
                  value={formData.issuer || ""}
                  onChange={(e) => handleChange("issuer", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">{t("blockEditor.certification.dateLabel")}</div>
                <input
                  value={formData.date || ""}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="2026"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.certification.linkLabel")}</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
          </div>
        );
      case "achievement":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.achievement.titleLabel")}</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder={t("blockEditor.achievement.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.achievement.descriptionLabel")}</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder={t("blockEditor.achievement.descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.achievement.dateLabel")}</div>
              <input
                value={formData.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                placeholder={t("blockEditor.achievement.datePlaceholder")}
              />
            </div>
          </div>
        );
      case "custom":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.custom.labelLabel")}</div>
              <input
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs uppercase"
                placeholder={t("blockEditor.custom.labelPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.custom.titleLabel")}</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold text-xl"
                placeholder={t("blockEditor.custom.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.custom.descriptionLabel")}</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder={t("blockEditor.custom.descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.custom.linkLabel")}</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
          </div>
        );
      case "collab":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1 translate-y-2 opacity-50">{t("blockEditor.collab.collaboratorsLabel")}</div>
            <div className="space-y-3 pt-4">
              {(formData.users || []).map((user: any, index: number) => (
                <div key={user._dragId || index} className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5 relative group/item">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ color: accentColor }}>
                      {t("blockEditor.collab.itemLabel", { n: index + 1 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newUsers = [...formData.users];
                        newUsers.splice(index, 1);
                        handleChange("users", newUsers);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={user.username || ""}
                      onChange={(e) => {
                        const newUsers = [...(formData.users || [])];
                        newUsers[index] = { ...newUsers[index], username: e.target.value };
                        handleChange("users", newUsers);
                      }}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all font-mono text-sm"
                      placeholder={t("blockEditor.collab.usernamePlaceholder")}
                    />
                    <input
                      value={user.role || ""}
                      onChange={(e) => {
                        const newUsers = [...(formData.users || [])];
                        newUsers[index] = { ...newUsers[index], role: e.target.value };
                        handleChange("users", newUsers);
                      }}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/5 focus:border-[var(--accent)] outline-none transition-all text-sm"
                      placeholder={t("blockEditor.collab.rolePlaceholder")}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleChange("users", [...(formData.users || []), { username: "", role: "", _dragId: Math.random().toString(36).substr(2, 9) }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              {t("blockEditor.collab.addCollaborator")}
            </button>
          </div>
        );
      case "ecosystem":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">{t("blockEditor.ecosystem.titleLabel")}</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder={t("blockEditor.ecosystem.titlePlaceholder")}
              />
            </div>

            <div className="p-5 bg-black/20 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{t("blockEditor.ecosystem.hideHeaderTitle")}</div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest mt-0.5">
                    {t("blockEditor.ecosystem.hideHeaderSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("hideHeaderEcosystem", !formData.hideHeaderEcosystem)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.hideHeaderEcosystem ? 'bg-[#C8FF00]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.hideHeaderEcosystem ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl border border-white/5">
                <Globe size={14} className="text-[var(--text-dim)] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
                  {t("blockEditor.ecosystem.hideHeaderHint")}
                 </p>
              </div>
            </div>

            <div className="p-4 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20">
              <p className="text-[11px] text-[var(--text-dim)]">
                <span className="text-white font-bold">{t("blockEditor.ecosystem.noteLabel")}</span> {t("blockEditor.ecosystem.noteBody")}
              </p>
            </div>
          </div>
        );
      default:
        return <div>{t("blockEditor.notImplemented")}</div>;
    }
  };

  const renderSizeControls = () => {
    // Blocks that make sense to resize
    const resizableTypes = ['hero', 'building', 'project', 'github', 'stack', 'community', 'writing', 'cv', 'media', 'certification', 'achievement', 'custom', 'collab', 'ecosystem'];
    if (!resizableTypes.includes(block.type)) return null;

    const isHero = block.type === 'hero';

    return (
      <div className="space-y-6 pt-8 mt-8 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <div className="section-label !text-[10px] tracking-[0.2em] font-black">{t("blockEditor.size.gridConfig")}</div>
        </div>

        <div className={`grid ${isHero ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div className="space-y-3">
            <label className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest px-1 block opacity-70">
              {t("blockEditor.size.widthLabel")}
            </label>
            <div className="relative">
              <select
                value={formData.col_span || (isHero ? 2 : 1)}
                onChange={(e) => handleChange("col_span", parseInt(e.target.value))}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none font-bold text-sm cursor-pointer hover:border-[var(--accent)] transition-all focus:ring-2 focus:ring-[var(--accent)]/20 appearance-none pr-10"
                style={{ '--accent': accentColor } as any}
              >
                <option value={1}>{isHero ? t("blockEditor.size.col1Hero") : t("blockEditor.size.col1")}</option>
                <option value={2}>{isHero ? t("blockEditor.size.col2Hero") : t("blockEditor.size.col2")}</option>
                {!isHero && (
                  <>
                    <option value={3}>{t("blockEditor.size.col3")}</option>
                    <option value={4}>{t("blockEditor.size.col4")}</option>
                  </>
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {!isHero && (
            <div className="space-y-3">
              <label className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest px-1 block opacity-70">
                {t("blockEditor.size.heightLabel")}
              </label>
              <div className="relative">
                <select
                  value={formData.row_span || 1}
                  onChange={(e) => handleChange("row_span", parseInt(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 outline-none font-bold text-sm cursor-pointer hover:border-[var(--accent)] transition-all focus:ring-2 focus:ring-[var(--accent)]/20 appearance-none pr-10"
                  style={{ '--accent': accentColor } as any}
                >
                  <option value={1}>{t("blockEditor.size.row1")}</option>
                  <option value={2}>{t("blockEditor.size.row2")}</option>
                  <option value={3}>{t("blockEditor.size.row3")}</option>
                  <option value={4}>{t("blockEditor.size.row4")}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-white/5 text-[var(--accent)]" style={{ color: accentColor }}>
            <Sparkles size={14} />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">
            <span className="text-[var(--text-dim)]">{t("blockEditor.size.tipLabel")}</span> {isHero ? t("blockEditor.size.tipHero") : t("blockEditor.size.tipNonHero")} {t("blockEditor.size.tipSuffix")}
          </p>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="portal-root fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full md:max-w-lg bg-[var(--surface)] border-t md:border border-[var(--border)] rounded-t-3xl md:rounded-3xl overflow-hidden z-10 shadow-2xl flex flex-col max-h-[90vh] pt-4 md:pt-0"
          >
            <div className="w-12 h-1.5 bg-[var(--border-bright)] rounded-full mx-auto md:hidden mb-2 shrink-0" />
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border)] shrink-0">
              <div>
                <h3 className="text-xl font-bold">{t("blockEditor.modalTitle")}</h3>
                <p className="text-sm text-[var(--text-dim)] font-mono mt-1 uppercase tracking-widest hidden md:block">{t("blockEditor.typeLabel")} {block.type}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--surface2)] rounded-full transition-colors hidden md:block">
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] flex-1">
              {renderFields()}
              {renderSizeControls()}
            </div>

            <div className="p-4 md:p-6 border-t border-[var(--border)] bg-[var(--surface)] flex gap-4 shrink-0 pb-8 md:pb-6">
              <button
                onClick={onClose}
                className="px-6 md:px-8 py-4 rounded-2xl font-bold text-sm md:text-base text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all"
              >
                {t("blockEditor.cancel")}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}
              >
                <Save size={18} />
                {t("blockEditor.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
