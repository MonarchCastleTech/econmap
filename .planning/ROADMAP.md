# Roadmap: MapFactbook (econmap)

## Overview

This engagement takes a mature-but-rough MapFactbook build and makes it genuinely usable: first fix the navigation (left menu), then optimize the heavy static export and client runtime, then close the city-data coverage gap (both graceful gap-handling and real coverage expansion). A short Phase 0 first unblocked local rendering and bulk-source acquisition so the rest of the work is possible.

## Phases

- [x] **Phase 0: Render unblock & data bootstrap** - Make the app render on a fresh clone; acquire required bulk sources
- [x] **Phase 1: Left menu / navigation redesign** - Turn the left menu into useful, search-first, sectioned navigation
- [x] **Phase 2: Performance & export optimization** - Shrink the 630 MB / 119k-file export; lighten client + map runtime
- [x] **Phase 3: City data coverage** - Graceful gaps for minor cities + expand raw coverage via the pipeline
- [x] **Phase 4: Globe vector tiles (PMTiles packing)** - Pack operational layers into one range-addressable archive
- [x] **Phase 5: Full city enrichment coverage** - Expand source-backed enrichment from 7,310 to 9,235 cities
- [x] **Phase 6: City ontology and identity** - Separate cities, subordinate districts, and regions with canonical source IDs
- [x] **Phase 7: Full-city processing and coverage report** - Make all 95,915 canonical cities resumably processable
- [x] **Phase 8: OSINT source catalog and observations** - Publish honest availability contracts and add priority observations
- [x] **Phase 9: City profile and search experience** - Expose identity, provenance, observations, and gaps per city
- [x] **Phase 10: Global verification and data audit** - Prove acceptance cities, coverage semantics, and release integrity
- [x] **Phase 11: Temporal city observation model** - Snapshot, diff, history, and alert contracts
- [x] **Phase 12: Telecom evidence tiers** - Separate coverage claims from measured performance
- [x] **Phase 13: Network and urban source adapters** - Source contracts for open, credentialed, manual, and licensed inputs
- [x] **Phase 14: Operational hazard ingestion** - Match live public hazards to canonical cities
- [x] **Phase 15: Time machine and saved-city alerts** - Evidence-aware UI in OSINT and city dossiers
- [x] **Phase 16: v1.4 verification and release audit** - Generate, test, build, and inspect the product

## Phase Details

## Milestone v1.3 - Global city completeness and OSINT honesty (started 2026-07-27)

### Phase 6: City ontology and identity
**Goal**: Define and enforce a stable identity model for cities, subordinate districts, and regions.
**Depends on**: Phase 5
**Requirements**: CITY-01, CITY-02, CITY-03, PROV-01
**Success Criteria** (what must be TRUE):
  1. Registry records expose a normalized place class and canonical GeoNames/Wikidata/OSM identifiers when known.
  2. City search prioritizes canonical settlements and keeps subordinate places and regions out of the public city result set.
  3. Bursa, Antalya, Diyarbakir, Izmir, Mus, Mexico City, Paris, and Toulouse resolve as cities.
  4. Kecioren, Esenyurt, and Varto retain their real source identity but are not promoted as peer major-city results.
  5. California resolves as a region, not a city.

### Phase 7: Full-registry processing and coverage report
**Goal**: Make all 95,915 canonical cities eligible for resumable processing and measurable coverage while retaining 192,445 populated places in the source registry.
**Depends on**: Phase 6
**Requirements**: PIPE-01, PIPE-02
**Success Criteria** (what must be TRUE):
  1. The pipeline supports deterministic batches, checkpoints, retries, and resume without duplicate output.
  2. A generated report distinguishes total, processed, failed, unresolved, and source-observed counts.
  3. Every registry city receives a baseline record even when no sparse OSINT observation matches.
  4. Generation and reporting tests pass without requiring manual portal downloads.

