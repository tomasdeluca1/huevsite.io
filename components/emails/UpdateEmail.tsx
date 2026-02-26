import * as React from 'react';
import { EmailLayout } from './EmailLayout';

export const UpdateEmail: React.FC = () => (
  <EmailLayout previewText={`Endorsements, premium cards, explorador reloded y la revolución social de Huevsite 🔥`}>
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
       }}>🚀</div>
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: '800', 
        margin: '0 0 8px 0',
        lineHeight: '1.2',
        color: '#ffffff'
      }}>
        Llegó la revolución social a Huevsite 🥚🔥
      </h2>
    </div>

    <div style={{ padding: '32px 0', textAlign: 'left', color: '#a1a1aa' }}>
      <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '24px' }}>
        ¡Hola builder! 👋
      </p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        Esta semana estuvimos trabajando a full en el motor (y en la pintura) de Huevsite para que la comunidad siga brillando. Subimos unas actualizaciones que te van a hacer la vida mucho más fácil a la hora de conectar con otros creadores:
      </p>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>🚀 Más de 10 lanzamientos en simultáneo</h3>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0' }}>
          Desde endorsements, la sección de explorar, interacciones sociales como un feed de seguimiento en camino para ver la actividad de otros builders, hasta un sistema completo re-vamp de premium para que desbloquees mejores bloques para tu set, ahora hay mucho más para exprimirle a tu portfolio.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>🔄 Creador de la semana: Renovado</h3>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0' }}>
          Sabemos que a lo largo de la semana podés descubrir proyectos increíbles. Ahora los votos son dinámicos: si ya nominaste a alguien pero querés cambiar tu voto, podés hacerlo con un solo clic. ¡Tenés tiempo hasta el domingo a la medianoche para decidirte!
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>🔍 Explorá y encontrá a tu tribu</h3>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0' }}>
          Lanzamos una vista "Explorar" completamente nueva, con filtros pensados para networking puro. Ahora podés ordenar la comunidad para ver:
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '8px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '4px' }}>Quiénes te siguen a vos y a quiénes seguís.</li>
          <li style={{ marginBottom: '4px' }}>Los perfiles actualizados más recientemente (para ver proyectos activos).</li>
          <li style={{ marginBottom: '4px' }}>Builders ordenados por Endorsements, Seguidores, y Nominaciones.</li>
        </ul>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>🌟 Los Ganadores y la magia PRO</h3>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0' }}>
          Si te das una vuelta por el Explorar (nuestra nueva vista por defecto "Categorías"), vas a ver algo distinto. El "Creador de la semana" actual está anclado en lo más alto, brillando más que nunca con animaciones especiales. Además, le dimos un nuevo diseño hiper premium a todas las tarjetas de los usuarios PRO para que sus perfiles destaquen de forma brutal en la grilla y tengan ese boost de impresiones.
        </p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ffffff', fontWeight: 'bold' }}>
        Entrá a tu cuenta, probá los nuevos filtros y, ya que estás... ¡dejale tu nominación a tu builder favorito de la semana!
      </p>
    </div>

    <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '24px' }}>
      <a href="https://huevsite.io/explore" style={{
        backgroundColor: '#C8FF00',
        color: '#000000',
        padding: '16px 32px',
        borderRadius: '12px',
        fontWeight: 'bold',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px'
      }}>
        Explorar la comunidad →
      </a>
    </div>

    <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
      <p style={{ fontSize: '14px', color: '#71717a' }}>
        ¡A seguir construyendo! 🚀<br/>El equipo de Huevsite.
      </p>
    </div>
  </EmailLayout>
);
