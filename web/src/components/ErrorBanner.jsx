/**
 * ErrorBanner.jsx — Dismissible error banner with retry button.
 */

/**
 * @param {{ message: string, onRetry: () => void }} props
 */
export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      id="error-banner"
      role="alert"
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.1rem' }}>⚠</span>
        <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', fontWeight: 500 }}>
          {message}
        </span>
      </div>
      <button
        id="retry-btn"
        onClick={onRetry}
        style={{
          background: '#991b1b',
          border: 'none',
          borderRadius: '6px',
          padding: '0.4rem 0.9rem',
          color: '#fca5a5',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Retry
      </button>
    </div>
  );
}
