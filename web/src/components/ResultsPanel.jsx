/**
 * ResultsPanel.jsx — Tabbed results display.
 *
 * Tabs: Hierarchies | Invalid | Duplicates | Summary
 * Summary cards are always pinned at the top.
 */

import { useState, useEffect } from 'react';
import { TreeView } from './TreeView';
import { CycleBadge, TreeBadge } from './CycleBadge';

const TABS = ['Hierarchies', 'Invalid', 'Duplicates', 'Raw JSON'];

/**
 * @param {{ result: Object, onCopyJson: () => void, copied: boolean }} props
 */
export function ResultsPanel({ result, onCopyJson, copied }) {
  const [activeTab, setActiveTab] = useState('Hierarchies');

  const { hierarchies, invalid_entries, duplicate_edges, summary } = result;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <SummaryCard
          label="Total Trees"
          value={summary.total_trees}
          color="var(--color-success)"
        />
        <SummaryCard
          label="Total Cycles"
          value={summary.total_cycles}
          color="var(--color-cycle)"
        />
        <SummaryCard
          label="Deepest Root"
          value={summary.largest_tree_root ?? '—'}
          color="var(--color-accent)"
          mono
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1rem',
          gap: '0.25rem',
        }}>
          {TABS.map((tab) => {
            const badge =
              tab === 'Invalid' ? invalid_entries.length
              : tab === 'Duplicates' ? duplicate_edges.length
              : tab === 'Hierarchies' ? hierarchies.length
              : null;

            return (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase().replace(' ', '-')}`}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'tab-active' : ''}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.6rem 0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.85rem',
                  color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'color 0.15s',
                  position: 'relative',
                }}
              >
                {tab}
                {badge !== null && (
                  <span style={{
                    background: 'var(--color-border-bright)',
                    borderRadius: '10px',
                    padding: '0.05rem 0.4rem',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: badge > 0 ? 'var(--color-text)' : 'var(--color-text-dim)',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            id="copy-json-btn"
            onClick={onCopyJson}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'color 0.2s',
              alignSelf: 'center',
            }}
          >
            {copied ? '✓ Copied' : '⎘ Copy JSON'}
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────────── */}
        {activeTab === 'Hierarchies' && (
          <HierarchiesTab hierarchies={hierarchies} />
        )}
        {activeTab === 'Invalid' && (
          <ListTab items={invalid_entries} emptyMsg="No invalid entries." />
        )}
        {activeTab === 'Duplicates' && (
          <ListTab items={duplicate_edges} emptyMsg="No duplicate edges." />
        )}
        {activeTab === 'Raw JSON' && (
          <RawJsonTab result={result} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, mono }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const easeProgress = progress * (2 - progress);
      setDisplayValue(Math.floor(easeProgress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="glow-card" style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{
        fontSize: mono ? '1.6rem' : '2rem',
        fontWeight: 700,
        color,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        lineHeight: 1.2,
      }}>
        {displayValue}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
    </div>
  );
}

function HierarchiesTab({ hierarchies }) {
  if (hierarchies.length === 0) {
    return <EmptyState message="No hierarchies produced." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {hierarchies.map((h) => (
        <div
          key={h.root}
          className="glow-card"
          style={{
            padding: '1rem 1.25rem',
            borderColor: h.has_cycle ? 'var(--color-cycle-dim)' : undefined,
            boxShadow: h.has_cycle ? '0 0 0 1px var(--color-cycle-glow)' : undefined,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{ position: 'relative' }}>
              {h.has_cycle && <span className="node-dot cyclic-dot" />}
              <span className={h.has_cycle ? "node-cyclic" : ""} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: h.has_cycle ? 'var(--color-cycle)' : 'var(--color-accent)',
                marginLeft: h.has_cycle ? '0.75rem' : '0',
              }}>
                {h.root}
              </span>
            </div>
            {h.has_cycle ? <CycleBadge /> : <TreeBadge />}
          </div>

          {h.has_cycle ? (
            <div style={{
              padding: '0.75rem',
              background: 'var(--color-cycle-glow)',
              borderRadius: '6px',
              color: 'var(--color-cycle)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
            }}>
              ↺ Cyclic component — no tree structure can be built.
            </div>
          ) : (
            <TreeView hierarchy={h} />
          )}
        </div>
      ))}
    </div>
  );
}

function ListTab({ items, emptyMsg }) {
  if (items.length === 0) {
    return <EmptyState message={emptyMsg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {items.map((item, i) => (
        <div
          key={`${item}-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-surface-raised)',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ color: 'var(--color-text-dim)', minWidth: '1.5rem', textAlign: 'right' }}>
            {i + 1}.
          </span>
          <span style={{ color: 'var(--color-text)' }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function syntaxHighlight(jsonObj) {
  if (!jsonObj) return '';
  let json = JSON.stringify(jsonObj, null, 2);
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function RawJsonTab({ result }) {
  return (
    <pre style={{
      background: 'var(--color-surface-raised)',
      borderRadius: '8px',
      padding: '1rem',
      overflow: 'auto',
      fontSize: '0.78rem',
      fontFamily: 'var(--font-mono)',
      color: 'var(--color-text)',
      lineHeight: 1.6,
      maxHeight: '400px',
    }} dangerouslySetInnerHTML={{ __html: syntaxHighlight(result) }} />
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2.5rem',
      color: 'var(--color-text-dim)',
      fontSize: '0.875rem',
    }}>
      {message}
    </div>
  );
}
