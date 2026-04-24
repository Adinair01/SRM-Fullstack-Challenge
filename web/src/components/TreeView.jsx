/**
 * TreeView.jsx — Recursive, collapsible tree renderer.
 *
 * Renders a nested object as an indented list with caret toggles.
 * Connector lines are drawn via CSS pseudo-elements (no SVG library).
 * Node labels use monospace font for visual clarity.
 */

import { useState } from 'react';

/**
 * Recursive node renderer.
 * @param {{ label: string, subtree: Object, depth: number }} props
 */
function TreeNode({ label, subtree, depth }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = subtree && Object.keys(subtree).length > 0;

  return (
    <div className={depth > 0 ? 'tree-node' : ''}>
      <div
        className="tree-node-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.2rem 0',
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={() => hasChildren && setCollapsed((c) => !c)}
      >
        {hasChildren && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              transition: 'transform 0.15s',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              display: 'inline-block',
              minWidth: '0.75rem',
            }}
          >
            ▾
          </span>
        )}
        {!hasChildren && (
          <span style={{ minWidth: '0.75rem', display: 'inline-block' }} />
        )}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            fontWeight: depth === 0 ? 700 : 400,
            color: depth === 0 ? 'var(--color-accent)' : 'var(--color-text)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
        {depth === 0 && !hasChildren && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginLeft: '0.25rem' }}>
            (leaf root)
          </span>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div>
          {Object.entries(subtree).map(([childLabel, childSubtree]) => (
            <TreeNode
              key={childLabel}
              label={childLabel}
              subtree={childSubtree}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Top-level tree view for a non-cyclic hierarchy.
 * @param {{ hierarchy: Object }} props
 */
export function TreeView({ hierarchy }) {
  const { root, tree, depth } = hierarchy;

  // tree is { "A": { "B": { ... } } } — get the inner subtree.
  const rootSubtree = tree[root] ?? {};

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          Depth: <strong style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{depth}</strong>
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          Root: <strong style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{root}</strong>
        </span>
      </div>

      <TreeNode label={root} subtree={rootSubtree} depth={0} />
    </div>
  );
}
