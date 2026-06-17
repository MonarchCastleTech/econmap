# Goal: Scale the data, audit it, and make EconMap mobile-light

> **One sentence:** Grow EconMap to *more cities + more real (never fabricated) data*, prove its
> integrity with a repeatable audit, and re-architect delivery so a phone loads the site in
> **under ~2 MB / ~2 s** even though the full dataset is many GB — by serving data **on demand**
> instead of shipping it all.

Status: PLAN (planning mode). No production code until the delivery architecture below is approved.

---

## 0. Why this goal exists (the core problem, stated plainly)

EconMap is a **static export** (`output: "export"`). Today it works, but the built site `out/` is
**~2.47 GB across ~470,557 files**:

| Part of `out/` | Size | Files | What it is |
|---|---|---|---|
| `data/cities/` | 1,112 MB | 351,387 | per-city dossier JSON (4 files × ~88K cities) |
| `data/globe/` | 771 MB | 7,317 | map layers (**GeoJSON**) + base-imagery tiles |
| `city/` | 324 MB | 108,090 | 12,010 pre-rendered city HTML pages (~9 files each) |
| `data/assets/` | 203 MB | 263 | country infrastructure asset files |

A browser must never download "the website" — only what the **current screen** needs. The reason it
feels like "GBs" is that the map layers are giant GeoJSON blobs and the data is shipped as one flat
pile of files. **The fix is demand-paged delivery**: the map streams only the tiles in view, and
dossiers load one city at a time. Done right, *adding more cities and more data does not increase the
first-load size at all.* That is the key idea that lets us scale data AND shrink the client.

This goal has **three pillars that must be designed together**: Shrink/Deliver (P-A), Scale (P-B),
Audit (P-C). Shrink first — it's the gate; scaling onto a bloated delivery model just makes it worse.

---

## 1. Success criteria (measurable Definition of Done)

**Delivery / mobile (the headline):**
- [ ] **First load on a mid-range phone ≤ 2 MB transferred and interactive ≤ 2.5 s** on a simulated Fast-3G/4G profile (HTML + JS + CSS + base map style + first map viewport + the search bootstrap). Measured with Lighthouse mobile + a scripted network-trace budget.
- [ ] **Opening one city dossier transfers ≤ 250 KB** (compressed) beyond first load.
- [ ] **Panning/zooming the map transfers only viewport tiles** (KBs per move), never a whole layer.
- [ ] **No single client-fetched file > 5 MB.** Map layers are tiled archives streamed by byte-range.
- [ ] **Total deployed file count fits the chosen host** (e.g. < 20,000 objects for Cloudflare Pages) — or we deliberately pick a host without that cap and document it.
- [ ] A CI **size-budget gate** fails the build if any of the above budgets regress.

**Scale (more cities + more real data):**
- [ ] Dossier coverage rises from 87,846 toward **all 189,025 registry cities** that have ≥1 real source (and the registry itself can grow), **without** raising first-load size.
- [ ] At least **2–3 new real source categories** added through the existing join seam (USGS MRDS already wired; next candidates audited for license + key needs).
- [ ] **Zero fabricated** entities/metrics/coverage — enforced by the provenance regression test on the *expanded* data.

**Audit:**
- [ ] A single command (`npm run audit:data`) runs the full audit suite and emits a machine-readable report (`docs/audits/<date>-data-audit.json`) + a human summary, all green or with explicitly-listed, sourced gaps.

---

## 2. Pillar A — Shrink + Deliver (the gate; do this first)

The whole point: **separate "first paint" from "the dataset."** Three data classes, three strategies.

### A1. Map geometry → PMTiles (vector tiles) — the single biggest win
- **Problem:** layers under `data/globe/.../*.geojson` are whole-layer downloads (hundreds of MB).
- **Solution:** convert each vector layer to **PMTiles** — a single-file vector-tile archive that any
  static host/CDN serves via **HTTP range requests**. MapLibre reads it natively via the `pmtiles://`
  protocol and downloads **only the tiles for the current viewport + zoom** (typically tens of KB).
- **Tooling (offline, in the pipeline):** `tippecanoe` (GeoJSON → MBTiles/PMTiles) + the `pmtiles`
  CLI, or `tippecanoe -o layer.pmtiles`. Add `pmtiles` (the JS lib) + register the protocol in the
  MapLibre init.
- **Result:** ~771 MB of GeoJSON → a handful of `.pmtiles` files (one per layer family), and the
  client transfers KBs per view. **This alone removes the "GBs" map problem.**
