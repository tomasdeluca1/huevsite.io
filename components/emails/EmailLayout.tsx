import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, previewText }) => (
  <div style={{
    backgroundColor: '#050505',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '40px 20px',
    borderRadius: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #1a1a1a'
  }}>
    {previewText && <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>{previewText}</div>}
    
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '900', 
        letterSpacing: '-0.05em',
        margin: '0'
      }}>
        HUEV<span style={{ color: '#C8FF00' }}>SITE</span>.IO
      </h1>
    </div>

    {children}

    <footer style={{ 
      marginTop: '48px', 
      textAlign: 'center', 
      borderTop: '1px solid #1a1a1a',
      paddingTop: '24px'
    }}>
      <p style={{ color: '#52525b', fontSize: '12px', margin: '0' }}>
        // builder logic • enviado con ❤️ por el equipo de huevsite
      </p>
    </footer>
  </div>
);
