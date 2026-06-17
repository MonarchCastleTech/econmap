# EconMap City-First Atlas Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn EconMap into a city-first, source-traceable infrastructure and institutions atlas by repairing the data truth layer, publishing more real city evidence, and rebuilding the left rail around analyst navigation instead of decorative layer toggles.

**Architecture:** Keep the current offline artifact pipeline, but widen the command-center contract so every homepage/city-page claim comes from generated city workspace evidence, dataset inventory, or explicit coverage-gap metadata. Add one new city-scale source that already exists locally but is not operationally surfaced, then use the resulting analyst model to power both the homepage rail and dossier navigation with visible source labels and missing-coverage sections.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Python artifact generators, generated JSON/GeoJSON artifacts

---

## Audit Summary

- Current city registry coverage is broad: `src/data/generated/cities/manifest.json` reports `189025` cities.
- Published globe layers already exceed what the homepage rail suggests: `cities`, `airports`, `ports`, `rail-hubs`, `logistics-hubs`, `utilities`, `connectivity-fixed`, `connectivity-mobile`, `air-quality`, `water-stress`, `research`.
- Real city enrichment already exists for:
  - connectivity: `564` cities
  - environment: `452` cities
  - economic/company coverage: `6509` cities
- Gap: the homepage/sidebar contract remains layer-first and only exposes a small fraction of city evidence, source coverage, and gaps.
- Gap: `scripts/data/cities/run-pipeline.ts` does not run the enrichment generators that feed connectivity, environment, or economic coverage, so a full rebuild can drift away from the published command-center state.
- Gap: Mobility Database is downloaded locally and listed in dataset inventory, but no city-level transport coverage is generated from it.

## Prioritized Scope

1. Repair pipeline truth so published manifests and analyst navigation can accurately state what exists, what is published, and what is still queued.
2. Add Mobility Database as a real city-level transport/transit evidence source.
3. Replace the homepage tactical sidebar with a city-first analyst control surface driven by real city/category/source/gap metadata.

### Task 1: Repair Pipeline Truth Layer

**Files:**
- Modify: `scripts/data/cities/run-pipeline.ts`
- Modify: `src/lib/command-center-data.ts`
- Modify: `src/domain/command-center-schemas.ts`
- Modify: `src/domain/types.ts`
- Test: `src/lib/command-center-data.test.ts`

**Step 1: Write the failing tests**

- Add a test proving the analyst navigation model exposes:
  - city-level category availability counts
  - source coverage / gap sections
  - queued dataset-backed categories when the source exists locally but no city evidence is published
- Add a test proving the pipeline run sequence invokes:
  - registry ingestion
  - base entity fetch/resolve/artifact generation
  - connectivity enrichment
  - environment enrichment
  - economic coverage enrichment
  - globe artifact generation

**Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- src/lib/command-center-data.test.ts
```

Expected:
- Failure because the analyst navigation model does not exist yet.

Run:
```bash
npm test -- scripts/data/cities/run-pipeline.test.ts
```

Expected:
- Failure because the pipeline does not call the enrichment generators yet.

**Step 3: Write the minimal implementation**

- Introduce an analyst navigation model in `command-center-data` that derives:
  - dossier sections
  - city/category counts
  - source coverage summaries
  - missing coverage rows
  - queued dataset rows from dataset inventory
- Update `run-pipeline.ts` to execute all enrichment generators before `generateGlobeArtifacts`.

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- src/lib/command-center-data.test.ts scripts/data/cities/run-pipeline.test.ts
```

Expected:
- PASS

### Task 2: Publish Mobility Database City Transit Coverage

**Files:**
- Create: `scripts/data/cities/generate-mobility-artifacts.ts`
- Create: `scripts/data/cities/generate-mobility-artifacts.test.ts`
- Modify: `scripts/data/cities/run-pipeline.ts`
- Modify: `scripts/data/cities/bulk-source-manifest.ts`
- Modify: `scripts/data/cities/generate-globe-artifacts.ts`
- Modify: `src/lib/city-intel-enrichment.ts`