- **Honesty preserved:** per-feature `sourceId`/source labels travel in tile feature properties; the
  legend modal keeps rendering them. Tile generation must not drop or invent attributes.

### A2. City dossiers → on-demand, compressed, fewer files
- **Keep** the current pattern (dossiers fetched client-side per city) — it's already demand-paged.
- **Combine** the 4 files per city (`workspace`/`entities`/`sources`/`coverage`) into **1 JSON per
  city** → ~88K files instead of 351K, one fetch per dossier instead of four.
- **Precompress** to `.json.br` (Brotli) at build; the CDN serves with `content-encoding: br`. JSON
  dossiers compress ~5–10×.
- **Trim the unreachable:** today ~75K cities ship `entities`/`sources`/`coverage` no page or panel
  reads (verified: the home map only fetches `workspaces/*.json`; only the 12,010 city pages fetch
  the full panel). Ship the full bundle only for cities that are reachable; ship a minimal
  workspace-only bundle for the rest. **Log exactly what is trimmed** (no silent caps).
- **If file count still exceeds the host cap:** move dossiers to **object storage with range-address**
  — either (a) a PMTiles-style key→byte-range bundle for JSON, or (b) Cloudflare R2/KV behind a tiny
  Worker. This is the one place a serverless edge function may be worth breaking pure-static for;
  decide in §5.

### A3. Search index → sharded / compact
- The 59 MB `search-index.json` must not load up front. Options (pick one in §5):
  - **Prefix shards:** `search/<2-letter-prefix>.json` loaded on keystroke (tiny).
  - **Compact client index:** a built FlexSearch/minisearch index (a few MB) loaded lazily on first
    focus of the search box, or a typeahead that queries prefix shards.
- First load ships only a **bootstrap** (featured cities + the shard for the default view).

### A4. HTML page strategy
- 12,010 pre-rendered city pages = 108K files and 324 MB of near-identical loading shells.
- **Decision needed (§5):** either (a) keep pre-rendering only the **top N** cities for SEO/direct
  URLs and client-route the rest from the map/search (fewer files), or (b) keep all 12,010 if the
  host allows the file count. Lower N = far fewer files; trade-off is direct-URL/SEO reach.
- Regardless: ensure shells are tiny and share one chunked JS bundle (already the case).

### A5. Budgets + CI gate
- Add `scripts/audit/size-budget.ts` run in CI: asserts first-load transfer ≤ budget, largest
  client file ≤ 5 MB, file count ≤ host cap, and prints a per-class size table. Build fails on
  regression. This makes "small" a permanent invariant, not a one-time cleanup.

---

## 3. Pillar B — Scale (more cities, more REAL data)

Only meaningful **after** A, because A makes added data free at first-load.

### B1. More cities
- Raise dossier coverage from 87,846 toward **all 189,025** registry cities with ≥1 real source by
  running the full (not scoped) join. With PMTiles + on-demand dossiers, more dossiers = more small
  files on the CDN, **not** a bigger first load.
- Optionally grow the **registry** itself (additional GeoNames feature classes, or a second open
  gazetteer) — registry growth must keep the slim `slug-meta.json` build-time lookup (it's what keeps
  the static export from OOMing).

### B2. More real sources (via the existing join seam)
The seam is proven (`fetch-sources.ts` nearest-city attribution + `bulk-source-manifest.ts` +
`load-bulk-entities.ts` + `resolve-entities.ts` source meta). Per-source, **audit license + key**
before wiring:

| Source | Category | Access | Status |
|---|---|---|---|
| **USGS MRDS** | mineral/extraction | keyless, public domain | **wired** (parser+join+tests); needs propagation run |
| PeeringDB | IXPs / facilities | anonymous read OK | candidate, keyless |
| Healthsites.io | hospitals/clinics | per-country static export may be keyless; bulk API needs token | needs `HEALTHSITES_API_TOKEN` for bulk |
| OpenCelliD | cell towers / mobile | **needs `OPENCELLID_API_KEY`** | blocked on user key |
| Overture Places | POIs/institutions | keyless but **huge** | only viable as PMTiles, not per-city JSON |
| Natural Earth | ports/airports/rail | keyless, public domain | low priority (OurAirports/WPI already finer) |
| Wikidata SPARQL | universities/hospitals/etc. | keyless (CC0) | candidate; network-fetch step |
| **TeleGeography** | subsea cable landings | **commercial license** | **EXCLUDED** — not a public dataset |

