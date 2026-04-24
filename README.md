# BFHL Graph Explorer — Monorepo

A production-grade full-stack submission for the SRM BFHL Engineering Challenge.
Processes directed edge strings into graph hierarchies, detects cycles, and serves results via a REST API consumed by a React SPA.

---

## Architecture

```
bfhl-challenge/
├── api/                    ← Node.js + Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── identity.js         ← Single source of truth for user identity
│   │   ├── core/
│   │   │   ├── processor.js        ← Pure orchestrator (no Express coupling)
│   │   │   ├── validator.js        ← Step 1: trim, regex, self-loop rejection
│   │   │   ├── graph.js            ← Steps 2-4: dedup, adjacency, Union-Find
│   │   │   └── emitter.js          ← Steps 5-7: DFS cycle detect, tree build, summary
│   │   ├── routes/
│   │   │   └── bfhl.js             ← Thin Express handler
│   │   ├── middleware/
│   │   │   ├── errorHandler.js     ← Central error middleware
│   │   │   └── requestLogger.js    ← Pino structured logging
│   │   └── app.js                  ← Express factory (no app.listen here)
│   ├── tests/
│   │   ├── processor.spec.js       ← Pure unit tests (vitest)
│   │   └── integration.spec.js     ← HTTP tests (supertest)
│   ├── server.js                   ← Entry: calls app.listen
│   ├── render.yaml                 ← Render IaC config
│   └── package.json
│
└── web/                    ← Vite + React 18 + TailwindCSS SPA
    ├── src/
    │   ├── components/
    │   │   ├── EdgeInput.jsx        ← Smart textarea (CSV/newline/JSON)
    │   │   ├── ResultsPanel.jsx     ← Tabbed results (hierarchies/invalid/dupes/JSON)
    │   │   ├── TreeView.jsx         ← Collapsible recursive tree, CSS connectors
    │   │   ├── CycleBadge.jsx       ← Cycle/tree visual badges
    │   │   └── ErrorBanner.jsx      ← API error display with retry
    │   ├── lib/api.js               ← fetch wrapper with timeout + error normalisation
    │   ├── hooks/useBfhl.js         ← State machine: idle→loading→success|error
    │   ├── App.jsx
    │   └── main.jsx
    ├── vercel.json                  ← SPA rewrite for Vercel
    └── package.json

Request flow:
  Browser → POST /bfhl → routes/bfhl.js → processEdges() → validate → buildGraph → emitHierarchies → JSON response
```

---

## Architectural Decisions

1. **Processor isolation**: `processEdges()` in `processor.js` has zero Express coupling. It takes `string[]` and returns a plain object. This makes it trivially unit-testable without HTTP overhead, and future transport changes (gRPC, Lambda) require zero core rewrites.

2. **Union-Find over BFS for component grouping**: Repeated BFS-per-node is O(V·(V+E)) in the worst case. Union-Find with path compression + union-by-rank runs in near-O(V+E) amortised — the only correct choice when the evaluator may submit dense 50-node graphs.

3. **Iterative DFS for cycle detection**: The spec's cycle detection uses an explicit stack with return-frame markers instead of a call-stack-based recursion. This avoids JS call stack overflow on arbitrarily deep chains and makes the in-stack tracking explicit.

4. **Iterative worklist for tree construction**: Tree building uses a BFS worklist + `Map<node, subObject>` lookup instead of the common recursive one-liner. This is O(V+E), overflow-safe, and produces deterministic output order.

5. **Diamond rule handled in graph.js, not processor**: The `parentByChild` check is embedded inside `buildGraph()` so the emitter always sees a DAG (or cycle) — never a multi-parent node. This separation of concerns prevents the emitter from needing to guard against diamond shapes.

---

## Local Development

### Prerequisites
- Node.js ≥ 18

### API
```bash
cd api
npm install
npm run dev          # starts on :3001 with --watch
```

### Frontend
```bash
cd web
npm install
npm run dev          # starts on :5173
```

### Run Tests
```bash
cd api
npm test             # vitest: 23 tests, 2 suites
```

---

## Deployed URLs

> Update these after deploying.

| Service  | URL |
|----------|-----|
| API (Render) | `https://bfhl-api.onrender.com` |
| Frontend (Vercel) | `https://bfhl-graph-explorer.vercel.app` |
| GitHub Repo | `https://github.com/Adinair01/SRM-Fullstack-Challenge` |

---

## API Contract

**POST /bfhl**

Request:
```json
{ "data": ["A->B", "B->C", "X->Y", "Y->Z", "Z->X"] }
```

Response (HTTP 200):
```json
{
  "user_id": "aditya_nair_101052005",
  "email_id": "an9103@srmist.edu.in",
  "college_roll_number": "RA2311026010257",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "C": {} } } }, "depth": 3 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

HTTP 400 is returned **only** when `data` is missing, not an array, or the request body is malformed JSON.

---

## Known Limitations

- The API is hosted on Render's free tier which may have cold-start latency (10–30s first request). Hit `/health` first to warm up.
- The frontend does not persist results between browser refreshes.
- Tree view does not virtualise very large graphs (>200 nodes may affect render performance in the browser).
