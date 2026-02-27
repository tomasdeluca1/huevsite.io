"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Sparkles, Search, Github } from "lucide-react";
import { BlockData, getContrastColor } from "@/lib/profile-types";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { SOCIAL_PLATFORMS, SocialPlatformKey, buildSocialUrl, getUrlPreview } from "@/lib/social-platforms";

interface Props {
  block: BlockData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: BlockData) => void;
  accentColor?: string;
}

export function BlockEditorModal({ block, isOpen, onClose, onSave, accentColor = "#C8FF00" }: Props) {
  const [formData, setFormData] = useState<any>(block);
  const [mounted, setMounted] = useState(false);
  const [githubResults, setGithubResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar formData cuando cambia el bloque
  useEffect(() => {
    setFormData(block);
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
    // Asegurar que las URLs sociales estén construidas desde el handle
    if (block.type === 'social' && Array.isArray(dataToSave.links)) {
      dataToSave.links = dataToSave.links.map((l: any) => ({
        ...l,
        url: l.url || buildSocialUrl(l.platform, l.handle || ""),
      }));
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
                label="Foto de Perfil"
                value={formData.avatarUrl}
                onChange={(url) => handleChange("avatarUrl", url)}
                folder="avatars"
              />
              <p className="text-[10px] text-[var(--text-muted)] font-mono text-center">
                Proporción recomendada: 1:1 (cuadrada)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">// nombre</div>
                <input 
                  value={formData.name || ""} 
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                  placeholder="Tu nombre real"
                />
              </div>
              <div className="space-y-2">
                 <div className="section-label !text-[9px] px-1">// rol / tagline corto</div>
                <input 
                  value={formData.tagline || ""} 
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="builder"
                />
              </div>
            </div>
            <div className="space-y-2">
               <div className="section-label !text-[9px] px-1">// descripción (bio)</div>
              <textarea 
                value={formData.description || ""} 
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Buildeo productos desde BA..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <div className="section-label !text-[9px] px-1">// status</div>
                <input 
                  value={formData.status || ""} 
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="disponible para proyectos"
                />
              </div>
              <div className="space-y-2">
                 <div className="section-label !text-[9px] px-1">// ubicación</div>
                <input 
                  value={formData.location || ""} 
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="Buenos Aires 🇦🇷"
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
                label="Preview del Proyecto"
                value={formData.imageUrl}
                onChange={(url) => handleChange("imageUrl", url)}
                folder="projects"
              />
            )}
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// título</div>
              <input
                value={formData.project || formData.title || ""}
                onChange={(e) => handleChange(block.type === "building" ? "project" : "title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// descripción</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
              />
            </div>
            {(block.type === "building" || block.type === "project") && (
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">// tech stack (separadas por coma)</div>
                <input
                  value={Array.isArray(formData.stack) ? formData.stack.join(", ") : formData.stack || ""}
                  onChange={(e) => handleChange("stack", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-sm"
                  placeholder="React, TypeScript, Tailwind"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// link</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
            {block.type === "project" && (
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">// métricas</div>
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
              <div className="section-label !text-[9px] px-1">// etiqueta</div>
              <input
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all uppercase font-mono text-xs tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// valor</div>
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
              <div className="section-label !text-[9px] px-1">// tecnologías (separadas por coma)</div>
              <textarea
                value={Array.isArray(formData.items) ? formData.items.join(", ") : formData.items || ""}
                onChange={(e) => handleChange("items", e.target.value)}
                className="w-full p-4 h-32 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed font-mono text-sm"
                placeholder="TypeScript, React, Node.js, PostgreSQL, Tailwind"
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Preview: {Array.isArray(formData.items) ? formData.items.join(", ") : formData.items}
            </div>
          </div>
        );
      case "social":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1">// links sociales — ingresá solo el handle</div>
            {(formData.links || []).map((linkObj: any, index: number) => {
              const platform = linkObj.platform || "twitter";
              const platformConfig = SOCIAL_PLATFORMS[platform as SocialPlatformKey];
              const handle = linkObj.handle || "";
              const preview = handle ? getUrlPreview(platform, handle) : "";

              return (
                <div key={index} className="space-y-3 p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="section-label !text-[9px]">// red {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => {
                        const newLinks = [...formData.links];
                        newLinks.splice(index, 1);
                        handleChange("links", newLinks);
                      }}
                      className="text-red-500 hover:text-red-400 text-xs font-mono"
                    >
                      Eliminar
                    </button>
                  </div>
                  <select
                    value={platform}
                    onChange={(e) => {
                      const newLinks = [...formData.links];
                      newLinks[index] = { ...newLinks[index], platform: e.target.value, handle: "", url: "" };
                      handleChange("links", newLinks);
                    }}
                    className="w-full p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-sm"
                  >
                    {Object.entries(SOCIAL_PLATFORMS).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                  <input
                    value={handle}
                    onChange={(e) => {
                      const newHandle = e.target.value;
                      const newLinks = [...formData.links];
                      newLinks[index] = {
                        ...newLinks[index],
                        handle: newHandle,
                        url: buildSocialUrl(platform, newHandle),
                      };
                      handleChange("links", newLinks);
                    }}
                    className="w-full p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-sm"
                    placeholder={platformConfig?.placeholder ?? "handle"}
                  />
                  {preview && (
                    <p className="text-xs text-[var(--text-muted)] font-mono px-1">
                      → {preview}
                    </p>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => handleChange("links", [...(formData.links || []), { platform: "twitter", handle: "", url: "", label: "" }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              + Agregar otra red
            </button>
          </div>
        );
      case "community":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1">// comunidades</div>
            {(formData.communities || []).map((comm: any, index: number) => (
              <div key={index} className="space-y-3 p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                <div className="flex justify-between items-center mb-2">
                  <div className="section-label !text-[9px]">// comunidad {index + 1}</div>
                  <button 
                    type="button"
                    onClick={() => {
                      const newComms = [...formData.communities];
                      newComms.splice(index, 1);
                      handleChange("communities", newComms);
                    }}
                    className="text-red-500 hover:text-red-400 text-xs font-mono"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  value={comm.name || ""}
                  onChange={(e) => {
                    const newComms = [...formData.communities];
                    newComms[index] = { ...newComms[index], name: e.target.value };
                    handleChange("communities", newComms);
                  }}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                  placeholder="Ethereum Argentina, Palermo Valley..."
                />
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full border border-[var(--border-bright)] overflow-hidden shrink-0 relative">
                     <input
                        type="color"
                        value={comm.color || formData.accentColor || "#C8FF00"}
                        onChange={(e) => {
                          const newComms = [...formData.communities];
                          newComms[index] = { ...newComms[index], color: e.target.value };
                          handleChange("communities", newComms);
                        }}
                        className="absolute -inset-2 w-14 h-14 cursor-pointer"
                      />
                   </div>
                   <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-mono">Color del badge</div>
                </div>
              </div>
            ))}
             <button
              type="button"
              onClick={() => handleChange("communities", [...(formData.communities || []), { name: "", color: formData.accentColor || "#C8FF00" }])}
              className="w-full p-3 rounded-xl border border-dashed border-[var(--border-bright)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all text-sm"
            >
              + Agregar otra comunidad
            </button>
          </div>
        );
      case "writing":
        return (
          <div className="space-y-6">
            <div className="section-label !text-[9px] px-1">// artículos</div>
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
                  placeholder="Título del artículo"
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
              + Agregar otro artículo
            </button>
          </div>
        );
      case "github":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="section-label !text-[9px] px-1">// buscar perfil de github</div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscá por nombre o usuario..."
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
                        // Auto sync stats
                        try {
                          const [userRes, reposRes] = await Promise.all([
                            fetch(`https://api.github.com/users/${user.login}`),
                            fetch(`https://api.github.com/users/${user.login}/repos?sort=stars&per_page=100`)
                          ]);
                          
                          if (!userRes.ok) return;
                          
                          const userData = await userRes.json();
                          const repos = await reposRes.json();
                          const totalStars = Array.isArray(repos) ? repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0) : 0;

                          handleChange("stats", {
                            stars: totalStars,
                            repos: userData.public_repos,
                            followers: userData.followers
                          });
                        } catch (err) {
                          console.error(err);
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
                        Seleccionar
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
                <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest font-mono">Perfil seleccionado</div>
                <div className="font-bold text-lg text-[var(--accent)] font-mono">@{formData.username || "sin-perfil"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// estadísticas actuales</div>
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
            </div>
            
            <div className="p-5 bg-[var(--accent-dim)]/20 border border-[var(--accent)]/20 rounded-2xl flex gap-4 items-start">
               <div className="pt-1"><Sparkles size={16} className="text-[var(--accent)]" /></div>
               <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                 Las estadísticas se actualizan automáticamente al elegir tu perfil. <br/>
                 <span className="text-white font-medium">Click en Guardar para persistir los cambios en tu huevsite.</span>
               </p>
            </div>
          </div>
        );
      case "cv":
        return (
          <div className="space-y-6">
            <FileUpload
              label="Archivo de CV"
              value={formData.fileUrl}
              onChange={(url) => handleChange("fileUrl", url)}
              folder="cvs"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// título del botón</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder="Descargar CV"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// descripción (opcional)</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-20 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Frontend Engineer resumé"
              />
            </div>
          </div>
        );
      case "media":
        return (
          <div className="space-y-6">
            <FileUpload
              label="Archivo Media (Imagen o Video)"
              value={formData.url}
              onChange={(url) => handleChange("url", url)}
              folder="media"
              accept="image/*,video/*"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// url (o link externo de youtube/vimeo)</div>
              <input
                value={formData.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// título (opcional)</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder="Demo del producto"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// descripción (opcional)</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Mostrando cómo funciona..."
              />
            </div>
          </div>
        );
      case "certification":
        return (
          <div className="space-y-6">
            <ImageUpload
              label="Icono / Logo de Emisor"
              value={formData.icon}
              onChange={(url) => handleChange("icon", url)}
              folder="certs"
            />
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// nombre de certificación</div>
              <input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder="AWS Certified Solutions Architect"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">// emisor</div>
                <input
                  value={formData.issuer || ""}
                  onChange={(e) => handleChange("issuer", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="space-y-2">
                <div className="section-label !text-[9px] px-1">// fecha</div>
                <input
                  value={formData.date || ""}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// link al certificado</div>
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
              <div className="section-label !text-[9px] px-1">// título</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold"
                placeholder="Ganador Hackathon Vercel"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// descripción</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Primer puesto entre más de 500 equipos..."
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// fecha (opcional)</div>
              <input
                value={formData.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                placeholder="Noviembre 2023"
              />
            </div>
          </div>
        );
      case "custom":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// etiqueta / tag</div>
              <input
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs uppercase"
                placeholder="TIPO DE CONTENIDO"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// título</div>
              <input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-bold text-xl"
                placeholder="Música o Diseño 3D"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// descripción</div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Un poco de contexto sobre esto..."
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// link (opcional)</div>
              <input
                value={formData.link || ""}
                onChange={(e) => handleChange("link", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono text-xs"
                placeholder="https://..."
              />
            </div>
          </div>
        );
      default:
        return <div>Editor no implementado para este tipo de bloque</div>;
    }
  };

  const renderSizeControls = () => {
    // Blocks that make sense to resize
    const resizableTypes = ['hero', 'building', 'project', 'github', 'stack', 'community', 'writing', 'cv', 'media', 'certification', 'achievement', 'custom'];
    if (!resizableTypes.includes(block.type)) return null;

    return (
      <div className="space-y-4 pt-6 mt-6 border-t border-[var(--border)]/50">
        <div className="section-label !text-[9px] px-1 text-[var(--accent)]">// tamaño en la grilla</div>
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest px-1 block mb-1">Ancho (Columnas)</label>
             <select 
               value={formData.col_span || 1}
               onChange={(e) => handleChange("col_span", parseInt(e.target.value))}
               className="w-full p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-bright)] outline-none font-mono text-sm cursor-pointer hover:border-[var(--accent)] transition-colors focus:border-[var(--accent)] appearance-none"
             >
               <option value={1}>1 col (Chico)</option>
               <option value={2}>2 cols (Mitad)</option>
               <option value={3}>3 cols (Ancho)</option>
               <option value={4}>4 cols (Completo)</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest px-1 block mb-1">Alto (Filas)</label>
             <select 
               value={formData.row_span || 1}
               onChange={(e) => handleChange("row_span", parseInt(e.target.value))}
               className="w-full p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-bright)] outline-none font-mono text-sm cursor-pointer hover:border-[var(--accent)] transition-colors focus:border-[var(--accent)] appearance-none"
             >
               <option value={1}>1 fila (Normal)</option>
               <option value={2}>2 filas (Alto)</option>
               <option value={3}>3 filas (Muy Alto)</option>
             </select>
           </div>
        </div>
        <p className="text-[10px] text-[var(--text-dim)] px-1">
          Ajustá el tamaño del bloque para destacarlo. Tip: en celulares todos ocupan el 100% del ancho.
        </p>
      </div>
    );
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="portal-root fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
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
                <h3 className="text-xl font-bold">Editar Bloque</h3>
                <p className="text-sm text-[var(--text-dim)] font-mono mt-1 uppercase tracking-widest hidden md:block">type: {block.type}</p>
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
                className="btn btn-ghost !px-6 md:!px-8 flex-1 py-4 text-sm md:text-base"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="btn btn-primary flex flex-[2] items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap transition-colors"
                style={{ backgroundColor: accentColor, color: getContrastColor(accentColor) }}
              >
                <Save size={18} />
                Guardar cambios
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
