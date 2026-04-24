/**
 * ErrorBanner.jsx — Dismissible error banner with retry button.
 */

import { useState, useEffect } from 'react';

/**
 * @param {{ message: string, onRetry: () => void }} props
 */
export function ErrorBanner({ message, onRetry }) {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const now = new Date();
    setTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [message]);

  return (
    <div
      id="error-banner"
      role="alert"
      className="fade-up"
      style={{
        background: '#7f1d1d30',
        border: '1px solid #991b1b',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fca5a5',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          flexShrink: 0,
          marginTop: '0.1rem'
        }}>!</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Request Failed
          </span>
          <span style={{ color: '#fecaca', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {message}
          </span>
          {timestamp && (
            <span style={{ color: '#b91c1c', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
              @ {timestamp}
            </span>
          )}
        </div>
      </div>
      <button
        id="retry-btn"
        onClick={onRetry}
        style={{
          background: '#991b1b',
          border: 'none',
          borderRadius: '6px',
          padding: '0.5rem 1rem',
          color: '#fecaca',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
        onMouseOut={e => e.currentTarget.style.background = '#991b1b'}
      >
        Retry Request
      </button>
    </div>
  );
}
