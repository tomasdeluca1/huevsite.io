import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface FeedbackEmailProps {
  userEmail: string;
  category: string;
  content: string;
  userId: string;
}

export const FeedbackEmail: React.FC<Readonly<FeedbackEmailProps>> = ({
  userEmail,
  category,
  content,
  userId,
}) => (
  <EmailLayout previewText={`Nuevo feedback de ${userEmail}`}>
    <div style={{
      background: 'rgba(200, 255, 0, 0.05)',
      padding: '24px',
      borderRadius: '24px',
      border: '1px solid rgba(200, 255, 0, 0.1)'
    }}>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: '800', 
        margin: '0 0 16px 0',
        color: '#C8FF00'
      }}>
        🚀 Nuevo Feedback Recibido
      </h2>
      
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Usuario</p>
        <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold' }}>{userEmail}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Categoría</p>
        <span style={{ 
          background: '#1a1a1a', 
          padding: '4px 8px', 
          borderRadius: '6px', 
          fontSize: '13px',
          border: '1px solid #333'
        }}>
          {category}
        </span>
      </div>

      <div style={{ 
        background: '#0a0a0a', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid #1a1a1a',
        marginTop: '24px'
      }}>
        <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.6', color: '#a1a1aa', whiteSpace: 'pre-wrap' }}>
          {content}
        </p>
      </div>

      <p style={{ fontSize: '10px', color: '#52525b', marginTop: '24px', fontFamily: 'monospace' }}>
        USER_ID: {userId}
      </p>
    </div>
  </EmailLayout>
);
