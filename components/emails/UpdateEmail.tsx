import * as React from 'react';
import { EmailLayout } from './EmailLayout';

// Founder newsletter — broadcast email enviado a la lista de Beehiiv.
//
// Positioning:
//   - Voz en primera persona (Tomás, no "el equipo de Huevsite").
//   - Hilo conductor: SEO aplicado a productos que estoy construyendo.
//   - Multi-proyecto: huevsite.io + creatibro, con foco en lo que aprendo
//     mientras hago crecer cada uno de manera orgánica.
//
// Cada vez que se envía un nuevo número, se reemplaza el bloque "BODY"
// con la nota correspondiente. El header/footer (intro del founder + firma
// + links a los proyectos) se mantienen estables para reforzar la marca
// personal y la coherencia de la lista.

export const UpdateEmail: React.FC = () => (
  <EmailLayout previewText="SEO desde la trinchera: lo que aprendo armando huevsite.io y creatibro">
    {/* HEADER — quién escribe y por qué */}
    <div style={{
      background: 'linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)',
      padding: '40px',
      borderRadius: '24px',
      textAlign: 'center',
      border: '1px solid rgba(200, 255, 0, 0.2)'
    }}>
      <div style={{
        fontSize: '12px',
        fontFamily: 'monospace',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#C8FF00',
        marginBottom: '12px'
      }}>
        Newsletter de Tomás · Edición #N
      </div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '800',
        margin: '0 0 12px 0',
        lineHeight: '1.2',
        color: '#ffffff'
      }}>
        SEO desde la trinchera 🥚
      </h2>
      <p style={{
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#a1a1aa',
        margin: '0',
        maxWidth: '480px',
        marginInline: 'auto'
      }}>
        Lo que estoy aprendiendo (y rompiendo) mientras hago crecer huevsite.io y creatibro de forma orgánica.
      </p>
    </div>

    {/* BODY — contenido del número */}
    <div style={{ padding: '32px 0', textAlign: 'left', color: '#a1a1aa' }}>
      <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '24px', color: '#ffffff' }}>
        Hola 👋
      </p>

      <p style={{ fontSize: '16px', lineHeight: '1.7', marginBottom: '24px' }}>
        Soy Tomás. Estoy armando dos productos en paralelo —{' '}
        <a href="https://huevsite.io" style={{ color: '#C8FF00', textDecoration: 'none', fontWeight: 700 }}>huevsite.io</a>{' '}
        (link-in-bio para builders) y{' '}
        <a href="https://creatibro.com" style={{ color: '#C8FF00', textDecoration: 'none', fontWeight: 700 }}>creatibro</a>{' '}
        (carruseles para Instagram con IA) — y este newsletter es el lugar donde te cuento lo que aprendo del SEO mientras los hago crecer sin presupuesto de ads.
      </p>

      <p style={{ fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
        Cero teoría sacada de Twitter. Sólo experimentos reales, números y lo que funcionó (o no) en mis propios productos.
      </p>

      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '10px', lineHeight: '1.3' }}>
          🔍 Esta semana: el experimento de la semana
        </h3>
        <p style={{ fontSize: '16px', lineHeight: '1.7', margin: '0' }}>
          [Reemplazá este bloque con la nota concreta del envío: hipótesis, qué probé, métricas antes/después, conclusión accionable. Mantené el resto del shell intacto.]
        </p>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '10px', lineHeight: '1.3' }}>
          🛠️ Lo que cambió en los productos
        </h3>
        <ul style={{ fontSize: '16px', lineHeight: '1.7', marginTop: '8px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>
            <strong style={{ color: '#ffffff' }}>huevsite.io</strong>: [release/feature de la semana].
          </li>
          <li style={{ marginBottom: '6px' }}>
            <strong style={{ color: '#ffffff' }}>creatibro</strong>: [release/feature de la semana].
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '10px', lineHeight: '1.3' }}>
          📚 Vale la pena leer
        </h3>
        <p style={{ fontSize: '16px', lineHeight: '1.7', margin: '0' }}>
          [1-3 links comentados que me ayudaron esta semana. Brevísimos: por qué cada uno vale tu tiempo.]
        </p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#ffffff', fontWeight: 'bold' }}>
        Si querés que cubra algún tema puntual de SEO o crecimiento orgánico, respondé este mail. Lo leo todo.
      </p>
    </div>

    {/* CTA — leer en el blog */}
    <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '32px' }}>
      <a href="https://huevsite.io/blog" style={{
        backgroundColor: '#C8FF00',
        color: '#000000',
        padding: '16px 32px',
        borderRadius: '12px',
        fontWeight: 'bold',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px'
      }}>
        Leer en el blog →
      </a>
    </div>

    {/* FOOTER — firma personal + links a proyectos */}
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
      <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#d4d4d8', marginBottom: '8px' }}>
        Nos vemos en el próximo,
      </p>
      <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#ffffff', fontWeight: 700, margin: '0 0 16px 0' }}>
        Tomás
      </p>
      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#71717a', margin: '0' }}>
        Construyo en público:{' '}
        <a href="https://huevsite.io" style={{ color: '#a1a1aa', textDecoration: 'underline' }}>huevsite.io</a>
        {' · '}
        <a href="https://creatibro.com" style={{ color: '#a1a1aa', textDecoration: 'underline' }}>creatibro</a>
      </p>
    </div>
  </EmailLayout>
);
