import * as React from 'react';
import { EmailLayout } from './EmailLayout';
import { EmailCtaStrip } from './EmailCtaStrip';

interface MonthlyDigestEmailProps {
  monthName: string;
  topBuilders: {
    name: string;
    username: string;
    avatarUrl?: string | null;
    score: number;
  }[];
  weeklyWinners: {
    week: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  }[];
  features: {
    title: string;
    excerpt: string;
    slug: string;
  }[];
  stats: {
    totalBuilders?: number;
    totalNominations?: number;
  };
}

export const MonthlyDigestEmail: React.FC<Readonly<MonthlyDigestEmailProps>> = ({
  monthName,
  topBuilders,
  weeklyWinners,
  features,
  stats,
}) => (
  <EmailLayout previewText={`¡Resumen de ${monthName} en Huevsite! Mirá quiénes fueron los builders destacados.`}>
    {/* Header Section */}
    <div style={{
      background: 'linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)',
      padding: '40px 20px',
      borderRadius: '24px',
      textAlign: 'center',
      border: '1px solid rgba(200, 255, 0, 0.2)',
      marginBottom: '32px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: '800', 
        margin: '0 0 8px 0',
        lineHeight: '1.1'
      }}>
        Resumen Mensual: {monthName}
      </h2>
      <p style={{ color: '#a1a1aa', margin: '0', fontSize: '16px' }}>
        Un mes increíble buildeando juntos.
      </p>
    </div>

    {/* Top 3 Scores Section - Visual Podium */}
    {topBuilders && topBuilders.length >= 3 && (
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #1a1a1a', paddingBottom: '12px', marginBottom: '32px', textAlign: 'left' }}>
          🔥 Top Builders del Mes
        </h3>
        
        <div style={{ 
          display: 'table', 
          width: '100%', 
          borderSpacing: '10px 0', 
          marginBottom: '20px',
          tableLayout: 'fixed'
        }}>
          {/* Pos #2 */}
          <div style={{ display: 'table-cell', verticalAlign: 'bottom', width: '33.3%' }}>
            <div style={{ marginBottom: '12px' }}>
              <img src={topBuilders[1].avatarUrl || ''} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #52525b' }} />
            </div>
            <div style={{ backgroundColor: '#111', padding: '16px 8px', borderRadius: '12px 12px 0 0', border: '1px solid #222', borderBottom: 'none' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#a1a1aa' }}>#2</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0' }}>{topBuilders[1].name}</div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#C8FF00' }}>{topBuilders[1].score}</div>
            </div>
          </div>

          {/* Pos #1 */}
          <div style={{ display: 'table-cell', verticalAlign: 'bottom', width: '33.3%' }}>
            <div style={{ marginBottom: '12px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: '-15px', left: '0', right: '0', fontSize: '20px' }}>👑</div>
               <img src={topBuilders[0].avatarUrl || ''} style={{ width: '70px', height: '70px', borderRadius: '50%', border: '4px solid #C8FF00' }} />
            </div>
            <div style={{ backgroundColor: '#1a1a1a', padding: '24px 8px', borderRadius: '16px 16px 0 0', border: '2px solid #C8FF00', borderBottom: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#C8FF00' }}>#1</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0' }}>{topBuilders[0].name}</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#C8FF00' }}>{topBuilders[0].score}</div>
            </div>
          </div>

          {/* Pos #3 */}
          <div style={{ display: 'table-cell', verticalAlign: 'bottom', width: '33.3%' }}>
            <div style={{ marginBottom: '12px' }}>
              <img src={topBuilders[2].avatarUrl || ''} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #3f3f46' }} />
            </div>
            <div style={{ backgroundColor: '#0a0a0a', padding: '12px 8px', borderRadius: '8px 8px 0 0', border: '1px solid #1a1a1a', borderBottom: 'none' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#71717a' }}>#3</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0' }}>{topBuilders[2].name}</div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#C8FF00' }}>{topBuilders[2].score}</div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Weekly Winners Section - Grouped by Week */}
    {weeklyWinners.length > 0 && (
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #1a1a1a', paddingBottom: '12px', marginBottom: '24px' }}>
          ⭐ Builders de la Semana
        </h3>
        
        {/* We assume weeklyWinners are already grouped/sorted by week in the route logic */}
        {Array.from(new Set(weeklyWinners.map(w => w.week))).map((week) => (
          <div key={week} style={{ marginBottom: '24px' }}>
            <p style={{ color: '#C8FF00', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              {week}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {weeklyWinners.filter(w => w.week === week).map((w, i) => (
                <div key={i} style={{ 
                  backgroundColor: '#0a0a0a', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '1px solid #1a1a1a',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {w.avatarUrl ? (
                    <img src={w.avatarUrl} alt={w.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '16px' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#71717a', border: '1px solid #333', marginRight: '16px' }}>
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</p>
                    <p style={{ color: '#71717a', fontSize: '12px', margin: '0' }}>@{w.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* New Features Section */}
    {features.length > 0 && (
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #1a1a1a', paddingBottom: '12px', marginBottom: '20px' }}>
          🚀 ¿Qué hubo de nuevo?
        </h3>
        {features.map((f, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0', color: '#C8FF00' }}>{f.title}</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#a1a1aa', margin: '0 0 12px 0' }}>{f.excerpt}</p>
            <a href={`https://huevsite.io/blog/${f.slug}?utm_source=email&utm_medium=email&utm_campaign=monthly-digest&utm_content=blog`} style={{ color: '#ffffff', textDecoration: 'underline', fontSize: '13px' }}>Leer más</a>
          </div>
        ))}
      </div>
    )}

    {/* Community Stats */}
    <div style={{ 
      backgroundColor: 'rgba(200, 255, 0, 0.05)', 
      padding: '32px 24px', 
      borderRadius: '24px', 
      border: '1px solid rgba(200, 255, 0, 0.1)',
      textAlign: 'center',
      marginBottom: '48px'
    }}>
      <h3 style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px 0', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>Crecimiento de la comunidad</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
        <div style={{ flex: '1' }}>
          <p style={{ fontSize: '32px', fontWeight: '900', margin: '0', color: '#C8FF00' }}>
            {(stats.totalBuilders ?? 0) > 0 ? `+${stats.totalBuilders}` : (stats.totalBuilders ?? 0)}
          </p>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>Nuevos Builders</p>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
        <div style={{ flex: '1' }}>
          <p style={{ fontSize: '32px', fontWeight: '900', margin: '0', color: '#C8FF00' }}>{stats.totalNominations ?? 0}</p>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>Nominaciones Totales</p>
        </div>
      </div>
    </div>

    {/* Quick actions */}
    <div style={{ marginBottom: '40px' }}>
      <EmailCtaStrip campaign="monthly-digest" />
    </div>

    {/* Final CTA */}
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '24px' }}>
        ¡Gracias por ser parte de Huevsite! Seguí buildeando cosas increíbles.
      </p>
      <a href="https://huevsite.io/explore?utm_source=email&utm_medium=email&utm_campaign=monthly-digest&utm_content=explore" style={{
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
  </EmailLayout>
);