- **Rule:** every new source must be license-clear + keyless (or the user supplies the key), carry a
  real visible source label, and pass the provenance test. No source ships without that.

### B3. Propagation discipline
- Re-running the pipeline (to realize MRDS + more cities) **increases `out/` data** — so it must come
  **after** A1–A2 so the new data lands as PMTiles/compressed on-demand bundles, not raw GeoJSON/JSON.
- Sequence: build delivery layer → re-run join with new sources for all cities → regenerate tiles +
  dossier bundles → size-budget gate.

---

## 4. Pillar C — Audit (prove it, repeatably)

`npm run audit:data` → runs all checks, writes `docs/audits/<date>-data-audit.json` + summary.

1. **Provenance (no fabrication):** every published entity has a real `sourceId` mapping to a known
   source label; extends the existing `asset-provenance` regression lock to the city dossiers + tiles.
2. **License audit:** each active `sourceId` maps to a vetted license entry; flags any
   commercial/unclear source (e.g. TeleGeography) as a build failure if wired.
3. **Count consistency:** the P1.4 `command-center-manifest-consistency` test (already added) — all
   user-facing counts trace to the city manifest; extend to tile feature counts.
4. **Coverage matrix (honest gaps):** generate a per-category × per-country coverage table
   (mapped / documented / missing) from real data; surface gaps explicitly; no "100%" unless true.
5. **Geospatial sanity:** coordinates within country/world bounds; de-duplicate entities by
   id + (lat,lon) rounding; flag implausible clusters.
6. **Size-budget audit (A5):** first-load + largest-file + file-count budgets.
7. **Freshness/honesty labels:** frozen/historical sources (e.g. MRDS, updates ceased 2011) keep a
   visible "as-of / methodology" label; the audit asserts the label exists.

Output is **machine-readable + human summary**, committed under `docs/audits/` so coverage/gaps are
traceable over time.

---

## 5·LOCKED. Decisions made (2026-06-15)

- **Host (UPDATED):** **GitHub Pages** (static, served via Fastly CDN). This **removes the edge
  Worker** — Pages cannot run server code. So everything is **pure static + HTTP range requests**.
  Constraints to design around: ~**1 GB** published-site soft limit, **100 MB per-file** git hard
  limit, 100 GB/month bandwidth, deploy via GitHub Actions. (Supersedes the earlier Cloudflare+Worker
  idea below.)
- **Architecture:** **Pure static, NO server.** Map = **PMTiles** streamed by range request.
  Dossiers = a **range-addressed static bundle** (concatenated Brotli'd per-city JSON + an offset
  index; client fetches only the byte-range for the opened city) — this is the Worker's job done with
  zero server. Search = a compact static index (prefix shards or a lazily-loaded built index).
  Per-file >100 MB is split into <100 MB shards (or hosted as Release assets assembled in CI).
- **Sources:** **all open data possible** — propagate **USGS MRDS** (keyless, wired now) +
  **PeeringDB** (keyless read) + **Wikidata SPARQL** + **Natural Earth** + **Overture (as tiles)**;
  and **OpenCelliD** + **Healthsites** *when you supply* `OPENCELLID_API_KEY` /
  `HEALTHSITES_API_TOKEN`. Every source still passes the license + provenance audit; TeleGeography
  stays excluded (commercial).

**Resulting concrete stack:**
| Concern | Decision |
|---|---|
| Static app | Next.js `output: export` → Cloudflare Pages |
| Map geometry | GeoJSON → **PMTiles** (1 archive/layer) in R2, `pmtiles://` in MapLibre, range-streamed |
| Dossiers | 1 compact JSON/city in **R2**, served by the Worker (Brotli), lazy per city |
| Search | index in **KV/R2**, typeahead via the Worker (prefix queries) |
| Budgets | CI `size-budget` gate; first-load ≤ ~2 MB |

**What I need from you to execute:** (1) a Cloudflare account + `wrangler` login (the Worker/R2/KV
can't be deployed without it — I'll write all the code/config); (2) the `OPENCELLID_API_KEY` /
`HEALTHSITES_API_TOKEN` if you want those two; (3) OK to add deps (`pmtiles` JS lib) and install
`tippecanoe` (tile generator) in the pipeline.

## 5. Open decisions (superseded by §5·LOCKED above)

1. **Host / file-count ceiling.** Where will this deploy? (Cloudflare Pages ~20K-file cap → we must
   bundle dossiers; vs. S3/R2/nginx/Netlify → file count is fine.) This determines whether A2 needs
   range-addressed bundles or can stay per-city files.