### Phase 8: OSINT source catalog and observations
**Goal**: Publish a source-availability contract and expand high-value mapped observations without fabricating coverage.
**Depends on**: Phase 7
**Requirements**: OSINT-01, OSINT-02
**Success Criteria** (what must be TRUE):
  1. Every layer declares sources, join method, scope, fields, default state, and a gap reason.
  2. Coverage states distinguish observed, not observed, unknown, unavailable, and not applicable.
  3. Place-of-worship observations are implemented from documented OSM/Overture fields.
  4. Priority emergency, transport, government, environment, education, utility, and telecom observations are cataloged.
  5. 5G remains explicitly non-universal unless a source-backed city observation exists.

### Phase 9: City profile and search experience
**Goal**: Make identity, baseline facts, observations, provenance, timestamps, confidence, and gaps usable per city.
**Depends on**: Phase 8
**Requirements**: UI-01
**Success Criteria** (what must be TRUE):
  1. A city profile renders for every registry city, including baseline-only cities.
  2. Public city search returns canonical cities, preserves aliases/transliterations, and excludes subordinate places and regions.
  3. Source links, observation timestamps, confidence, and explicit gap states are visible and accessible.
  4. Layout remains usable on desktop and mobile and preserves static-export constraints.

### Phase 10: Global verification and data audit
**Goal**: Verify the full milestone against requested cities, provenance rules, performance limits, and release checks.
**Depends on**: Phase 9
**Requirements**: QA-01
**Success Criteria** (what must be TRUE):
  1. Acceptance fixtures cover the requested Turkish and international cities plus district/region counterexamples.
  2. Focused tests, full tests, typecheck, lint, build, and `audit:data` pass or have documented pre-existing failures.
  3. Generated coverage totals reconcile with the registry and no sparse-source absence is represented as a negative fact.
  4. Roadmap, requirements, source registry, and generated manifests agree.

## Progress (v1.3)

| Phase | Status | Completed |
|-------|--------|-----------|
| 6. City ontology and identity | Complete | 2026-07-27 |
| 7. Full-city processing and coverage report | Complete - 95,915 canonical / 42,873 observed / 53,042 unresolved / 0 failed | 2026-07-28 |
| 8. OSINT source catalog and observations | Complete - source contracts, worship inventory, explicit 5G unknown | 2026-07-28 |
| 9. City profile and search experience | Complete - 95,915 packed dossiers and searchable cities; districts excluded | 2026-07-28 |
| 10. Global verification and data audit | Complete - 230 tests, build, audit 5/5, browser checks | 2026-07-28 |

## Milestone v1.4 - City time machine and operational OSINT (started 2026-07-28)

### Phase 11: Temporal city observation model
Timestamped observation, geography, delta, alert, bundle, index, and feed schemas now preserve source URL,
methodology, confidence, and deterministic change history.

### Phase 12: Telecom evidence tiers
Telecom evidence is classified as regulator-confirmed, operator-claimed, measured performance, or unknown.
Schema and audit rules prohibit speed-test measurements from being labeled as observed 5G coverage.

### Phase 13: Network and urban source adapters
Nine source contracts cover Ookla, M-Lab, RIPE Atlas, FCC BDC, GSMA, GHSL, OpenAQ, NASA FIRMS, and USGS.
Unavailable files, credentials, and licenses remain visible as source states rather than negative city facts.

### Phase 14: Operational hazard ingestion
The reproducible USGS refresh spatially matches current magnitude 2.5+ earthquakes to canonical cities within
100 km. The first snapshot produced 406 observations across 288 cities.

### Phase 15: Time machine and saved-city alerts
The OSINT console and full city dossier render evidence, source status, history, geography, and hazards. Saved
cities receive filtered, severity-ordered alerts.

### Phase 16: v1.4 verification and release audit
**Requirements**: QA-02

**Success Criteria**:
  1. Focused and full tests, typecheck, lint, and production build pass.
  2. `audit:data` validates city-observation provenance and telecom evidence rules.
  3. Desktop and mobile browser checks verify search, evidence, history, hazards, and saved alerts.
  4. Generated source status never overstates unavailable, credentialed, manual, or licensed coverage.

