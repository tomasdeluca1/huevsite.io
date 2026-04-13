import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface WinnerEmailProps {
  name: string;
  username: string;
  week: string;
  formUrl?: string;
}

export const WinnerEmail: React.FC<Readonly<WinnerEmailProps>> = ({
  name,
  username,
  week,
  formUrl,
}) => (
  <EmailLayout previewText={`¡Felicitaciones ${name}, sos el builder de la semana!`}>
    <div style={{
      background: 'linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)',
      padding: '40px',
      borderRadius: '24px',
      textAlign: 'center',
      border: '1px solid rgba(200, 255, 0, 0.2)'
    }}>
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '16px' 
       }}>🏆</div>
      <h2 style={{ 
        fontSize: '32px', 
        fontWeight: '800', 
        margin: '0 0 8px 0',
        lineHeight: '1.1'
      }}>
        ¡Sos el builder de la semana!
      </h2>
      <p style={{ color: '#C8FF00', fontWeight: 'bold', margin: '0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Showcase {week}
      </p>
    </div>

    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#a1a1aa' }}>
        Hola <strong>{name}</strong> (@{username}), la comunidad ha hablado. 
        Tu board fue el más nominado de la semana y ahora sos el protagonista de nuestra landing page.
      </p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#71717a', marginTop: '24px' }}>
        Tu perfil estará destacado durante toda la semana para que miles de builders vean lo que estás buildeando.
      </p>
    </div>

    <div style={{ textAlign: 'center', marginTop: '16px' }}>
      <a href={`https://huevsite.io/${username}`} style={{
        backgroundColor: '#C8FF00',
        color: '#000000',
        padding: '16px 32px',
        borderRadius: '12px',
        fontWeight: 'bold',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px'
      }}>
        Ver mi board en la home →
      </a>
    </div>

    {/* Interview form CTA */}
    {formUrl && (
      <div style={{
        marginTop: '40px',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid rgba(200, 255, 0, 0.15)',
        background: 'rgba(200, 255, 0, 0.04)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎙️</div>
        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>
          Completá tu perfil de Builder de la Semana
        </h3>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#a1a1aa', margin: '0 0 20px 0' }}>
          Respondé unas preguntas cortas sobre lo que estás buildeando. Con eso armamos
          tu nota para el blog, LinkedIn, X e Instagram.
        </p>
        <a href={formUrl} style={{
          backgroundColor: '#C8FF00',
          color: '#000000',
          padding: '16px 32px',
          borderRadius: '12px',
          fontWeight: 'bold',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '16px',
        }}>
          Completar formulario →
        </a>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '16px', lineHeight: '1.6' }}>
          <strong style={{ color: '#e4e4e7' }}>¿Qué te preguntamos?</strong> Quién sos, en qué proyecto estás laburando, qué stack usás y consejos para otros builders. Son 5 minutos.
        </p>
        <p style={{ fontSize: '12px', color: '#52525b', marginTop: '12px' }}>
          El link expira en 7 días.
        </p>
      </div>
    )}
  </EmailLayout>
);
