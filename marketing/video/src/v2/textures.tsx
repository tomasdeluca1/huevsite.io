import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import type { BuilderCard } from "../data";

const W = 1024;
const H = 576;
const cache = new Map<string, THREE.CanvasTexture>();

function loadImage(file: string | null): Promise<HTMLImageElement | null> {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = staticFile(file);
  });
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

function drawCard(card: BuilderCard, avatar: HTMLImageElement | null) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  ctx.fillStyle = "#0E0E0F";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = card.isWinner ? "#C8FF00" : "#202022";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  const r = 72;
  const ax = 56;
  const ay = 56;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + r, ay + r, r, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, ax, ay, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#171718";
    ctx.fillRect(ax, ay, r * 2, r * 2);
    ctx.fillStyle = "#F0F0F0";
    ctx.font = "800 72px 'Bricolage Grotesque'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((card.name || "?").replace(/^@/, "").charAt(0).toUpperCase(), ax + r, ay + r + 4);
  }
  ctx.restore();

  const textX = 230;
  const maxW = W - textX - 48;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 88px 'Bricolage Grotesque'";
  ctx.fillText(fit(ctx, card.name, maxW), textX, 48);

  ctx.fillStyle = "#C8FF00";
  ctx.font = "500 40px 'JetBrains Mono'";
  ctx.fillText(fit(ctx, `@${card.username}`, maxW), textX, 156);

  const tag = (card.tagline || card.location || "").replace(/\s+/g, " ").trim();
  if (tag) {
    ctx.fillStyle = "#D1D1D1";
    ctx.font = "800 36px 'Bricolage Grotesque'";
    const words = tag.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
      if (lines.length === 2) break;
    }
    if (lines.length < 2 && line) lines.push(line);
    lines.slice(0, 2).forEach((ln, i) => {
      ctx.fillText(fit(ctx, ln, maxW), textX, 240 + i * 48);
    });
  }

  if (card.country) {
    ctx.fillStyle = "#888888";
    ctx.font = "500 32px 'JetBrains Mono'";
    ctx.textAlign = "right";
    ctx.fillText(card.country, W - 40, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function useCardTextures(cards: BuilderCard[]) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("builder card textures"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      const images = await Promise.all(cards.map((card) => loadImage(card.avatarFile)));
      if (cancelled) return;
      cards.forEach((card, i) => {
        if (!cache.has(card.username)) cache.set(card.username, drawCard(card, images[i]));
      });
      setReady(true);
      continueRender(handle);
    })().catch((err) => {
      console.error(err);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
  }, [cards, handle]);

  return ready ? cache : null;
}

export function useLogoTexture() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender("logo texture"));

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      staticFile("logo-huevsite.png"),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
        continueRender(handle);
      },
      undefined,
      () => continueRender(handle),
    );
  }, [handle]);

  return texture;
}