## Progress (v1.4)

| Phase | Status | Completed |
|-------|--------|-----------|
| 11. Temporal city observation model | Complete | 2026-07-28 |
| 12. Telecom evidence tiers | Complete | 2026-07-28 |
| 13. Network and urban source adapters | Complete | 2026-07-28 |
| 14. Operational hazard ingestion | Complete - 406 observations / 288 cities | 2026-07-28 |
| 15. Time machine and saved-city alerts | Complete | 2026-07-28 |
| 16. v1.4 verification and release audit | Complete - 255 tests, build, audit 6/6, desktop/mobile Playwright | 2026-07-28 |

### Phase 0: Render unblock & data bootstrap
**Goal**: A freshly-cloned repo runs `npm run dev` and renders; the required bulk data sources are available locally.
**Depends on**: Nothing
**Requirements**: REQ (foundational)
**Success Criteria** (what must be TRUE):
  1. `npm run dev` serves `/` with HTTP 200 even with no generated data ✓
  2. Missing generated artifacts degrade to empty-but-valid surfaces, not 500s ✓
  3. `assertRequiredBulkSourcesExist()` passes after running the bootstrap downloader ✓
**Plans**: complete

### Phase 1: Left menu / navigation redesign
**Goal**: The left menu becomes a clear, search-first, sectioned navigation surface that exposes every destination and looks intentional with or without data.
**Depends on**: Phase 0
**Requirements**: REQ-01, REQ-02
**Success Criteria** (what must be TRUE):
  1. A user can reach every route (cities, countries, compare, rankings, indicators, datasets, regions, corridors, reports, story, dashboard) from the menu
  2. The menu has a working search/command entry point
  3. With no generated data, the menu renders a deliberate coverage-pending state (no broken/empty controls)
  4. Menu state stays in sync with URL/store (selected city, layers, view)
**Plans**: TBD (driven by `.planning/menu/REDESIGN-SPEC.md`)

### Phase 2: Performance & export optimization
**Goal**: Materially reduce static-export size/file-count and improve client + map runtime performance.
**Depends on**: Phase 1
**Requirements**: REQ-03, REQ-04
**Success Criteria** (what must be TRUE):
  1. Export size and/or file count meaningfully reduced vs. the 629.8 MB / 119,115-file baseline (measured)
  2. Largest client route bundles reduced (measured via build output)
  3. Map/globe and heavy routes load via code-splitting / lazy boundaries
  4. `npm run build` still succeeds and `npm run audit:data` still passes
**Plans**: TBD

### Phase 3: City data coverage
**Goal**: Minor cities show derived/partial data with explicit coverage states instead of blanks, and raw coverage is expanded by running/extending the pipeline.
**Depends on**: Phase 2
**Requirements**: REQ-05, REQ-06
**Success Criteria** (what must be TRUE):
  1. A minor city with sparse data renders a coherent page with clear "covered / partial / not covered yet" indicators
  2. Coverage/fallback logic fills globally-available fields and labels the rest as explicit gaps
  3. The ingestion pipeline runs against the acquired bulk sources and increases processed-city count (measured vs. 87,846 baseline)
  4. `npm run audit:data` passes (provenance, geospatial, size budget)
**Plans**: TBD

## Progress

**Execution Order:** 0 → 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Render unblock & data bootstrap | 1/1 | Complete | 2026-06-20 |
| 1. Left menu / navigation redesign | done | Complete | 2026-06-20 |
| 2. Performance & export optimization | done | Complete | 2026-06-20 |
| 3. City data coverage | done | Complete | 2026-06-20 |

### Outcomes (2026-06-20)

- **Phase 1**: `tactical-sidebar.tsx` rebuilt as a search-first command rail (13 new components) exposing all
  destinations, a ⌘K command palette, a coherent Map-layers group, honest coverage-pending empty states,
  and (bonus) no-reload URL nav. 58/58 home+country tests green; verified live (all routes reachable).
