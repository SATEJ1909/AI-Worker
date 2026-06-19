# Graph Report - web  (2026-06-19)

## Corpus Check
- 9 files · ~28,649 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 34 nodes · 25 edges · 9 communities (5 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06d87ead`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `Getting Started` - 2 edges
2. `eslintConfig` - 1 edges
3. `nextConfig` - 1 edges
4. `config` - 1 edges
5. `sora` - 1 edges
6. `inter` - 1 edges
7. `jetbrainsMono` - 1 edges
8. `metadata` - 1 edges
9. `ORBIT_APPS` - 1 edges
10. `FEATURES` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (9 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (9): AVATARS, FEATURES, INITIAL_LOGS, integrationIcons, INTEGRATIONS, LOG_POOL, ORBIT_APPS, PRICING (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.33
Nodes (4): inter, jetbrainsMono, metadata, sora

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **20 isolated node(s):** `eslintConfig`, `nextConfig`, `config`, `sora`, `inter` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `eslintConfig`, `nextConfig`, `config` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._