2. **Pure-static vs. one edge Worker.** Staying 100% static (PMTiles + flat files + CDN) is simplest
   and cheapest. Allowing **one** small edge function/KV unlocks clean on-demand dossier lookup +
   server-side search at scale. Which do you prefer?
3. **HTML pre-render breadth (A4):** pre-render top-N cities only (fewer files, client-route the rest)
   or all 12,010 (more files, every city has a direct URL)? Pick N or "all".
4. **Search UX (A3):** prefix-shard JSON (simplest static) vs. a bundled client search index (richer,
   a few MB lazy)?
5. **How many cities to publish (B1):** all 189K with ≥1 source, or a population threshold? (Delivery
   model makes "all" viable; the question is build time + CDN object count.)
6. **Which new sources now (B2):** confirm we propagate MRDS; do you have OpenCelliD / Healthsites
   keys, or keep those deferred?

---

## 6. Phased implementation plan (each phase independently shippable + testable)

**Phase A — Shrink/Deliver (gate):**
1. A1 PMTiles pipeline for one layer end-to-end (tippecanoe → `.pmtiles` → MapLibre `pmtiles://`),
   verify viewport-only fetch; then roll to all vector layers.
2. A2 combine dossiers to 1 file/city + Brotli + trim unreachable (with a logged manifest of what was
   trimmed).
3. A3 sharded/compact search; first-load bootstrap only.
4. A5 size-budget CI gate + Lighthouse-mobile check. **Exit:** budgets in §1 met on current data.

**Phase C(partial) — Audit harness:**
5. `npm run audit:data` with provenance + license + count + geospatial + size checks (runs on current
   data; becomes the gate for Phase B).

**Phase B — Scale:**
6. Propagate MRDS + run full-coverage join (all eligible cities) → regenerate tiles + dossier bundles.
7. Add 1–2 more keyless/keyed real sources (per §5.6) through the seam, each license-audited.
8. Re-run audit + size budgets; publish the coverage matrix.

**Phase C(finish) — Coverage report + freshness labels**, committed under `docs/audits/`.

---

## 7. Risks & mitigations
- **Tile generation drops attributes/sources** → assert source labels survive in tiles (audit C1).
- **Brotli/range not supported by chosen host** → verify host capabilities in §5.1 before A2/A1.
- **File-count cap hit even after trim** → fall back to range-addressed bundle or one edge Worker (§5.2).
- **Full-coverage join cost/space** → reuse the space-lean scoped runner pattern; stage by region.
- **A new source is secretly licensed/keyed** → license audit (C2) blocks it; never ship unverified.
- **First-load creep over time** → the CI size-budget gate (A5) is the permanent guardrail.

## 7·EXEC. Verified blueprint + execution status (2026-06-15)

A multi-agent research workflow (4 workstreams, each adversarially verified; live web-checked GitHub
limits) produced the blueprint below. `npm run audit:data` established the **baseline** (out/ = 2,467
MB / 470,557 files; registry.json 112.5 MB > 100 MB git limit; telegeography commercial; counts +
provenance + geospatial all green).

**Blueprint corrections that change the plan (from the verification):**
- **No range-bundle complexity needed for the MAP** — globe layers ALREADY have a boot + quadrant-shard
  system; the bloat is leftover **monolithic `current.geojson` + `shards/world.geojson`** (~460 MB)
  that nothing references. Pruning them is a pure win; PMTiles is a *further* optimization (needs
  `tippecanoe`, Windows→Docker/WSL/CI).
- **`data/assets/usa.json` = 95 MB** is fetched at runtime when viewing the USA — shard/cap it like
  corridors; update `src/lib/asset-client.ts`.
- **6,991 per-city footprint GeoJSON (43 MB) are unreferenced** in `src/` — exclude from `out/`.
- **S1 (kill the 117 MB registry fetch)** is the biggest first-load win (cityId derives from slug via
  `/^(geo-\d+)-/`, 189025/189025) but it **rewrites `command-center-client.test.ts`** and turns the
  ~100K registry-only (dossier-less) cities into runtime not-found (more honest; confirm no prerendered
  shell lacks a workspace).
- **Search:** prefix-sharding breaks substring/alias/country matching; prefer dropping the URL/Q-ID
  aliases (they dominate the 59 MB) for a slim single index, OR shard by country.

**Status:**
- ✅ **Pillar C audit harness** — `npm run audit:data` (size-budget + license + count-consistency +
  provenance + geospatial), `src/domain/source-licenses.ts`, dated report under `docs/audits/`. Baseline
  red exactly where expected; gates every future build.