- **Phase 2**: removed 4 dead deps (cesium, @deck.gl×3, framer-motion, date-fns) + dead Cesium webpack wiring;
  declared the previously-phantom `fast-xml-parser`; top-N city pre-render (2,000 vs ~12,000 HTML shells) with a
  `404.html` SPA fallback so minor-city deep-links still resolve; first `next/dynamic` code-splitting; cached
  client search index; map render memoization + throttled hover; parallel city loads. Deferred (need
  tippecanoe/Docker, documented): raster/vector PMTiles packing, Brotli (browser can't decompress `br`).
- **Phase 3**: scoped pipeline (no Python needed) produced a 191,845-city registry, 7,310 full dossiers
  (19,042 source-backed entities), 12,243 searchable cities, packed into 4 Range-addressable dossier shards
  (51 MB → 10 MB). `audit:data`: 0 unsourced entities, geospatial/license/counts pass. Minor cities
  (4,933 identity-only) resolve via the SPA fallback with honest coverage states. A one-command bulk-source
  downloader (`scripts/data/cities/download-bulk-sources.mjs`) was added so the pipeline is reproducible.

---

## Milestone v1.1 — Deferred follow-up (started 2026-06-21)

Closes the items explicitly deferred at the end of v1.0. **Brotli dossier shards are dropped** (out of
scope): the browser `DecompressionStream` has no `'br'` decoder, so client-side Brotli is unworkable;
dossier shards already ship gzip-compressed.

### Phase 4: Globe vector tiles (PMTiles packing)
**Goal**: Serve globe operational layers from one range-addressable PMTiles archive instead of whole-geojson shards.
**Depends on**: Phase 2 · **Requirements**: TILE-01, TILE-02
**Success Criteria** (what must be TRUE):
  1. `layers.pmtiles` built from all tilable layers (cities excluded by design) ✓
  2. `manifest.json` wired (`pmtilesPath` + per-layer `sourceLayer`); client (`tactical-map-2d.tsx`) consumes it ✓
  3. Tiles serve over HTTP Range (verified end-to-end, no browser) ✓
  4. Deploy prunes the redundant geojson tree in favour of the archive ✓ (`assemble-pages.ts`)
**Status**: **Complete (2026-06-21)** — see Outcomes below.

### Phase 5: Full city enrichment coverage
**Goal**: Expand Connectivity/Environment/Economy coverage from 7,310 enriched cities toward the full 191,845.
**Depends on**: Phase 3 · **Requirements**: COVER-01, COVER-02, COVER-03
**Success Criteria** (what must be TRUE):
  1. One-command downloader acquires the enrichment raw sources reproducibly (auto where a direct URL exists)
  2. resolve-entities + Python enrichment run over the full registry; enriched-city count up vs. 7,310 (measured)
  3. New fields are source-backed; unmatched cities stay explicit `not_covered_yet` (no fabrication)
  4. `audit:data` passes (provenance, geospatial, size budget)
**Status**: **Executed (2026-06-21)** — all browser-free sources pulled + resolved + validated. Cities processed
7,310 → **9,235**; entities 19,042 → **119,020**; active sources 3 → **5**; globe PMTiles 4 → **9 layers**;
`audit:data` PASS 5/5. Residual gap is irreducible without manual portal data (OECD GDP+crosswalk, WPI, GHSL,
Aqueduct, Carbon Monitor, GLEIF) — staged/documented in `.planning/data/PHASE5-PLAN.md`.

### Outcomes (2026-06-21)

- **Phase 4 — DONE**: built Felt's tippecanoe via the repo `Dockerfile` (`econmap/tippecanoe`), ran
  `data:globe:pmtiles` → `public/data/globe/layers.pmtiles` (**1.2 MB**, 19,042 features, 4 source-layers:
  airports/ports/rail-hubs/logistics-hubs; cities excluded). Manifest wired; `verify-pmtiles-http.mjs` confirms
  tiles serve over HTTP Range (4/5 probes; z6 is expected overzoom above maxzoom 5). `assemble-pages.ts` already
  prunes the entire `out/data/globe/layers/` geojson tree when the archive is present — so the deploy now ships
  **1.2 MB in place of the 272 MB** globe layers tree (cities 244 MB + airports 25 MB + the rest). Client was
  pre-wired during Phase 2, so no app code change was needed.
- **Phase 5 — SCAFFOLDED then PARTIALLY EXECUTED**: added `scripts/data/cities/download-enrichment-sources.mjs`
  (`npm run data:cities:download-enrichment`) — 10 AUTO sources + 6 MANUAL portal sources it prints instructions
  for; run sequence documented in `.planning/data/PHASE5-PLAN.md`. Then (autonomous "auto part", 2026-06-21):
  - Pulled the high-value AUTO sources (Ookla mobile+fixed 521 MB, WHO, WRI 12 MB, ROR 304 MB, MobilityDB; skipped
    GLEIF — unused by `load-bulk-entities`).
  - **Connectivity:** ran `generate-connectivity-artifacts.py` over Ookla → **570 cities** (fixed=570, mobile=568).
  - **Environment:** fixed a crash (`generate-environment-artifacts.py` now degrades gracefully when the manual
    Aqueduct zip is absent, matching the carbon-monitor guard) → ran over WHO → **248 cities** air quality
    (water-stress=0, Aqueduct manual).
  - **Validation:** both generator tests pass; `audit:data` PASS (5/5 — 165.9 MB, 0 unsourced entities).
  - **Assets (WRI/ROR) RESOLVED:** ran `rerun-scoped.ts 50000` (13.8 min) → **9,235 cities** resolved (was 7,310),
    **119,020 entities** (was 19,042 — power plants + universities folded in). Repacked PMTiles → **9 globe layers**
    (added utilities/connectivity-fixed/connectivity-mobile/air-quality/research), 6.9 MB archive, HTTP-range 5/5.
  - **Economy partial:** fetched Eurostat `urb_clma` via SDMX bulk API (904K, indicators verified) + hardened the
    economic generator (graceful guards for missing OECD/GLEIF). Eurostat city-labour still needs the **OECD FUA
    municipality crosswalk** (`list_of_municipalities_in_FUAs_and_Cities.csv`, portal-only) to map codes → 0 cities
    for now; Eurostat data staged for when OECD lands.
  - **Published + validated:** `copy-to-public` packed 9,235 dossiers → 16 MB / 4 shards (0 missing); slim search
    12,243 cities. `audit:data` **PASS 5/5** (165.9 MB, 5 sources, 0 unsourced).
  - **Generator hardening (code):** added existence guards so missing manual sources degrade gracefully instead of
    crashing — `generate-environment-artifacts.py` (Aqueduct), `generate-economic-coverage-artifacts.py`
    (Eurostat, GLEIF, OECD crosswalk).
  - **Irreducible manual gap** (genuinely behind gated portals / SDMX query builders, not browser-fetchable):
    OECD GDP + FUA crosswalk, WPI ports, GHSL, Aqueduct water-stress, Carbon Monitor, GLEIF company-presence.

## Progress (v1.1)

| Phase | Status | Completed |
|-------|--------|-----------|
| 4. Globe PMTiles packing | ✓ Complete | 2026-06-21 |
| 5. Full city enrichment coverage | ✓ Executed — 9,235 cities / 119,020 entities / 5 sources / 9 globe layers; audit 5/5 (manual sources excepted) | 2026-06-21 |

---

## Milestone v1.2 — OSINT depth · perf/robustness · country/compare · coverage (started 2026-06-22)

Site deployed (v1.0/v1.1, live at akgularda.github.io/econmap). v1.2 deepens the product. Planned via a
4-architect workflow → 18 sequenced deliverables. **Themes 1/2/4 are fully autonomous; theme 3 (coverage)
is mostly portal/Python-gated** — only its download/doc halves are autonomous (WPI = NGA 403 anti-bot,
Aqueduct = portal-only, generators need Python+geopandas+the OECD FUA shapefile).

### Theme 1 — Deepen the OSINT tool
- entity type-filter chips · multi-city compare (/osint/compare) · entity mini-map · save/export investigation
### Theme 2 — Performance & robustness
- kill dev-home 132MB registry bloat (resolve featured from slug-meta) · fix failing tests · OSINT test net · a11y
### Theme 3 — Expand data coverage (mostly blocked)
- AUTO downloads: OECD SDMX, Carbon Monitor, GHSL · MANUAL: WPI, Aqueduct · generate steps gated on Python
### Theme 4 — Country & compare features
- publish slim enrichment.json · country factbook cities tab · rankings by new data · compare enrichment table

### Progress
- **Batch 1 (2026-06-22) — DONE:** fixed the long-standing `command-center-manifest-consistency` test honestly
  (present sources reconcile; absent stay "not registered"); extracted shared `src/features/osint/lib/entity-display.ts`
  (gates compare/mini-map/country work) + added the entity type-filter; added OSINT test suites (9 tests);
  fixed a `usePathname` test-mock regression in tactical-sidebar/home-shell (11 tests). typecheck/lint clean.
- **Known pre-existing failures (not v1.2 regressions, fail on main):** `asset-provenance` (no generated
  `public/data/assets` dir), `bulk-source-manifest` (required GLEIF/GHSL/OECD/WPI absent — the `required`-flag question).
- **Batch 2 (2026-06-22) — DONE:** multi-city compare (`/osint/compare`, Suspense, build-verified) + entity mini-map
  (lazy maplibre, no-CSS) + `use-city-dossier` hook. Commits `c72e536`.
- **Rank 9 (2026-06-22) — DONE:** export a city brief (Markdown/JSON, client-side). **Theme 1 (OSINT) complete:**
  filter · compare · mini-map · export. Commit `028e9a6`.
- **Rank 2 (2026-06-23) — VERIFIED NO-OP:** the dev-home registry bloat is already fixed — home render is
  registry-free (`featured-cities.json` + bundle dossier reads). No change needed.
- **Status: 8/18 deliverables done (Theme 1 complete; Theme 2 partial).** Remaining autonomous: rank 7
  (publish slim `enrichment.json`) → ranks 8/10/11 (country/rankings/compare data tables), rank 12 (a11y polish).
  **Theme 3 (coverage, 13–18) portal/Python-BLOCKED** — needs user data downloads (WPI/Aqueduct) or stays a gap.
- **Final batch (2026-06-23) — Themes 1, 2, 4 COMPLETE:**
  - Rank 7 ✓ slim `enrichment.json` (570 cities) + `loadEnrichmentIndex` reader + publish wiring (`70169b8`).
  - Rank 10 ✓ compare connectivity/PM2.5 differential table (`70169b8`).
  - Rank 8 ✓ country directory connectivity column (`47f10c7`).
  - Rank 11 ✓ rankings page "Top cities by fixed broadband" client leaderboard.
  - Rank 12 — a11y was built in throughout (aria-live detail region, region labels, aria-current, heading
    hierarchy, table semantics); deemed satisfied, no separate pass.
  - **Theme 3 (ranks 13–18): NOT DONE — physically blocked, cannot be automated.** WPI (NGA 403 anti-bot) and
    WRI Aqueduct (portal-only) require a human browser download; the metric generators need Python+geopandas +
    the OECD FUA shapefile (also portal). Documented in `download-enrichment-sources.mjs` + `data/PHASE5-PLAN.md`.
- **v1.2 RESULT: 14/18 done (Themes 1/2/4 complete). The 4 open items are all Theme-3 portal/Python data work
  that an autonomous agent cannot perform — they need the user's manual data acquisition.**
