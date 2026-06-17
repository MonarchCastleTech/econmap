# MapFactbook Homepage Recovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recover the homepage into a compact city-first OSINT workspace with a layer-first operator rail, visible-boundary city selection, and an immediately useful selected-city brief.

**Architecture:** The homepage is recovered before deeper product surfaces. The left rail becomes a strict operator console, the map remains the canonical selector, and the selected-city brief is rebuilt around source-backed intelligence sections. Dataset workspaces remain secondary and are no longer mixed into the homepage control flow.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, MapLibre GL, generated JSON/GeoJSON artifacts.

---

### Task 1: Rebuild The Homepage Operator Rail

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layers/layer-row.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/lib/layer-registry.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert:

- the left rail order is `Search`, `Active layers`, `Borders & Labels`, `Transport`, `Utilities`, `Connectivity`, `Environment`, `Economy / Institutions`, `City brief`
- `Focus cities` is not rendered
- `Product surfaces` is not rendered
- the bottom utility link is labeled `Dataset explorer`
- the sidebar still renders `Airports`, `Ports`, `Utilities`, `Connectivity`
- layer rows show `on` or `off`, a purpose line, source labels, and status
- the homepage no longer renders the top-right control cluster

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx
```

Expected: FAIL because the current homepage still includes focus-city content, product navigation, dataset rows in operational groups, and top-right HUD controls.

**Step 3: Write minimal implementation**

- remove focus-city and product-surface sections from the operator rail
- add the `Economy / Institutions` operator group
- make group rows use operational layer semantics only
- move dataset access to one small `Dataset explorer` utility link
- remove the top-right control cluster from the homepage stage
- make each layer row show on/off state, short purpose, source labels, and status

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx
```

Expected: PASS

### Task 2: Bind Selection To The Visible Map Surface

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/globe/generate-reference-layers.py`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/globe/generate-reference-layers.test.ts`

**Step 1: Write the failing tests**

Add tests that assert:

- selection targets only resolve from the visible `city-selection-source`
- generated reference layers keep meaningful cities such as Istanbul, Ankara, Antalya, Paris, London, Berlin, and Tbilisi
- district-scale noise is excluded from the main selection workflow

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/home/components/tactical-map-2d.test.tsx scripts/data/globe/generate-reference-layers.test.ts
```

Expected: FAIL if hidden or low-value selection geometry still leaks into the main workflow.

**Step 3: Write minimal implementation**

- keep one canonical rendered selection surface
- make hover and click query only that source
- tighten city curation in the generated selection assets if necessary

**Step 4: Run test to verify it passes**

Run:

```bash
python scripts/data/globe/generate-reference-layers.py
npx vitest run src/features/home/components/tactical-map-2d.test.tsx scripts/data/globe/generate-reference-layers.test.ts
```

Expected: PASS

### Task 3: Rebuild The Homepage Selected-City Brief

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/infos-panel.tsx`
- Create: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/city-brief-section.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert the homepage selected-city brief shows:

- population
- GDP / economy
- airports
- ports
- utilities
- telecom
- environment
- organizations
- visible source labels

Also assert the page does not render `Not covered` placeholder text when real fallback evidence exists.

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/home/components/home-shell.test.tsx src/features/home/components/layout/tactical-sidebar.test.tsx
```

Expected: FAIL because the current homepage brief is still too shallow.

**Step 3: Write minimal implementation**

- keep the `Infos` card small and scannable
- move the substantive city OSINT brief into the left rail
- prefer real fallback evidence and explicit source-backed absence semantics over empty placeholders

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/home/components/home-shell.test.tsx src/features/home/components/layout/tactical-sidebar.test.tsx
```

Expected: PASS

### Task 4: Unblock Missing Homepage Layer Families

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/unlocode-parser.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/ror-parser.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/unlocode-parser.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/ror-parser.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.test.ts`

**Step 1: Write the failing tests**

Add tests that assert transport, research, telecom, and environment inputs publish usable homepage surfaces or city brief sections.

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/cities/parsers/unlocode-parser.test.ts scripts/data/cities/parsers/ror-parser.test.ts scripts/data/cities/generate-globe-artifacts.test.ts src/lib/city-intel-enrichment.test.ts
```

Expected: FAIL where datasets are still present only as downloaded or empty workspaces.

**Step 3: Write minimal implementation**

- repair transport and research parsing
- publish or enrich homepage-facing outputs
- keep dataset workspaces secondary

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run scripts/data/cities/parsers/unlocode-parser.test.ts scripts/data/cities/parsers/ror-parser.test.ts scripts/data/cities/generate-globe-artifacts.test.ts src/lib/city-intel-enrichment.test.ts
```

Expected: PASS

### Task 5: Verification

**Step 1: Targeted homepage verification**

Run:

```bash
npx vitest run src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx src/features/home/components/tactical-map-2d.test.tsx
```

Expected: PASS

**Step 2: TypeScript verification**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 3: Manual browser verification**

Verify:

- left rail is compact on a normal laptop
- top-right is only the compact `Infos` card
- dataset inventory no longer dominates the homepage
- clicking a visible city boundary loads the correct city brief

## Workspace Note

This copy of the project does not currently include `.git` metadata, so commit steps from the standard workflow cannot be executed here. Verification and file-level reporting must be used instead.