- ✅ **Dossier bundle (A2)** — `build-dossier-bundle.ts` (gzip, sha1-sharded, Range-addressable) +
  `dossier-bundle-client.ts`; 4 client loaders + `command-center-client` + `home-stage` rewired; test
  rewritten (Range mock, node env); `copy-to-public` ships the bundle. **940 MB/351K files → 127 MB/6
  files**; round-trip verified (London, the largest, = 48 KB Range fetch). 153/153 green.
- ✅ **S1 — 117 MB registry fetch eliminated** — `findCityBySlug`/`findCityById` derive cityId from
  the slug + read `workspace.city` from the bundle; `registry.json` removed from publish + `public/`
  (kills the only >100 MB git-limit file). 153/153 green.
- ✅ **Search slimmed** — `build-search-index-slim.ts`: navigable (pop≥50K) cities, real aliases only,
  **59 MB → 2.4 MB**, single file, lazy on first search, same shape (no client change). 153/153 green.

- ✅ **#22 globe prune + assemble-pages** — `scripts/deploy/assemble-pages.ts` (`npm run deploy:assemble`)
  prunes the manifest-verified-dead `current.geojson` + `world.geojson` for sharded+boot layers (441 MB;
  verified against the map's region/boot logic — quadrant shards + boot cover every view) and runs the
  size-budget gate. Operates on `out/` (the regenerable deploy artifact), not `public/` source.
- ✅ **#21 country-asset cap** — assemble-pages caps oversized country files to top-5000 by priority
  (`usa.json` 95.3 → 1.8 MB; 13 files, 134 MB freed); `country-assets.tsx` shows an honest "top N of M,
  full total above" note. No silent truncation.

### 🎯 SIZE GOAL MET — `out/` 2,467 MB → **909.9 MB** (under the 1 GB GitHub Pages cap), files 470,557 →
119,168, **no file > 50 MiB**, registry/100MB-violation gone. `npm run audit:data` size-budget = PASS.
Deploy flow: `npm run build` → `npm run deploy:assemble` → publish `out/`.

**Cumulative:** `public/data/cities` ~1.4 GB → ~130 MB; worst git-limit file (registry) gone.

**Still open:** license audit flags **telegeography** (commercial) — strip those asset records before
deploy (cheap; do at deploy-prep). A final clean build bakes the country "top N of M" note into the
export. #23 PMTiles (needs `tippecanoe`) would shrink the globe much further (optional). #24 deploy
needs your GitHub repo.

**Remaining shrink (priority):**
1. **#21 country-asset cap** (`usa.json` 95 MB → top-N by priority) — needs honest handling: the
   country page's source/health/pipeline panels compute from the fetched array, so a cap must surface
   "top N of M" + pull totals from the asset manifest (like corridors). Verify against `country-assets.tsx`.
2. **#22 globe prune** (~460 MB dead `current.geojson`/`world.geojson`) — VERIFY the map's
   region/boot logic before deleting `world.geojson` (it may be the world-view shard); risk of map
   breakage if wrong, so do with a build + map check, not blind. Plus the 43 MB unreferenced footprints (safe).
3. **#23 PMTiles** (needs `tippecanoe`), **#24 deploy pipeline** (needs your GitHub repo).

**Remaining shrink steps (priority order, all locally-doable except where noted):**
1. Wire the dossier bundle into the 4 client loaders + rewrite `command-center-client.test.ts` (Range mock).
2. S1 — eliminate the 117 MB registry client fetch (+ test rewrite).
3. Slim/shard the 59 MB search index.
4. Shard/cap `usa.json` (+ other big country assets) like corridors; update `asset-client.ts`.
5. `assemble-pages` script: build → strip dead globe monoliths + unreferenced footprints from `out/` → size-budget gate.
6. **NEEDS tippecanoe:** map layers → PMTiles (Docker/WSL/CI).
7. **NEEDS user GitHub repo:** `.github/workflows/deploy.yml` (Release-asset → Actions assemble → Pages), `.gitignore` to keep the source repo small, basePath if project-pages.

## 8. Definition of done
All §1 success criteria met and locked by CI: phone first-load ≤ ~2 MB / ≤ 2.5 s; map streams
viewport tiles; one dossier ≤ 250 KB; coverage expanded toward all real-source cities with **zero
fabrication**; `npm run audit:data` green with an honest, sourced coverage/gap report; size-budget
gate guarding every future build.
