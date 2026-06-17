# EconMap → City-First OSINT Infrastructure & Institutions Atlas — Implementation Plan

> Status: IN EXECUTION (coding mode approved). Authored from a 10-subsystem parallel codebase
> audit. Working dir: `F:\Professional_Career\Software_Projects\EconMap` (the requested
> `C:\Users\akgul\Downloads\EconMap` does not exist; this is the only EconMap repo).

## Execution log (most recent session)

**Completed & verified** (per-task tests green; `tsc --noEmit` 0 errors, was 43):
- **P0.1** env restored (`npm ci`, typecheck script, testTimeout raised); suite green.
- **P0.1b** build type gate green (43→0): excluded `data/`+`prisma` from tsconfig; fixed zod input/output variance in `city-data-client`, SSR storage in `ui-store`, test fixtures/mocks, `fetch-sources` optional-coord typing.
- **P0.2** fabrication purged: 460 synthetic asset records removed (backed up to `data/quarantine/`), `extract-telecom-assets`/`generate-mock-assets` neutered, `global-countries.json` rebuilt without `Math.random()`; `asset-provenance.ts` rule + regression-lock test.
- **P0.2b** derived `mapfactbook-lab` observations relabelled `estimate` (not `actual`) in `normalized/countries.ts`.
- **P0.3** city dossier static path repaired: `command-center-client` correct manifest path + rich schema-parsed workspace; artifacts published; verified end-to-end on real cities. Test: `command-center-client.test.ts`.
- **P1.1** parser bugs: OurAirports ICAO (`icao_code`‖`gps_code`); **UN/LOCODE port↔airport swap** corrected.
- **P1.3** matcher rewritten with `spatial-index.ts` grid (O(local density)); `csv-stream` hardened (missing-file hang + ragged rows). Scoped validation: source attribution **9/9/9/4 → 1,403/1,550/1,011/197 cities**; full join ~11 min.
- **P2.1** analyst model de-duplicated: deleted dead/diverged copy in `command-center-data.ts` (21,905 chars); `analyst-sidebar-model.ts` is the single source; new `analyst-sidebar-model.test.ts`.
- **P2.2** menu: Infrastructure Categories shows its own foundation rows (no re-summarising); `/base/i` metric false-positive removed.
- **P2.3** user watchlists: `buildSavedCitiesWatchlist` surfaces the persisted watchlist store as a "Saved cities" entry, prepended to curated sets.
- **P2.4 (partial)** layer styles added for rail-hubs/logistics-hubs/transit-feeds/research.
- **P5 (partial)** removed 4 orphan components (MetricPanel, WorldMapPanel, LayerRow, GlobeInfoCard); inlined shared type.

**In flight:** **P1.5** full pipeline re-run (`scripts/data/cities/rerun-full.ts` → `copy-to-public`) — disk-bound, several hours. Propagates P1.1/P1.3 to all 189K live artifacts.

**Remaining (gated on P1.5 finishing + disk free / network):** P1.2 count reconciliation; P1.4 manifest single-source-of-truth; P2.4 default-visible layer + ports coverage; **P3 new-source downloads** (Healthsites, PeeringDB, OpenCelliD, OpenInfraMap, Overture, World-Bank SEZ, GHSL); P4 coverage/confidence surfacing; P5 corridors 248MB bloat + deck.gl/Cesium dep review; final `next build`.

**Resume after P1.5:** verify coverage landed (`sourceCounts` + sample city) → full suite serialized → `next build` → P1.2 → P3.

## 0. Product north star

A **city-first, OSINT-first** global atlas: every city-level unit category that a *real public
database* can back, shown with **visible source labels**, **explicit coverage gaps**, and
**zero fabrication**. The left menu is the analyst control surface for navigating thousands of
evidence layers across cities × categories.

## 1. Current state (facts from audit)

