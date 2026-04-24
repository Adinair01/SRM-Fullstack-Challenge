/**
 * EdgeInput.jsx — Smart edge input textarea.
 *
 * Accepts comma-separated, newline-separated, or JSON array input.
 * Parses the raw text into a clean string[] before submitting.
 */

import { useState } from 'react';

/**
 * Parse raw text into an array of edge strings.
 * Supports:
 *  - JSON array: `["A->B","C->D"]`
 *  - Comma-separated: `A->B, C->D`
 *  - Newline-separated: one edge per line
 *  - Mix of both
 *
 * @param {string} raw
 * @returns {string[]}
 */
function parseInput(raw) {
  const trimmed = raw.trim();

  // Try JSON array first.
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // Fall through to text parsing.
    }
  }

  // Split on newlines then commas, flatten, filter empties.
  return trimmed
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {{ onSubmit: (edges: string[]) => void, isLoading: boolean }} props
 */
export function EdgeInput({ onSubmit, isLoading }) {
  const [raw, setRaw] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const edges = parseInput(raw);
    onSubmit(edges);
  }

  const placeholder = `Enter edges — any format works:

A->B, B->C, C->D
X->Y
Y->Z

or JSON: ["A->B","B->C"]`;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glow-card p-1 rounded-xl">
        <textarea
          id="edge-input"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={placeholder}
          rows={8}
          spellCheck={false}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            width: '100%',
            color: 'var(--color-text)',
            padding: '0.75rem 1rem',
            lineHeight: '1.7',
          }}
        />
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          id="submit-btn"
          disabled={isLoading || !raw.trim()}
          style={{
            background: isLoading || !raw.trim()
              ? 'var(--color-border-bright)'
              : 'var(--color-accent)',
            color: isLoading || !raw.trim()
              ? 'var(--color-text-dim)'
              : '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.5rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: isLoading || !raw.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s, transform 0.1s',
          }}
        >
          {isLoading && <span className="spinner" />}
          {isLoading ? 'Processing…' : 'Analyse Edges'}
        </button>

        {raw && (
          <button
            type="button"
            id="clear-btn"
            onClick={() => setRaw('')}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}

        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginLeft: 'auto' }}>
          {parseInput(raw).length > 0 && `${parseInput(raw).length} edges detected`}
        </span>
      </div>
    </form>
  );
}
