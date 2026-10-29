// Genera components/icons/SocialIcons.tsx a partir de simple-icons.
// Uso: npm install --save-dev simple-icons@13.21.0 && node scripts/gen-social-icons.js && npm uninstall simple-icons
// Version fijada: desde 14.0.0 simple-icons quito LinkedIn; 13.21.0 es la ultima con las nueve marcas.
const fs = require("fs");
const path = require("path");
let icons;
try {
  icons = require("simple-icons");
} catch (e) {
  console.error("Falta simple-icons. Instalalo, corré el generador y desinstalalo:");
  console.error("  npm i -D simple-icons@13.21.0 && node scripts/gen-social-icons.js && npm uninstall simple-icons");
  console.error("(la 14.0.0 quitó LinkedIn; usá exactamente la 13.21.0)");
  process.exit(1);
}

// clave de SOCIAL_PLATFORMS -> slug de simple-icons (no coinciden: twitter -> x).
// website no sale de simple-icons: es el Globe geometrico de abajo.
const MAP = {
  twitter: "x",
  github: "github",
  linkedin: "linkedin",
  discord: "discord",
  farcaster: "farcaster",
  telegram: "telegram",
  youtube: "youtube",
  twitch: "twitch",
  instagram: "instagram",
};

const pascal = (k) => k.charAt(0).toUpperCase() + k.slice(1);
const exportName = (k) => `${pascal(k)}Icon`;

function iconFor(slug) {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = icons[key];
  if (!icon || !icon.path) {
    console.error(`simple-icons no tiene el slug "${slug}" (${key})`);
    process.exit(1);
  }
  return icon;
}

const GLOBE =
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 9h-3.05a15.6 15.6 0 0 0-1.37-5.6A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.83 1.2 1.9 3.3 2.33 6.96H9.67C10.1 7.34 11.17 5.24 12 4.04ZM4.26 13h3.86c.1 1.9.5 3.8 1.37 5.6A8.03 8.03 0 0 1 4.26 13Zm3.86-2H4.26a8.03 8.03 0 0 1 5.23-5.6A15.6 15.6 0 0 0 8.12 11ZM12 19.96c-.83-1.2-1.9-3.3-2.33-6.96h4.66c-.43 3.66-1.5 5.76-2.33 6.96ZM14.51 18.6c.87-1.8 1.27-3.7 1.37-5.6h3.05a8.03 8.03 0 0 1-4.42 5.6Z";

const entries = Object.entries(MAP).map(([key, slug]) => ({ key, path: iconFor(slug).path }));
entries.push({ key: "website", path: GLOBE });

let out = `// ARCHIVO GENERADO por scripts/gen-social-icons.js. No editar a mano.
// Paths de simple-icons (CC0). "website" es un Globe geometrico escrito a mano.
import * as React from "react";
import type { SocialPlatformKey } from "@/lib/social-platforms";

export type SocialIconProps = { size?: number; className?: string };
export type SocialIconComponent = React.FC<SocialIconProps>;

function make(d: string, name: string): SocialIconComponent {
  const Icon: SocialIconComponent = ({ size = 20, className }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

`;
for (const e of entries) {
  out += `export const ${exportName(e.key)} = make(\n  ${JSON.stringify(e.path)},\n  "${exportName(e.key)}"\n);\n\n`;
}
out += `/** Globe: icono de reserva para plataformas desconocidas. */\nexport const FallbackIcon: SocialIconComponent = (props) => <WebsiteIcon {...props} />;\nFallbackIcon.displayName = \"FallbackIcon\";\n\n`;
out += `export const SOCIAL_ICONS: Record<SocialPlatformKey, SocialIconComponent> = {\n`;
for (const e of entries) out += `  ${e.key}: ${exportName(e.key)},\n`;
out += `};\n`;

const target = path.join(__dirname, "..", "components", "icons", "SocialIcons.tsx");
fs.writeFileSync(target, out);
console.log(`Escrito ${target} con ${entries.length} iconos`);
