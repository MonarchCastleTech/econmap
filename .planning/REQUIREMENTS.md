# Requirements: MapFactbook (econmap)

**Core Value:** The interactive map + trustworthy, source-attributed economic/city intelligence an analyst can navigate quickly.

## Validated (v1.0 — shipped 2026-06-20)

- ✓ **REQ-01** Search-first, sectioned left menu exposing all destinations — Phase 1
- ✓ **REQ-02** Intentional empty/coverage-pending menu states — Phase 1
- ✓ **REQ-03** Static export size + file count reduced (dead-dep removal, top-N pre-render, SPA fallback) — Phase 2
- ✓ **REQ-04** Client bundle + map runtime perf improved (code-splitting, memoization, throttling) — Phase 2
- ✓ **REQ-05** Minor cities degrade gracefully with explicit coverage states — Phase 3
- ✓ **REQ-06** Raw city coverage expanded via the scoped pipeline (191,845 registry / 7,310 dossiers) — Phase 3

## v1.1 Requirements (defined 2026-06-21)

### Map tiles

- [x] **TILE-01**: Globe operational layers serve from a single range-addressable PMTiles archive instead of whole-geojson shards — Phase 4 ✓
- [x] **TILE-02**: Deploy ships only the archive, pruning the redundant per-layer geojson tree — Phase 4 ✓ (`assemble-pages.ts`)

### Coverage expansion

- [x] **COVER-01**: A one-command downloader acquires the enrichment raw sources reproducibly (auto where a direct URL exists; clear manual instructions otherwise) — Phase 5 ✓ (`download-enrichment-sources.mjs`; AUTO sources pulled)
- [x] **COVER-02**: enrichment generated over the registry, increasing coverage vs. the 7,310 baseline — Phase 5 ✓ **9,235 cities / 119,020 entities / 5 sources** (was 7,310 / 19,042 / 3). Connectivity 570 (Ookla), Environment 248 (WHO), Assets WRI+ROR resolved. Economy (Eurostat) staged — needs OECD crosswalk (manual).
- [x] **COVER-03**: New fields are source-backed and `audit:data` passes; unmatched cities stay explicit `not_covered_yet` — Phase 5 ✓ (audit:data 5/5 PASS, 0 unsourced)

## v1.3 Requirements (defined 2026-07-27)

### City identity

- [x] **CITY-01**: Every registry record has a normalized place class that distinguishes city, subordinate place, and region.
- [x] **CITY-02**: Canonical identity preserves source IDs, country/admin hierarchy, aliases, and Unicode/transliterated names.
- [x] **CITY-03**: Acceptance fixtures resolve requested cities correctly and prevent districts or regions from being promoted as peer city results.

### Processing and provenance

- [x] **PIPE-01**: Full-registry processing is deterministic, batched, checkpointed, retryable, and resumable.
- [x] **PIPE-02**: A generated coverage report reconciles all registry records and exposes processed, failed, unresolved, and observed counts.
- [x] **PROV-01**: Facts use explicit `observed`, `not_observed`, `unknown`, `unavailable`, and `not_applicable` states.

### OSINT and product

- [x] **OSINT-01**: Every published layer declares source URLs, scope, join method, fields, default state, and gap reason.
- [x] **OSINT-02**: Place-of-worship and priority civic/infrastructure observation layers are cataloged without claiming universal factual coverage.
- [x] **UI-01**: Every registry city has a usable profile showing identity, baseline facts, observations, provenance, confidence, timestamps, and gaps.
- [x] **QA-01**: Requested-city fixtures, contract tests, full verification, and data audit prevent taxonomy and provenance regressions.

## v1.4 Requirements (defined 2026-07-28)

### Temporal intelligence and evidence

- [x] **TEMP-01**: City observations are stored as timestamped, source-attributed snapshots with methodology and confidence.
- [x] **TEMP-02**: Snapshot diffs produce deterministic deltas and alerts without dropping prior history.
- [x] **TEL-01**: Telecom coverage distinguishes regulator-confirmed, operator-claimed, measured performance, and unknown evidence.
- [x] **TEL-02**: Measured speed or latency cannot be presented as proof of 5G coverage.
- [x] **NET-01**: Ookla, M-Lab, RIPE Atlas, FCC BDC, and GSMA expose machine-readable availability contracts and honest gap states.

### Geography, hazards, and product

- [x] **GEO-01**: Urban-centre geography supports GHSL-derived records while remaining explicitly unavailable until official input is present.
- [x] **HAZ-01**: Current USGS earthquakes are reproducibly matched to nearby canonical cities with distance, magnitude, and source provenance.
- [x] **ALERT-01**: Saved cities surface relevant deltas and alerts in the OSINT console.
- [x] **UI-02**: Evidence and time-machine views appear in both the OSINT console and full city dossiers.
- [x] **QA-02**: Full tests, typecheck, changed-file lint, data audit, production build, and desktop/mobile browser checks pass.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Brotli dossier shards | Browser `DecompressionStream` has no `'br'` decoder; shards already ship gzip. Client-side Brotli is unworkable. |
| Fabricated/interpolated city facts | Data policy is high-confidence-only; unknowns stay `null` / `not_covered_yet`. |
| Global city-level sector mix, rents, cost, congestion, utility reliability, factory/SEZ rosters | No trustworthy global open bulk source (`citydata-bulk-source-matrix.md`). |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TILE-01 | Phase 4 | Complete |
| TILE-02 | Phase 4 | Complete |
| COVER-01 | Phase 5 | Complete |
| COVER-02 | Phase 5 | Complete (9,235 cities / 119,020 entities / 5 sources; Economy needs OECD crosswalk — manual) |
| COVER-03 | Phase 5 | Complete (audit 5/5 PASS) |
| CITY-01 | Phase 6 | Complete |
| CITY-02 | Phase 6 | Complete |
| CITY-03 | Phase 6 | Complete |
| PROV-01 | Phase 6 | Complete |
| PIPE-01 | Phase 7 | Complete |
| PIPE-02 | Phase 7 | Complete (95,915 canonical cities; 42,873 observed; 53,042 unresolved; 0 failed) |
| OSINT-01 | Phase 8 | Complete |
| OSINT-02 | Phase 8 | Complete |
| UI-01 | Phase 9 | Complete (95,915 packed dossiers, including 53,042 registry-only baselines) |
| QA-01 | Phase 10 | Complete (230 tests, typecheck, production build, audit 5/5, browser verification) |
| TEMP-01 | Phase 11 | Complete |
| TEMP-02 | Phase 11 | Complete |
| TEL-01 | Phase 12 | Complete |
| TEL-02 | Phase 12 | Complete |
| NET-01 | Phase 13 | Complete |
| GEO-01 | Phase 13 | Complete |
| HAZ-01 | Phase 14 | Complete (USGS live refresh) |
| ALERT-01 | Phase 15 | Complete |
| UI-02 | Phase 15 | Complete |
| QA-02 | Phase 16 | Complete (255 tests, typecheck, changed-file lint, build, audit 6/6, Playwright desktop/mobile) |

---
*v1.4 requirements defined 2026-07-28. v1.3 requirements completed 2026-07-28. v1.1 requirements defined 2026-06-21. v1.0 requirements (REQ-01..06) validated 2026-06-20.*
