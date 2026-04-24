/**
 * graph.js — Steps 2–4 of the processEdges pipeline.
 *
 * Responsibilities:
 *  - Deduplicate edges (Step 2).
 *  - Build adjacency map + reverse parentByChild map (Step 3),
 *    silently dropping diamond edges (child already has a recorded parent).
 *  - Union-Find for connected-component grouping (Step 4).
 *
 * Why Union-Find instead of repeated BFS?
 *   BFS-per-node is O(V*(V+E)) in the worst case when scanning components.
 *   Union-Find with path compression + union-by-rank gives near-O(V+E) amortized,
 *   which is critical when evaluator inputs can have 50 nodes and dense edges.
 *
 * @module graph
 */

// ─── Union-Find ───────────────────────────────────────────────────────────────

/**
 * Path-compressed, rank-unified Disjoint Set structure.
 * Nodes are arbitrary strings; lazily initialised on first touch.
 */
class UnionFind {
  constructor() {
    /** @type {Map<string, string>} */
    this._parent = new Map();
    /** @type {Map<string, number>} */
    this._rank = new Map();
  }

  /**
   * Lazily register a node if not yet seen.
   * @param {string} node
   */
  _ensure(node) {
    if (!this._parent.has(node)) {
      this._parent.set(node, node);
      this._rank.set(node, 0);
    }
  }

  /**
   * Find representative of node's component with path compression.
   * @param {string} node
   * @returns {string}
   */
  find(node) {
    this._ensure(node);
    if (this._parent.get(node) !== node) {
      this._parent.set(node, this.find(this._parent.get(node)));
    }
    return this._parent.get(node);
  }

  /**
   * Merge the components containing a and b (union by rank).
   * @param {string} a
   * @param {string} b
   */
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;

    if (this._rank.get(ra) < this._rank.get(rb)) {
      this._parent.set(ra, rb);
    } else if (this._rank.get(ra) > this._rank.get(rb)) {
      this._parent.set(rb, ra);
    } else {
      this._parent.set(rb, ra);
      this._rank.set(ra, this._rank.get(ra) + 1);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GraphResult
 * @property {string[]}              duplicateEdges   - Edges seen more than once (deduped list, input order of first dup).
 * @property {Map<string,Set<string>>} adjacency      - parent → Set<children> (diamond-filtered).
 * @property {Map<string,string>}    parentByChild    - child → firstParent (diamond-filtered).
 * @property {Set<string>}           allNodes         - Every node seen after diamond filtering.
 * @property {Map<string,string[]>}  components       - representative → [nodes in component].
 */

/**
 * Process a validated edge list through deduplication, graph construction,
 * and connected-component grouping.
 *
 * @param {string[]} validEdges - Already-validated, trimmed edge strings.
 * @returns {GraphResult}
 */
export function buildGraph(validEdges) {
  // ── Step 2: Deduplication ──────────────────────────────────────────────────
  /** Edges seen at least once; first-occurrence order. */
  const seenEdgeSet = new Set();
  /** Edges that appeared more than once (deduped list). */
  const duplicateSet = new Set();
  const duplicateEdges = [];

  /** Edges that survive deduplication and feed into graph construction. */
  const dedupedEdges = [];

  for (const edge of validEdges) {
    if (seenEdgeSet.has(edge)) {
      // Only push to duplicateEdges on the FIRST extra occurrence.
      if (!duplicateSet.has(edge)) {
        duplicateSet.add(edge);
        duplicateEdges.push(edge);
      }
    } else {
      seenEdgeSet.add(edge);
      dedupedEdges.push(edge);
    }
  }

  // ── Step 3: Graph Construction ─────────────────────────────────────────────
  /** @type {Map<string, Set<string>>} */
  const adjacency = new Map();
  /** @type {Map<string, string>} */
  const parentByChild = new Map();
  /** @type {Set<string>} */
  const allNodes = new Set();

  /** Edges that survive diamond filtering (used for Union-Find below). */
  const activeEdges = [];

  for (const edge of dedupedEdges) {
    const src = edge[0];
    const dst = edge[3];

    // Diamond rule: silently drop if child already has a recorded parent.
    if (parentByChild.has(dst)) {
      continue;
    }

    parentByChild.set(dst, src);
    allNodes.add(src);
    allNodes.add(dst);

    if (!adjacency.has(src)) adjacency.set(src, new Set());
    adjacency.get(src).add(dst);

    activeEdges.push(edge);
  }

  // ── Step 4: Union-Find Component Grouping ─────────────────────────────────
  const uf = new UnionFind();

  // Ensure every known node exists in UF, even isolated ones.
  for (const node of allNodes) uf.find(node);

  for (const edge of activeEdges) {
    uf.union(edge[0], edge[3]);
  }

  /** @type {Map<string, string[]>} */
  const components = new Map();
  for (const node of allNodes) {
    const rep = uf.find(node);
    if (!components.has(rep)) components.set(rep, []);
    components.get(rep).push(node);
  }

  return { duplicateEdges, adjacency, parentByChild, allNodes, components };
}