**Step 1: Write the failing test**

- Add a test fixture with a small `feeds_v2.csv` sample proving:
  - GTFS rows match cities by country + municipality/alias
  - a city gets transport metrics such as feed counts and official-feed counts
  - a globe layer is published for the resulting city-presence transport evidence
  - dataset inventory marks Mobility Database as `published_to_website`

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- scripts/data/cities/generate-mobility-artifacts.test.ts
```

Expected:
- Failure because the generator and layer do not exist yet.

**Step 3: Write minimal implementation**

- Parse `data/raw/cities/bulk/mobilitydatabase/feeds_v2.csv` using the existing CSV stream helper.
- Match feeds to city registry records by ISO2 + municipality/aliases.
- Emit:
  - `data/processed/cities/indexes/transit-feeds.json`
  - `src/data/generated/command-center/city-mobility-enrichment.json`
- Load that enrichment via `city-intel-enrichment.ts`.
- Add a `transit-feeds` globe layer and connect Mobility Database dataset inventory to the published layer.

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- scripts/data/cities/generate-mobility-artifacts.test.ts
```

Expected:
- PASS

### Task 3: Build the Analyst Navigation Contract

**Files:**
- Modify: `src/features/home/components/home-shell.tsx`
- Modify: `src/features/home/components/home-stage.tsx`
- Modify: `src/features/home/components/layout/tactical-sidebar.tsx`
- Modify: `src/features/home/components/layout/tactical-sidebar.test.tsx`
- Modify: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

**Step 1: Write the failing tests**

- Add sidebar tests that require:
  - city selector / jump
  - dossier sections
  - infrastructure categories
  - institutions / public services
  - telecom / connectivity
  - utilities / energy
  - logistics / transport
  - environment / hazards
  - source coverage / data quality
  - missing coverage / gaps
  - saved watchlists / compare sets
  - recently viewed cities
- Add storage tests for recent cities and saved watchlists/compare sets.

**Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- src/features/home/components/layout/tactical-sidebar.test.tsx src/lib/storage.test.ts
```

Expected:
- Failure because the new sections and persistence model do not exist yet.

**Step 3: Write minimal implementation**

- Replace the current layer-first rail with a city-first analyst rail.
- Drive section counts and enabled states from the new analyst navigation contract only.
- Keep source labels visible on every row that makes an evidence claim.
- Persist recent cities and saved watchlists/compare sets in `localStorage`.

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- src/features/home/components/layout/tactical-sidebar.test.tsx src/lib/storage.test.ts
```

Expected:
- PASS

### Task 4: Strengthen City Dossier Traceability

**Files:**
- Modify: `src/features/city/components/city-workspace.tsx`
- Modify: `src/features/city/components/city-workspace.test.tsx`

**Step 1: Write the failing test**

- Require the city dossier to show:
  - mapped vs documented vs missing coverage
  - source coverage rows
  - transport/transit evidence from the Mobility Database when available
  - explicit coverage gaps when categories have no city evidence

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/features/city/components/city-workspace.test.tsx
```

Expected:
- Failure because the dossier does not yet expose those analyst sections.

**Step 3: Write minimal implementation**

- Reuse the same analyst coverage model used by the homepage rail.
- Add explicit gap rows instead of silent omission.

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/features/city/components/city-workspace.test.tsx
```

Expected:
- PASS

## Final Verification

Run:
```bash
npm test
```

Run:
```bash
npm run lint
```

Optional manual checks:
```bash
npm run data:cities
npm run data:cities:globe
npm run dev
```

Verify manually:
- Homepage left rail is city-first and analyst-useful.
- Source labels are visible anywhere evidence is claimed.
- Missing coverage is explicit instead of implied completeness.
- Mobility Database appears as a real transport/transit category when matched.
