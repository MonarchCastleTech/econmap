# MapFactbook (econmap)

## What This Is

MapFactbook is a premium, dark-by-default **economic-intelligence web app** built around an interactive globe and a worldwide **city/country OSINT atlas**. It is a statically-exported Next.js site (App Router) deployed to GitHub Pages, presenting source-backed economic indicators, rankings, comparisons, forecasts, and a ~189k-city data system to analyst-minded users.

## Core Value

The interactive map + **trustworthy, source-attributed economic/city intelligence** that an analyst can navigate quickly. If everything else fails, the map must load and let a user find a place and read credible facts about it.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Static-export Next.js shell with home/command-center, country/city/compare/rankings/indicators/datasets/regions/corridors/reports/story-mode routes — pre-existing
- ✓ Source-backed data pipeline + audit harness (provenance, geospatial sanity, size budget) — pre-existing
- ✓ App renders on a fresh clone without generated data (graceful degradation) — Phase 0
- ✓ One-command bootstrap for required bulk sources (`download-bulk-sources.mjs`) — Phase 0
- ✓ **REQ-01/02** Search-first, sectioned left menu with honest coverage-pending states — v1.0 Phase 1
- ✓ **REQ-03/04** Static export + client/map runtime optimized (dead-dep removal, top-N pre-render, code-splitting) — v1.0 Phase 2
- ✓ **REQ-05/06** Minor cities degrade gracefully; raw coverage expanded via scoped pipeline (191,845 / 7,310) — v1.0 Phase 3
- ✓ **TILE-01/02** Globe layers served from a 1.2 MB range-addressable PMTiles archive (replaces 272 MB geojson tree) — v1.1 Phase 4
- ✓ **COVER-01/02/03** Enrichment expanded to 9,235 cities / 119,020 entities with explicit gaps — v1.1 Phase 5

## Current Milestone: v1.3 - Global city completeness and OSINT honesty

**Goal:** Represent every registry city, distinguish cities from subordinate places and regions, process
the full registry resumably, and expose source-backed OSINT observations with honest coverage states.

**Target features:**
- City/subordinate-place/region ontology and canonical identity crosswalk.
- Deterministic full-registry processing with checkpoints and a coverage report.
- Source-availability contracts plus place-of-worship and priority civic/infrastructure observations.
- A city profile and grouped search experience that expose provenance and explicit gaps.
- Regression fixtures and release audit for requested cities and counterexamples.

### Completed (v1.3)

- Phase 6: city ontology and identity.
- Phase 7: full-registry processing and coverage report.
- Phase 8: OSINT source catalog and observations.
- Phase 9: city profile and search experience.
- Phase 10: global verification and data audit.
- Final release: 192,445 populated-place source records, 95,915 searchable canonical cities,
  42,873 source-observed dossiers, and 53,042 registry-only baseline dossiers.

### Out of Scope

- News feeds / headlines / current-events widgets — explicitly excluded by product vision (`citydata.md`)
- Fabricated / inferred / interpolated city facts — data policy is high-confidence-only; unknowns stay explicit (`null`/`not_covered_yet`)
- Server-rendered runtime / dynamic backend — the app is a static export; no request-time data
- Brotli dossier shards — browser `DecompressionStream` has no `'br'` decoder; shards already ship gzip (v1.1)

## Context

- **Stack**: Next.js (App Router, `output: "export"`) + TypeScript, Tailwind + shadcn/ui, Zustand, TanStack Query, MapLibre GL JS + PMTiles, Recharts, Framer Motion, Prisma + SQLite (scaffold only), Zod.
- **Data**: Generated data (`src/data/generated/`, `public/data/`) is produced by `scripts/data/cities/*` and `scripts/data/globe/*` from external bulk sources. Latest audit (2026-07-28): 95,915 canonical cities, 42,873 source-observed dossiers, 53,042 registry-only baselines, and zero unsourced entities.
- **The left menu** lives in `src/features/home/components/layout/tactical-sidebar.tsx`.
- **User feedback themes** (this engagement): "left menu is not even close to useful", "website is not optimized", "lots of missing data for minor cities".

## Constraints

- **Performance**: Static export must fit GitHub Pages limits (soft ~1 GB / file-count pressure) — currently 629.8 MB / 119,115 files.
- **Dependencies**: Full data regen needs external bulk datasets (GeoNames, OurAirports, UN/LOCODE required; Natural Earth/WHO/GLEIF/GHSL/OECD/Eurostat/Ookla optional) + Python enrichment. Required set is now downloaded locally.
- **Tech stack**: Must remain a static export (no runtime server); navigation/state sync is URL-based (`?city,?layers,?base,?date,?view,?q`).
- **Data integrity**: No fabrication. Every datum source-backed; gaps explicit.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Make data loaders degrade gracefully on missing artifacts | Fresh clone 500'd on absent generated data; needed to render for UI work | ✓ Good |
| Add `download-bulk-sources.mjs` bootstrap (PowerShell unzip on Win) | Pipeline only *asserted* bulk sources existed; no acquisition path | ✓ Good |
| Sequence work menu → perf → data | User's stated priority | ✓ Good |
| Pursue full pipeline for real data (background) | User chose full pipeline over sample | ✓ Good |
| Pack globe layers as PMTiles via tippecanoe/Docker | Globe geojson was the largest data category (272 MB) | ✓ Good — 272 MB → 1.2 MB |
| Drop Brotli dossier shards | Browser can't decode `br`; gzip already shipped | ✓ Good |

---
*Last updated: 2026-07-28 after completing v1.3 global city completeness and OSINT honesty.*
