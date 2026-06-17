# MapFactbook Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the homepage and map interactions feel responsive on a normal laptop without breaking the city-first OSINT workflow or stripping source-backed product behavior.

**Architecture:** Keep the homepage server-driven, but stop serializing oversized selection artifacts into the client and stop rebuilding the entire map on same-route state changes. Shift the map to a boot-first asset strategy that uses lighter derived assets on initial load and only promotes heavier static assets when interaction depth warrants it.

**Tech Stack:** Next.js App Router, React 19, MapLibre GL JS, Vitest, generated static JSON/GeoJSON artifacts

---

### Task 1: Lock the bottlenecks into tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/features/home/components/tactical-map-2d.test.tsx`
- Modify: `src/lib/command-center-data.test.ts`

**Steps:**
1. Update homepage tests so the server contract expects a minimal city-selection payload instead of the full city-footprint catalog.
2. Add or adjust command-center data tests so featured cities can load from a lightweight derived artifact without touching the large search index on the blank homepage path.
3. Extend tactical map tests so they still prove city click navigation and hover behavior while allowing the map implementation to update in place.

### Task 2: Shrink homepage boot payload and cold render work

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/command-center-data.ts`
- Modify: `src/domain/command-center-schemas.ts`
- Modify: `src/domain/types.ts`

**Steps:**
1. Replace the full `cityFootprintCatalog` prop with a minimal selection-asset contract used by the homepage map.
2. Add a lightweight featured-city artifact loader in `command-center-data` and fall back only if the derived artifact is absent.
3. Keep source labels and featured-city defaults intact.

### Task 3: Stop remounting the map on city selection and layer toggles

**Files:**
- Modify: `src/features/home/components/tactical-map-2d.tsx`

**Steps:**
1. Split map creation from subsequent prop updates so MapLibre is mounted once per page visit.
2. Keep city hover/click behavior, selected-city highlighting, and base imagery switching correct.
3. Preserve the city-first selection workflow while removing same-route teardown/refetch churn.

### Task 4: Make layer loading boot-first and lighter

**Files:**
- Modify: `src/features/home/components/tactical-map-2d.tsx`
- Modify: `src/features/home/lib/layer-registry.ts`

**Steps:**
1. Load GeoJSON sources from static asset URLs instead of fetching/parsing full payloads on the main thread.
2. Use boot assets for initial layer activation where available.
3. Promote to heavier full assets only when zoom or city focus indicates deeper inspection.

### Task 5: Keep generated artifacts aligned

**Files:**
- Modify: `scripts/data/cities/generate-artifacts.ts`
- Modify: `scripts/data/cities/regenerate-homepage-artifacts.ts` if required by the new artifact output
- Generate: `src/data/generated/command-center/featured-cities.json`

**Steps:**
1. Emit a lightweight featured-city artifact during the existing offline generation flow.
2. Regenerate the derived artifact in the current workspace so the app actually runs on the optimized path.
3. Keep raw source packs out of the browser and ship only derived static assets.

### Task 6: Verify and summarize

**Files:**
- No code changes required

**Steps:**
1. Run focused Vitest coverage for the touched homepage/map/data modules.
2. Run production verification with `npm run build` if the environment permits it.
3. Report each optimization with the bottleneck, fix, files changed, and before/after evidence.
