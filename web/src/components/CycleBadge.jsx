/**
 * CycleBadge.jsx — Visual indicator for cyclic hierarchies.
 */

export function CycleBadge() {
  return (
    <span className="badge badge-cycle">
      ↺ cycle
    </span>
  );
}

export function TreeBadge() {
  return (
    <span className="badge badge-tree">
      ✓ tree
    </span>
  );
}