- Next.js 16 static export (`output:'export'`), React 19, Tailwind 4, **MapLibre only** (deck.gl/Cesium unused).
- 6-stage city pipeline over **189,025 GeoNames cities**; per-city `workspaces/entities/sources/coverage` JSON + map GeoJSON + manifest; 4 enrichment generators (connectivity/environment/economic/mobility).
- **Real categories (~13):** airports(66,172) · universities(10,305) · power-plants(844) · logistics-hubs(519) · rail-hubs(135) · ports(~30) · transit-feeds(1,382) · broadband fixed/mobile(~564) · air-quality(~452) · water-stress(~331) · + GLEIF/OECD/Eurostat/Carbon-Monitor enrichment · population.
- **Test status:** 89/89 executed tests pass; 8 suites fail to *collect* due to a broken `node_modules` (env, not code).

## 2. Non-negotiable violations to fix FIRST (truth & pipeline integrity)

1. **Fabricated data shipped to UI** — `extract-telecom-assets` writes `Math.random()` base-stations/IXPs with a faked `ookla` sourceId into `public/data/assets/*.json`; `generate-global-countries` fabricates country economics; `iea-demo`/`mapfactbook-lab` scenario sources used as "actual."
2. **City dossier broken in static export** — `public/data/cities` missing `registry.json`/`manifest.json`/`search-index.json`/`sources/`/`coverage/`; client reads wrong manifest path.
3. **Parser correctness** — OurAirports ICAO dup-operand bug; UN/LOCODE function-code mapping inverted; Carbon Monitor positional `_2`.
4. **Count inflation & stale artifacts** — manifest entity counts are cross-city-duplicated join rows (airport 3.78M vs real 66,172); UN/LOCODE/WPI/WRI/ROR attribute to only 4–9 cities; `facts/` (2,137) vs `resolved/` (189,025) drift.
5. **Duplicate analyst-model source of truth** — `command-center-data.ts` (dead) vs `analyst-sidebar-model.ts` (live), diverged; tests exercise the dead copy.

## 3. Phased plan (each task = TDD: red → green → verify → report)

### Phase 0 — Honest, runnable baseline  *(blocker repairs)*
- **0.1 Restore test/build env**: `npm ci`; add `typecheck` (`tsc --noEmit`) + `prisma:generate`/`prisma:seed` scripts if missing. Verify: full `vitest run` green (target 8 collect-failures → 0), `next build` succeeds.
- **0.2 Quarantine fabrication**: stop shipping synthetic telecom + fabricated country economics to `public/`. Introduce a hard `coverageState` gate (`verified_exact` | `source_estimate` | `synthetic`); the UI must never render `synthetic` as sourced. Make `generate-mock-assets` dev-only + non-destructive. Gitignore mock asset output. Test: a guard test asserting no `synthetic`/`Math.random`-origin record reaches `public/data/assets` or city workspaces.
- **0.3 Repair city-dossier static path**: publish missing `public/data/cities` artifacts (registry/manifest/search-index/sources/coverage) via `copy-to-public`; point `command-center-client` at the correct CommandCenter manifest. Test: client resolves a known city slug end-to-end (no "City not found").

### Phase 1 — Pipeline correctness
- **1.1** Fix OurAirports ICAO (`ident`) + UN/LOCODE function-code mapping; update parser tests.
- **1.2** Reconcile manifest counts to real feature counts (or rename to `coverageReferenceCounts`); backfill/justify the 135 missing `sources/` files; add an artifact-integrity test (file-per-city completeness + count reconciliation).
- **1.3** Fix entity→city matcher (UN/LOCODE/WPI/WRI/ROR should hit thousands of cities; OurAirports must stop the 3.78M over-match); harden `csv-stream` with `relax_column_count` + malformed-row/missing-coord/encoding regression tests; add freshness guard (facts↔resolved count + `generatedAt`).
- **1.4** Single-source-of-truth manifest: export `getBulkSourceManifest()` → JSON consumed by Python/TS generators; fix `required` flags to match real consumption; add a source-registry consistency test (manifest ids ↔ `datasetInventory` ids ↔ per-dataset workspace JSON).

