# BFHL Graph Explorer

**Directed edge hierarchy analyser - SRM Full Stack Engineering Challenge**

A full-stack submission built with Node.js, Express, React, and Vite. Feed it edge strings like `A->B`, get back structured tree hierarchies, cycle detection, depth analysis, and a clean visual breakdown.

---

## Live Links

| | URL |
|---|---|
| 🌐 Frontend | [srm-bfhl-app.vercel.app](https://srm-bfhl-app.vercel.app) |
| ⚙️ API | [srm-bfhl-api-2zfv.onrender.com](https://srm-bfhl-api-2zfv.onrender.com) |
| 📁 Repo | [github.com/Adinair01/SRM-Fullstack-Challenge](https://github.com/Adinair01/SRM-Fullstack-Challenge) |

---

## What it does

You send an array of edge strings. It validates them, builds the graph, groups components, detects cycles, and hands back structured hierarchies with depth metrics.

```
Input:  ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "1->2"]

Output: 2 trees  |  1 cycle  |  2 invalid entries  |  Deepest root: A
```

The frontend lets you type or paste edges in any format — comma-separated, newline, or raw JSON array — and renders the results as an interactive collapsible tree.

---

## Project Structure

```
SRM-Fullstack-Challenge/
├── api/                          Node.js + Express REST API
│   ├── src/
│   │   ├── config/identity.js    User credentials (single source of truth)
│   │   ├── core/
│   │   │   ├── processor.js      Orchestrator — pure function, zero Express coupling
│   │   │   ├── validator.js      Trim, regex match, self-loop rejection
│   │   │   ├── graph.js          Dedup, adjacency map, Union-Find grouping
│   │   │   └── emitter.js        DFS cycle detection, tree build, summary
│   │   ├── routes/bfhl.js        Thin HTTP handler
│   │   └── middleware/           Error handling + Pino structured logging
│   └── tests/                    23 unit + integration tests (Vitest + Supertest)
│
└── web/                          Vite + React 18 + TailwindCSS
    └── src/
        ├── components/           EdgeInput, ResultsPanel, TreeView, ErrorBanner
        ├── hooks/useBfhl.js      State machine: idle → loading → success | error
        └── lib/api.js            Fetch wrapper with timeout + error normalisation
```

---

## API Reference

**POST /bfhl**

```json
// Request
{ "data": ["A->B", "B->C", "X->Y", "Y->Z", "Z->X"] }

// Response
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

Returns **HTTP 200** for all valid requests, including ones with invalid or empty data arrays.
Returns **HTTP 400** only if `data` is missing, not an array, or the body is malformed JSON.

**GET /health**
```json
{ "status": "ok", "uptime": 42.3 }
```

---

## Local Setup

**Requirements:** Node.js ≥ 18

```bash
# Clone
git clone https://github.com/Adinair01/SRM-Fullstack-Challenge.git
cd SRM-Fullstack-Challenge

# Run API
cd api && npm install && npm run dev
# Starts on http://localhost:3001

# Run Frontend (new terminal)
cd web && npm install && npm run dev
# Starts on http://localhost:5173
```

**Run tests:**
```bash
cd api && npm test
# 23 tests across 2 suites — all pass
```

---

## Engineering Decisions

**Why Union-Find instead of BFS for component grouping?**
Repeated BFS per node is O(V × (V+E)) on dense graphs. Union-Find with path compression runs in near-linear amortised time — the right call when the spec mentions 50-node inputs.

**Why iterative DFS instead of recursive?**
Recursive DFS blows the JS call stack on deep chains. An explicit stack with return-frame markers handles arbitrarily deep paths and makes in-stack tracking visible in code, not implicit in the call frames.

**Why is `processEdges()` decoupled from Express?**
The core function takes `string[]` and returns a plain object. No `req`, no `res`, no framework coupling. Swapping Express for Lambda or gRPC touches exactly one file — the route handler.

**Why iterative tree construction over the common recursive one-liner?**
The BFS worklist approach is overflow-safe, O(V+E), and produces deterministic output order. Recursive one-liners found on forums don't handle the diamond-case (multi-parent node) gracefully — this one does, at the graph-build stage before the emitter ever runs.

---

## Validation Rules

| Input | Verdict | Reason |
|---|---|---|
| `A->B` | ✅ Valid | Correct format |
| `A->A` | ❌ Invalid | Self-loop |
| `AB->C` | ❌ Invalid | Multi-character node |
| `A-B` | ❌ Invalid | Wrong separator |
| `1->2` | ❌ Invalid | Not uppercase letters |
| `A->` | ❌ Invalid | Missing child |
| ` A->B ` | ✅ Valid | Whitespace trimmed first |
| `""` | ❌ Invalid | Empty string |

---

## Deployment

**API** hosted on Render (free tier, Node web service, root directory `api`).
**Frontend** hosted on Vercel (root directory `web`, env var `VITE_API_BASE_URL` set to Render URL).

> **Note on cold starts:** Render's free tier spins down after inactivity. First request after idle may take 15–30 seconds. Hit `/health` to warm it up before running the evaluator.

---

## Known Limitations

- No result persistence — refresh clears the UI state.
- Tree view is not virtualised. Graphs above ~200 nodes may slow down browser rendering.
- Free tier Render instance has 0.1 CPU — fine for the spec's 50-node ceiling, not for sustained load.
