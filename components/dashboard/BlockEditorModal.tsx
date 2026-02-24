"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Sparkles } from "lucide-react";
import { BlockData } from "@/lib/profile-types";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { SOCIAL_PLATFORMS, SocialPlatformKey, buildSocialUrl, getUrlPreview } from "@/lib/social-platforms";

interface Props {
  block: BlockData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: BlockData) => void;
}

export function BlockEditorModal({ block, isOpen, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<any>(block);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar formData cuando cambia el bloque
  useEffect(() => {
    setFormData(block);
  }, [block]);

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
            <ImageUpload 
              label="Foto de Perfil"
              value={formData.avatarUrl}
              onChange={(url) => handleChange("avatarUrl", url)}
              folder="avatars"
            />
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
                 <div className="section-label !text-[9px] px-1">// ubicación</div>
                <input 
                  value={formData.location || ""} 
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                  placeholder="Buenos Aires 🇦🇷"
                />
              </div>
            </div>
            <div className="space-y-2">
               <div className="section-label !text-[9px] px-1">// tagline</div>
              <textarea 
                value={formData.tagline || ""} 
                onChange={(e) => handleChange("tagline", e.target.value)}
                className="w-full p-4 h-24 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none leading-relaxed"
                placeholder="Buildeo productos desde BA..."
              />
            </div>
            <div className="space-y-2">
               <div className="section-label !text-[9px] px-1">// status</div>
              <input 
                value={formData.status || ""} 
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all"
                placeholder="disponible para proyectos"
              />
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
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// username de GitHub</div>
              <input
                value={formData.username || ""}
                onChange={(e) => handleChange("username", e.target.value)}
                className="w-full p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all font-mono"
                placeholder="tu-username"
              />
            </div>
            <div className="space-y-2">
              <div className="section-label !text-[9px] px-1">// estadísticas</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Stars</div>
                  <div className="font-bold text-lg">{formData.stats?.stars || 0}</div>
                </div>
                <div className="text-center py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Repos</div>
                  <div className="font-bold text-lg">{formData.stats?.repos || 0}</div>
                </div>
                <div className="text-center py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Followers</div>
                  <div className="font-bold text-lg">{formData.stats?.followers || 0}</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!formData.username) {
                  alert('Primero ingresá tu username de GitHub');
                  return;
                }
                try {
                  const response = await fetch(`https://api.github.com/users/${formData.username}`);
                  if (!response.ok) throw new Error('Usuario no encontrado');
                  const userData = await response.json();

                  const reposResponse = await fetch(`https://api.github.com/users/${formData.username}/repos?sort=stars&per_page=100`);
                  const repos = await reposResponse.json();
                  const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);

                  handleChange("stats", {
                    stars: totalStars,
                    repos: userData.public_repos,
                    followers: userData.followers
                  });
                  alert('Stats importados correctamente!');
                } catch (error) {
                  alert('Error al importar datos de GitHub. Verificá el username.');
                }
              }}
              className="w-full p-4 rounded-xl border border-[var(--border-bright)] bg-[var(--surface2)] hover:bg-[var(--accent)] hover:text-black transition-all font-bold"
            >
              🔄 Sincronizar stats de GitHub
            </button>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 leading-relaxed">
                💡 Tip: Hacé clic para mantener tus estadísticas actualizadas. No se pueden editar manualmente.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border-bright)] flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="section-sub text-center mx-auto">
              El editor para este bloque estará disponible pronto. 🇦🇷 <br/>
              Por ahora podés reordenarlo en el grid.
            </p>
          </div>
        );
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="portal-root fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="relative w-[90%] max-w-xl bg-[var(--surface)] border border-[var(--border-bright)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 mx-auto"
          >
            <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-black/40">
              <div>
                <div className="section-label mb-1">// configuración</div>
                <h3 className="text-3xl font-extrabold tracking-tight">Editar bloque</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-full hover:bg-[var(--surface2)] transition-all text-[var(--text-muted)] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {renderFields()}
            </div>

            <div className="p-8 border-t border-[var(--border)] bg-black/20 flex gap-4">
              <button 
                onClick={onClose}
                className="btn btn-ghost !px-8 flex-1 py-4"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="btn btn-primary flex items-center gap-2"
                style={{ backgroundColor: "var(--accent)", color: "black" }}
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