### Phase 2 — De-dupe model + redesign the left menu (primary UX deliverable)
- **2.1** Delete dead `command-center-data.ts` analyst copy; make `analyst-sidebar-model.ts` the single source; repoint `command-center-data.test.ts`; add a real test for the LIVE model (section shapes, hrefs, state toggling).
- **2.2** Reorganize sections to the target taxonomy and make them honest:
  `City selector/jump` · `Dossier sections` · `Infrastructure` · `Institutions / public services` · `Telecom / connectivity` · `Utilities / energy` · `Logistics / transport` · `Environment / hazards` · `Source coverage / data quality` · `Missing coverage / gaps` · `Saved watchlists / compare sets` · `Recently viewed`.
  Each row: counts (mapped/documented/queued/missing), **source-backed availability only**, visible source labels, explicit gaps. Stop "Infrastructure Categories" from re-summarizing other sections. Tighten `metricPatterns` regexes (kill `/base/i`, `/fire/i` false positives). Desktop-first, mobile-workable (collapsible).
- **2.3** Real user watchlists/compare sets via existing `watchlist-store` (replace 3 hardcoded baskets).
- **2.4** Default-visible evidence layer on home load; complete `LAYER_STYLE_DEFAULTS` for unstyled layers; enrich ports layer to full WPI/UN-LOCODE coverage.

### Phase 3 — Expand REAL coverage via a formal extension seam
Define `SourceJoinModule { manifestKey, parse(file), findForCity(city), toFactEntity() }` registered in one array consumed by `load-bulk-entities` + `fetch-sources`. Then add highest-value categories that have a real open source (each TDD, each with visible source label + coverage gaps):
- **3.1** Hospitals/clinics → Healthsites.io (gives Institutions a real mapped row).
- **3.2** IXPs + data centers → PeeringDB (replaces fabricated telecom).
- **3.3** Cell sites / mobile → OpenCelliD (replaces fabricated base stations).
- **3.4** Power grid: substations/transmission → OpenInfraMap/OSM.
- **3.5** Metro/rail stations → GTFS stops (Mobility DB already downloaded).
- **3.6** Schools, police, fire, government, SEZ, warehouses → Overture Places / Geofabrik OSM / World Bank SEZ.
- **3.7** City boundary geometry + built-up/land-area/density → GHSL (already downloaded).

### Phase 4 — Surface coverage + confidence
- **4.1** Per-row confidence/coverage tier in `LayerEvidenceTable` (city-exact vs admin1→city vs estimate).
- **4.2** Machine-readable `cities-per-source` coverage report in manifest (gaps regenerated, not hand-curated markdown).
- **4.3** New dossier sections + map layers for the new categories.

### Phase 5 — Cleanup
- Remove dead/decorative UI (`LayerRow`, `GlobeInfoCard`, `TacticalActionMenu`, `WorldMapPanel`, orphan `MetricPanel`); drop/replace 248MB `corridors.json`; reconsider deck.gl/Cesium deps.

## 4. Verification per phase
- Unit/integration: `vitest run` (TDD per task).
- Pipeline: targeted re-run of affected stage + integrity test.
- Manual: load `/`, select a city, open `/city/[slug]`, confirm source labels + gaps render and no fabricated values surface.
- Build: `next build` (static export) green.

## 5. Definition of done (per the quality bar)
- No fabricated/synthetic value is presented as sourced anywhere in the UI.
- Every visible city claim traces to a visible source label/dataset.
- City dossier + map work in the static-export build.
- Left menu organized by city × evidence category with real counts, source-backed availability, and explicit gaps.
- New real categories integrated and visible; remaining gaps shown honestly with their identified source.
- Tests green; build green.

## 6. Open decisions (resolved during execution)
1. Coding-mode: approved, executed straight-through.
2. Fabricated-data policy: remove/quarantine — done (P0.2).
3. New-source policy: download new external datasets — approved but **storage-blocked** (see below).

