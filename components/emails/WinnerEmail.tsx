import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface WinnerEmailProps {
  name: string;
  username: string;
  week: string;
}

export const WinnerEmail: React.FC<Readonly<WinnerEmailProps>> = ({
  name,
  username,
  week,
}) => (
  <EmailLayout previewText={`¡Felicidaces ${name}, sos el builder de la semana!`}>
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
  </EmailLayout>
);
