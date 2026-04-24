/**
 * emitter.js — Steps 5–7 of the processEdges pipeline.
 *
 * Responsibilities:
 *  - Per-component cycle detection via DFS back-edge tracking (Step 5).
 *  - Emit hierarchy objects for cyclic and non-cyclic components (Step 6).
 *  - Build and emit the summary object (Step 7).
 *  - Sort hierarchies alphabetically by root (Step 8).
 *
 * Tree construction uses an iterative worklist (explicit stack) rather than
 * a recursive call per node. This avoids call-stack overflow on deep chains
 * and makes the traversal order explicit and testable.
 *
 * @module emitter
 */

// ─── DFS & Cycle Detection ────────────────────────────────────────────────────

/**
 * Run iterative DFS from a start node, tracking visited and in-stack sets.
 * Returns { visited: Set<string>, hasCycle: boolean }.
 *
 * We use an explicit stack with a "return frame" marker to properly
 * remove nodes from the recursion stack (equivalent to the post-order
 * callback in recursive DFS).
 *
 * @param {string}                   start
 * @param {Map<string, Set<string>>} adjacency
 * @returns {{ visited: Set<string>, hasCycle: boolean }}
 */
function dfsFromRoot(start, adjacency) {
  const visited = new Set();
  const inStack = new Set();
  let hasCycle = false;

  // Stack entries: { node, isReturn }
  // isReturn=true means we're popping node off the recursion stack.
  const stack = [{ node: start, isReturn: false }];

  while (stack.length > 0) {
    const { node, isReturn } = stack.pop();

    if (isReturn) {
      inStack.delete(node);
      continue;
    }

    if (visited.has(node)) {
      if (inStack.has(node)) hasCycle = true;
      continue;
    }

    visited.add(node);
    inStack.add(node);

    // Push return frame BEFORE children so it's processed after all descendants.
    stack.push({ node, isReturn: true });

    const children = adjacency.get(node);
    if (children) {
      for (const child of children) {
        if (!visited.has(child)) {
          stack.push({ node: child, isReturn: false });
        } else if (inStack.has(child)) {
          hasCycle = true;
        }
      }
    }
  }

  return { visited, hasCycle };
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

/**
 * Build a nested tree object iteratively using a worklist.
 * Returns { root: { child: { grandchild: {} } } }.
 *
 * We maintain a Map<nodeName, nodeSubObject> so each node's children
 * can be attached to the correct sub-object regardless of traversal order.
 *
 * Worklist approach (BFS) is used instead of a recursive one-liner to
 * avoid call-stack limits on deep chains and make traversal order explicit.
 *
 * @param {string}                   root
 * @param {Map<string, Set<string>>} adjacency
 * @returns {Object}
 */
function buildTreeObject(root, adjacency) {
  /** Map from node name → the sub-object that represents that node's children. */
  const nodeToObj = new Map();

  // Root's sub-object is the inner object; we'll wrap it under the root key at the end.
  const rootInner = {};
  nodeToObj.set(root, rootInner);

  // Worklist of node names to process.
  const worklist = [root];

  while (worklist.length > 0) {
    const node = worklist.shift();
    const nodeObj = nodeToObj.get(node);

    const children = adjacency.get(node);
    if (children) {
      for (const child of children) {
        const childInner = {};
        nodeObj[child] = childInner;
        nodeToObj.set(child, childInner);
        worklist.push(child);
      }
    }
  }

  // Wrap the entire structure under the root key.
  return { [root]: rootInner };
}

/**
 * Compute the maximum depth (longest root-to-leaf path, root counts as 1)
 * iteratively using a stack of [node, currentDepth] pairs.
 *
 * @param {string}                   root
 * @param {Map<string, Set<string>>} adjacency
 * @returns {number}
 */
function computeDepth(root, adjacency) {
  let maxDepth = 0;
  // Stack entries: [node, depthAtNode]
  const stack = [[root, 1]];

  while (stack.length > 0) {
    const [node, depth] = stack.pop();
    const children = adjacency.get(node);

    if (!children || children.size === 0) {
      if (depth > maxDepth) maxDepth = depth;
    } else {
      for (const child of children) {
        stack.push([child, depth + 1]);
      }
    }
  }

  return maxDepth;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} HierarchyEntry
 * @property {string}  root
 * @property {Object}  tree
 * @property {boolean} [has_cycle]  - Present only on cyclic entries.
 * @property {number}  [depth]      - Present only on non-cyclic entries.
 */

/**
 * @typedef {Object} Summary
 * @property {number}       total_trees
 * @property {number}       total_cycles
 * @property {string|null}  largest_tree_root
 */

/**
 * Emit all hierarchy objects and the summary from processed graph data.
 *
 * @param {Map<string,string[]>}   components   - UF representative → node list.
 * @param {Map<string,Set<string>>} adjacency   - Filtered adjacency map.
 * @param {Map<string,string>}     parentByChild
 * @returns {{ hierarchies: HierarchyEntry[], summary: Summary }}
 */
export function emitHierarchies(components, adjacency, parentByChild) {
  /** @type {HierarchyEntry[]} */
  const hierarchies = [];

  for (const [, nodes] of components) {
    const nodeSet = new Set(nodes);

    // ── Step 5: Classify component ────────────────────────────────────────
    // Candidate roots = nodes that never appear as a child IN THIS component.
    const candidateRoots = nodes
      .filter((n) => !parentByChild.has(n) || !nodeSet.has(parentByChild.get(n)))
      .sort(); // sort for determinism in mixed-cycle root selection

    // Separate treatment: if no candidate roots, it's a pure cycle.
    if (candidateRoots.length === 0) {
      // Pure cycle: root = lex-smallest node in component.
      const root = [...nodes].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    // Run DFS from each candidate root; collect all reachable nodes.
    let globalHasCycle = false;
    const allReachable = new Set();

    for (const root of candidateRoots) {
      const { visited, hasCycle } = dfsFromRoot(root, adjacency);
      if (hasCycle) globalHasCycle = true;
      for (const v of visited) allReachable.add(v);
    }

    // If DFS cannot reach ALL component nodes, the component has a cycle
    // (the unreachable nodes form a cycle among themselves).
    if (allReachable.size < nodeSet.size) {
      globalHasCycle = true;
    }

    // ── Step 6: Emit hierarchy ────────────────────────────────────────────
    if (globalHasCycle) {
      // Mixed cycle: root = lex-smallest among candidate roots (parent-less nodes).
      const root = candidateRoots[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      // Non-cyclic: exactly one root by definition.
      const root = candidateRoots[0];
      const tree = buildTreeObject(root, adjacency);
      const depth = computeDepth(root, adjacency);
      hierarchies.push({ root, tree, depth });
    }
  }

  // ── Step 8: Sort hierarchies by root alphabetically ───────────────────────
  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  // ── Step 7: Summary ───────────────────────────────────────────────────────
  const trees = hierarchies.filter((h) => !h.has_cycle);
  const cycles = hierarchies.filter((h) => h.has_cycle);

  let largestTreeRoot = null;
  if (trees.length > 0) {
    // Tiebreak: largest depth, then lex-smallest root.
    const deepest = trees.reduce((best, curr) => {
      if (curr.depth > best.depth) return curr;
      if (curr.depth === best.depth && curr.root < best.root) return curr;
      return best;
    });
    largestTreeRoot = deepest.root;
  }

  /** @type {Summary} */
  const summary = {
    total_trees: trees.length,
    total_cycles: cycles.length,
    largest_tree_root: largestTreeRoot,
  };

  return { hierarchies, summary };
}
