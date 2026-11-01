import * as React from 'react';
import { SITE_URL } from '@/lib/site-url';
import { BRAND } from '@/lib/brand';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

// Shared shell for every transactional/marketing email. Dark branded card on a
// black page, lime accent bar, real lowercase wordmark, comfortable body padding
// and a richer footer. Inline styles + simple divs for email-client safety.
export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, previewText }) => (
  <div
    style={{
      backgroundColor: BRAND.color.bg,
      margin: 0,
      padding: '28px 12px',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}
  >
    {previewText && (
      <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>{previewText}</div>
    )}

    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: BRAND.color.surface,
        border: `1px solid ${BRAND.color.border}`,
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* accent bar */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #C8FF00, #a3e635 55%, #65a30d)' }} />

      {/* header: el logo va como <img> con URL absoluta (un mail no resuelve rutas
          relativas) y con alt, que es lo que se lee si el cliente bloquea imágenes. */}
      <div style={{ padding: '28px 32px 4px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE_URL}/logo-huevsite.png`}
          alt="huevsite.io"
          width={164}
          height={40}
          style={{ display: 'inline-block', width: '164px', height: 'auto', border: 0 }}
        />
      </div>

      {/* body */}
      <div style={{ padding: '20px 32px 8px', color: '#e4e4e7', fontSize: '16px', lineHeight: 1.6 }}>
        {children}
      </div>

      {/* footer */}
      <div style={{ marginTop: '20px', padding: '24px 32px', borderTop: '1px solid #1a1a1e', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '10px', lineHeight: 1.5 }}>
          La red de builders. Mostrá lo que construís.
        </div>
        <a href="https://huevsite.io" style={{ color: '#C8FF00', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          huevsite.io
        </a>
        <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '14px' }}>
          Hecho con 🥚 por el equipo de huevsite
        </div>
      </div>
    </div>
  </div>
);
