/**
 * App.jsx — Root application component.
 *
 * Wires EdgeInput → useBfhl hook → ResultsPanel.
 * Handles copy-to-clipboard for raw JSON.
 */

import { useState, useCallback, useEffect } from 'react';
import { API_BASE } from './lib/api';
import { EdgeInput } from './components/EdgeInput';
import { ResultsPanel } from './components/ResultsPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { useBfhl } from './hooks/useBfhl';

export default function App() {
  const { status, result, error, submit, reset } = useBfhl();
  const [copied, setCopied] = useState(false);
  const [lastEdges, setLastEdges] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => {
        if (res.ok) setApiStatus('live');
        else setApiStatus('error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  const handleSubmit = useCallback(
    (edges) => {
      setLastEdges(edges);
      submit(edges);
    },
    [submit],
  );

  const handleRetry = useCallback(() => {
    reset();
    if (lastEdges.length > 0) submit(lastEdges);
  }, [lastEdges, reset, submit]);

  const handleCopyJson = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(10,13,20,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, var(--color-accent), #7c3aed)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            ⬡
          </div>
          <div>
            <h1 className="animated-gradient-text" style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}>
              BFHL Graph Explorer
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Directed Edge Hierarchy Analyser
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '0.35rem 0.75rem',
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: apiStatus === 'live' ? 'var(--color-success)' : (apiStatus === 'error' ? 'var(--color-error)' : 'var(--color-cycle)'),
            display: 'inline-block',
            boxShadow: apiStatus === 'live' ? '0 0 8px var(--color-success)' : 'none',
          }} />
          API: {apiStatus}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>
        {/* Input section */}
        <section>
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>
              Edge Input
            </h2>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.8rem',
              color: 'var(--color-text-dim)',
            }}>
              Format: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>A-&gt;B</code>
              {' '}— one uppercase letter on each side. Accepts comma, newline, or JSON array.
            </p>
          </div>
          <EdgeInput onSubmit={handleSubmit} isLoading={status === 'loading'} />
        </section>

        {/* Error state */}
        {status === 'error' && error && (
          <ErrorBanner message={error} onRetry={handleRetry} />
        )}

        {/* Loading state skeleton */}
        {status === 'loading' && (
          <section>
            <h2 style={{
              margin: '0 0 1rem',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>
              Analysing...
            </h2>
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="glow-card" style={{ padding: '1rem', height: '94px' }}>
                    <div className="skeleton-box" style={{ height: '32px', width: '40%', margin: '0 auto 8px' }} />
                    <div className="skeleton-box" style={{ height: '12px', width: '60%', margin: '0 auto' }} />
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                  <div className="skeleton-box" style={{ height: '32px', width: '90px' }} />
                  <div className="skeleton-box" style={{ height: '32px', width: '70px' }} />
                  <div className="skeleton-box" style={{ height: '32px', width: '90px' }} />
                </div>
                <div className="glow-card" style={{ padding: '1rem 1.25rem', height: '160px' }}>
                  <div className="skeleton-box" style={{ height: '20px', width: '30%', marginBottom: '1.25rem' }} />
                  <div className="skeleton-box" style={{ height: '16px', width: '20%', marginLeft: '1.5rem', marginBottom: '0.75rem' }} />
                  <div className="skeleton-box" style={{ height: '16px', width: '40%', marginLeft: '1.5rem' }} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {status === 'success' && result && (
          <section>
            <h2 style={{
              margin: '0 0 1rem',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>
              Analysis Results
            </h2>
            <ResultsPanel
              result={result}
              onCopyJson={handleCopyJson}
              copied={copied}
            />
          </section>
        )}

        {/* Idle state hint */}
        {status === 'idle' && (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: 'var(--color-text-dim)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>⬡</div>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Enter directed edges above to analyse graph hierarchies.
            </p>
            <div className="fade-up" style={{
              marginTop: '2.5rem',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              border: '1px dashed var(--color-border)',
              padding: '1.5rem 2.5rem',
              borderRadius: '12px',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-9px', left: '20px', background: 'var(--color-bg)', padding: '0 8px', fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>Example</div>
              <div className="tree-node-label" style={{ padding: '0.2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                A
              </div>
              <div className="tree-node">
                <div className="tree-node-label" style={{ padding: '0.2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  B
                </div>
                <div className="tree-node">
                  <div className="tree-node-label" style={{ padding: '0.2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    C
                  </div>
                </div>
              </div>
              <div className="tree-node">
                <div className="tree-node-label" style={{ padding: '0.2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  D
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
