"use client";

import { useState } from "react";
import { SocialBlock } from "@/components/blocks/Widgets";
import { SocialLinkEditor, type SocialLinkDraft } from "@/components/dashboard/SocialLinkEditor";
import { LinksProfile } from "@/components/profile/LinksProfile";
import { readSocialLinks } from "@/lib/social-url";
import type { SocialBlockData } from "@/lib/profile-types";

const BROKEN: SocialLinkDraft[] = [
  {
    platform: "linkedin",
    handle: "https://linkedin.com/in/https://evil.example/phish",
    url: "https://linkedin.com/in/https://evil.example/phish",
    _dragId: "bad",
  },
  {
    platform: "youtube",
    handle: "https://youtube.com/@https://www.youtube.com/@canal",
    url: "https://youtube.com/@https://www.youtube.com/@canal",
    _dragId: "yt",
  },
  {
    platform: "linkedin",
    handle: "https://www.linkedin.com/in/pela/ ",
    url: "https://linkedin.com/in/https://www.linkedin.com/in/pela/",
    _dragId: "li",
  },
  {
    platform: "website",
    handle: "pela.dev ",
    url: "pela.dev",
    _dragId: "web",
  },
];

const STORED = {
  links: [
    { platform: "linkedin", handle: "https://www.linkedin.com/in/pela/ ", url: "https://linkedin.com/in/https://www.linkedin.com/in/pela/" },
    { platform: "youtube", url: "https://youtube.com/@https://www.youtube.com/@canal" },
    { platform: "github", handle: "octocat ", url: "https://github.com/https://github.com/octocat" },
    { platform: "twitter", handle: "pela ", url: "https://x.com/pela" },
    { platform: "website", url: "pela.dev" },
    { platform: "linkedin", url: "https://linkedin.com/in/https://evil.example/phish" },
    { platform: "website", url: "javascript:alert(1)", label: "malo" },
  ],
};

const socialData = {
  id: "social",
  type: "social",
  order: 0,
  col_span: 2,
  row_span: 2,
  visible: true,
  links: STORED.links,
} as SocialBlockData;

export function SocialLinksPreview() {
  const [links, setLinks] = useState(BROKEN);
  const visible = readSocialLinks(STORED.links);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <style>{`:root { --accent: #C8FF00; --radius-xl: 1.5rem; }`}</style>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-2">
        <section id="social-editor" className="rounded-3xl border border-white/10 bg-[#111] p-4 md:p-6">
          <h1 className="mb-4 text-lg font-black tracking-tight">Editor</h1>
          <SocialLinkEditor links={links} onChange={setLinks} accentColor="#C8FF00" />
        </section>
        <section id="social-public" className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-black tracking-tight">Perfil público</h2>
            <div className="max-w-md">
              <SocialBlock data={socialData} accentColor="#C8FF00" />
            </div>
          </div>
          <div id="social-links-layout" className="overflow-hidden rounded-[2rem] border border-white/10">
            <LinksProfile
              blocks={[
                {
                  id: "hero",
                  type: "hero",
                  order: 0,
                  title: "Pela",
                  description: "Builder",
                },
                { id: "social", type: "social", order: 1, links: STORED.links },
              ]}
              globalStyle="pill"
              username="pela"
              displayName="Pela"
              bio="Builder"
              accentColor="#C8FF00"
              preview
            />
          </div>
          <ul id="social-hrefs" className="space-y-1 font-mono text-[11px] text-white/70">
            {visible.map((link) => (
              <li key={link.url} className="break-all">
                {link.platform}: {link.url}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