## 7. Crash + recovery + final state

During the **full P1.5 re-run**, the external **Seagate Expansion USB HDD (`F:`) disconnected mid-run** under the ~1M-file write load (failed at `generate-artifacts` with a corrupted `mkdir '\\?'` path; the drive unmounted). After physically reconnecting it:
- **All source survived intact**: `tsc --noEmit` = 0 errors; full suite **131 tests / 49 files green** (serialized).
- **Served data is OLD-but-consistent**: `src/data/generated/cities` + `public/data/cities` are the pre-re-run state (`generate-artifacts` failed before overwriting them), so the app still works with the prior (buggy 9/9/9/4) coverage. The crash only dirtied the intermediate `data/raw/cities/facts` + `resolved/` (both regenerable, neither served).
- Added **P1.2 artifact-integrity test** (`manifest-integrity.test.ts`).

**Storage blocker (NOT code-blocked):** propagating the validated matcher fix to all 189K served artifacts requires the full pipeline (~1M file writes), which this slow USB HDD cannot survive. The fix is implemented + tested + validated (temp-dir validation proved 9→1,403 cities); only the bulk data-regen is blocked.

**To propagate the coverage fix — run on adequate storage** (internal SSD with free space, or a non-USB-HDD; `C:` had ~6.4GB free, so free space / relocate first):
```bash
npx tsx scripts/data/cities/rerun-full.ts && npx tsx scripts/data/cities/copy-to-public.ts
```
Or stay on the external drive with a **scoped** subset (drive-safe): add a population/`isMajorCity` `cityFilter` to `fetchCitySources` + pass a matching scoped registry to `generateArtifacts`. See memory `econmap-external-drive-constraint`.

### Completed & verified (13)
P0.1, P0.1b (tsc 43→0), P0.2, P0.2b, P0.3, P1.1, P1.3, P2.1, P2.2, P2.3, P2.4 (layer styles), P1.2 (integrity test), P5 (orphan components).

### Storage/network-blocked on this drive (code ready or queued)
P1.5 full propagation; P1.2 generator count-rename; P1.4 manifest single-source-of-truth (generator edit drive-safe, verify needs re-run); P3 new-source downloads; P4 surfacing; P2.4 default-layer + ports coverage; `next build`; P5 corridors 248MB.

## 8. Post-relocation state (repo moved to `C:\EconMap`, SSD)

The storage blocker is resolved — repo lives on the internal SSD with tens of GB free. Work completed since:

