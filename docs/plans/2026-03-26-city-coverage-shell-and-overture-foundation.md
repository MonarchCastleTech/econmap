# City Coverage Shell And Overture Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make EconMap city-first at the artifact level by giving every city an explicit coverage shell and by registering Overture as the foundational global source stack for future category saturation.

**Architecture:** Extend the offline city artifact pipeline so it emits a per-city coverage shell alongside existing workspaces, then wire command-center logic and city dossier UI to consume that coverage state. In parallel, extend the dataset/source registry and analyst coverage logic so Overture Divisions, Places, Buildings, and Transportation become visible as real queued/public-source foundations rather than implicit research notes.

**Tech Stack:** TypeScript, Zod, Node file generation scripts, Vitest, Next.js React components.

---

### Task 1: Add per-city coverage shell artifacts

**Files:**
- Modify: `C:\Users\akgul\Downloads\EconMap\src\domain\city-schemas.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\scripts\data\cities\generate-artifacts.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\scripts\data\cities\generate-artifacts.test.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\lib\city-data.ts`

**Step 1: Write the failing test**

- Extend `generate-artifacts.test.ts` to expect a `coverage` output directory, per-city coverage shell JSON, and aggregate counts in the generated manifest.

**Step 2: Run test to verify it fails**

Run: `npm test -- scripts/data/cities/generate-artifacts.test.ts`
Expected: FAIL because coverage artifacts and manifest fields do not exist yet.

**Step 3: Write minimal implementation**

- Add Zod schemas for city coverage shell rows and summaries.
- Generate `src/data/generated/cities/coverage/<cityId>.json` for every city.
- Record aggregate city-shell stats in `manifest.json`.
- Add loader support in `city-data.ts`.

**Step 4: Run test to verify it passes**

Run: `npm test -- scripts/data/cities/generate-artifacts.test.ts`
Expected: PASS

### Task 2: Register Overture as the global base stack

**Files:**
- Modify: `C:\Users\akgul\Downloads\EconMap\scripts\data\cities\generate-globe-artifacts.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\scripts\data\cities\generate-globe-artifacts.test.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\lib\command-center-data.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\features\home\lib\analyst-sidebar-model.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\lib\command-center-data.test.ts`

**Step 1: Write the failing test**

- Extend the globe-artifact and command-center tests to expect `overture-divisions`, `overture-places`, `overture-buildings`, and `overture-transportation` in the dataset registry and as queued source labels for relevant analyst categories.

**Step 2: Run test to verify it fails**

Run: `npm test -- scripts/data/cities/generate-globe-artifacts.test.ts src/lib/command-center-data.test.ts`
Expected: FAIL because the Overture datasets are not registered yet.

**Step 3: Write minimal implementation**

- Add source-registry dataset seeds for Overture.
- Update analyst category definitions so roads, bridges, tunnels, hospitals, schools, police, fire, government facilities, warehouses, and city-boundary coverage point to Overture where appropriate.

**Step 4: Run test to verify it passes**

Run: `npm test -- scripts/data/cities/generate-globe-artifacts.test.ts src/lib/command-center-data.test.ts`
Expected: PASS

### Task 3: Surface the coverage shell in city dossiers

**Files:**
- Modify: `C:\Users\akgul\Downloads\EconMap\src\domain\command-center-schemas.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\lib\command-center-data.ts`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\features\city\components\city-workspace.tsx`
- Modify: `C:\Users\akgul\Downloads\EconMap\src\features\city\components\city-workspace.test.tsx`

**Step 1: Write the failing test**

- Extend the city workspace test to expect explicit city-shell coverage stats and boundary/source-shell messaging in the dossier header or source audit section.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/city/components/city-workspace.test.tsx`
Expected: FAIL because the coverage shell UI is not rendered yet.

**Step 3: Write minimal implementation**

- Thread the generated coverage shell into the command-center city panel.
- Render city-shell coverage summary in the dossier with visible source-backed state.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/city/components/city-workspace.test.tsx`
Expected: PASS

### Task 4: Verify the slice end to end

**Files:**
- No new files expected beyond generated artifacts.

**Step 1: Run focused verification**

Run:
- `npm test -- scripts/data/cities/generate-artifacts.test.ts scripts/data/cities/generate-globe-artifacts.test.ts src/lib/command-center-data.test.ts src/features/city/components/city-workspace.test.tsx`
- `npx eslint src/domain/city-schemas.ts src/domain/command-center-schemas.ts src/lib/city-data.ts src/lib/command-center-data.ts src/features/home/lib/analyst-sidebar-model.ts src/features/city/components/city-workspace.tsx scripts/data/cities/generate-artifacts.ts scripts/data/cities/generate-globe-artifacts.ts`

**Step 2: Regenerate artifacts**

Run:
- `npm run data:cities:artifacts`
- `npm run data:cities:globe`

**Step 3: Run final build verification**

Run: `npm run build`
Expected: exit code `0`, with any residual pre-existing warnings called out explicitly.
