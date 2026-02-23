import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: "--font-display-next",
  display: "swap",
  adjustFontFallback: false
});

const jetbrains = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono-next",
  display: "swap",
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: "huevsite.io | Mostrá lo que buildás",
  description: "Red social y portfolio para builders de Argentina y LATAM.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body className="antialiased selection:bg-[var(--accent)] selection:text-black font-sans">
        {children}
      </body>
      <Script 
        defer 
        src="https://cloud.umami.is/script.js" 
        data-website-id="d3a90850-920a-4f6f-82ba-3f993ef66818" 
      />
    </html>
  );
}