- **P1.5 propagation DONE (live).** Ran the scoped pipeline; **87,846 cities now have source-backed dossiers** (was 9/9/9/4). Per-source joins: UN/LOCODE 9→61,174, WRI power 9→20,004, ROR research 9→16,771, World Port Index 4→2,299.
- **Over-match correctness fix shipped** (`fetch-sources.ts`): nearest-city attribution via spatial grid (`buildNearestMap` / `nearestCityId`) replaced the bbox over-match that bloated facts to 3.78M airport rows and filled the disk. Entity-less cities now skip artifact emission (`generate-artifacts.ts`: `if (!skipPerCityOutputs && resolved)`).
- **OOM fix shipped** (`city-data.ts`): `loadCityRegistry` (113MB) + `loadCitySearchIndex` (59MB) memoized per worker — previously re-parsed ~40K× during static export → exit 134. Heap also bumped to 8GB for the build.
- **Build toolchain fixed:** `package.json` build = `next build --webpack` (Turbopack fails on this project's Tailwind v4 CSS); `generateStaticParams` added to `datasets/[datasetId]` and `regions/[slug]`.
- **P5 corridors bloat FIXED.** `generate-corridors.ts` rewritten to emit a slim **`corridors-index.json`** (full-set honest counts) + per-corridor **`corridors/{id}.json`** capped to top-5000 by priority. **236MB → 4.9MB** (231MB removed from the shipped export). `global-view` (whole-planet bbox, 483K assets) is the only corridor that caps; the UI shows an explicit "top N of M" note. Client (`asset-client.ts`: `fetchCorridorIndex`/`fetchCorridorDetail`) + page (`corridors-page.tsx`: lazy per-corridor load, full-count stats) updated. Regen: `npx tsx scripts/data/assets/generate-corridors.ts` then copy `data/processed/assets/corridors*` → `public/data/assets/`.
- **Design system elevated** (`globals.css` foundation + `source-badge`, `metric-card`, `tactical-sidebar` header, `city-workspace` dossier hero): deep-blue base, dual sage/cyan accents, refined panels/badges/chips, `display-title`/`eyebrow`/`signal-dot`/`mono-readout` utilities. All original class names preserved; render + typecheck green.
- **Static-export OOM (round 2) diagnosed + fixed.** The clean build still died exit 134 during `/city/[slug]` generation (12,010 pages, pop≥50K). Root cause: each export worker loaded the **full 113MB registry** (`loadCityRegistry().find()` in `generateMetadata` + a redundant lookup in the page body) → ~500MB resident per worker; combined with accumulated per-page output it hit the **4.29GB default worker heap** (worker threads ignore `NODE_OPTIONS`). Fix: a slim **`slug-meta.json`** (`{slug: {n,i,p}}`, 11MB) generated by `scripts/data/cities/generate-slug-meta.ts` (also wired into `rerun-scoped.ts` step 1); `loadCitySlugMeta()` added to `city-data.ts`; `city/[slug]/page.tsx` now uses slug-meta for `generateStaticParams`/`generateMetadata` and drops the redundant registry lookup (validity is already guaranteed by `generateStaticParams`). Worker baseline ~500MB → ~30MB; expected peak ~3.5GB with ~750MB headroom. `tsc --noEmit` = 0. **Confirmed: the next build generated all 12,313 static pages with no heap error** (the OOM is resolved).
- **Static-export searchParams blocker fixed.** With the OOM gone, the build then failed prerendering `/` — the home server component `await`ed `searchParams`, which forces dynamic rendering (illegal under `output: export`). Only `src/app/page.tsx` used server-side searchParams, and no client component reads `useSearchParams`, so deep-linking was never functional in the static export anyway. `Home()` now renders the default analyst surface (featured city + default night-lights imagery); the obsolete `getSingleValue`/`parseLayerIds` helpers were removed, and the home tests + the `homepage-city-first-check` verify script were updated to the no-arg contract. `tsc` = 0, home tests 5/5 green.

### ✅ Deployable build ACHIEVED + fully verified
- **`npm run build` exits 0** and produces a complete static export at `out/` — home `index.html`, **12,010 city dossier pages** (pop≥50K), datasets (29 paths), regions (12 paths), slim corridors index + 13 per-corridor files, **no 236MB monolith**.
- **Full suite green: 51 files / 138 tests** (the 2 design/bloat-related breakages were fixed: home-shell header text updated to "City-first OSINT atlas"; `asset-provenance.test.ts` now excludes the new `corridors-index.json` summary file). `tsc --noEmit` = 0.
- **Export footprint:** `out/` ≈ 2.47 GB across ~470,557 files. The slim corridors removed ~231 MB. The remaining bulk is per-city dossier JSON under `out/data/cities/` — note **~75K dossier files are shipped but unreachable** (only the 12,010 pop≥50K cities have pages), a deploy-friction optimization opportunity (some static hosts cap file counts) for a follow-up, not a correctness issue.

### Still open
- P1.4 manifest single-source-of-truth + consistency test (plumbing).
- P2.4 default-visible evidence layer + ports layer (couples to slow `page.test.tsx`).
- P3 new-source downloads (PeeringDB / OpenCelliD / Healthsites need user-supplied API keys; Overture/Geofabrik are very large) — auth/scope-blocked.
