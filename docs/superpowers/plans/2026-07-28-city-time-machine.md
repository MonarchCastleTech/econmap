# City Time Machine and Evidence Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add temporal, geography-aware, source-attributed city monitoring, telecom evidence tiers, network observations, hazards, and watchlist alerts to EconMap.

**Architecture:** Extend the existing Zod domain boundary with normalized temporal observations and generated deltas. Build compact static artifacts at publish time, load them beside the range-addressable city dossiers, and render dense analyst panels in the existing OSINT console.

**Tech Stack:** TypeScript, Zod, React 19, Next.js static export, Zustand, Vitest, Testing Library, Python source adapters, PMTiles/GeoJSON where spatial layers are available.

## Global Constraints

- No mobile-speed observation may prove 5G.
- Missing source files, credentials, or licences produce explicit unavailable states.
- Every published observation carries source, time, methodology, geography, and confidence.
- The production site remains a static export.
- Existing canonical city identity and district exclusion rules remain unchanged.
- Public artifact growth must remain inside the existing data-audit budget.

---

### Task 1: Temporal Intelligence Domain

**Files:**
- Create: `src/domain/city-intelligence-schemas.ts`
- Create: `src/domain/city-intelligence-schemas.test.ts`

**Interfaces:**
- Produces: `cityObservationSchema`, `cityDeltaSchema`, `cityAlertSchema`,
  `cityIntelligenceBundleSchema`, `telecomEvidenceTierSchema`.

- [ ] Write failing schema tests for valid observations and invalid generic-speed 5G evidence.
- [ ] Run `npm test -- src/domain/city-intelligence-schemas.test.ts` and confirm RED.
- [ ] Implement schemas and the `deriveTelecomEvidenceTier()` pure function.
- [ ] Re-run the focused test and confirm GREEN.

### Task 2: Deterministic Delta and Alert Engine

**Files:**
- Create: `scripts/data/cities/intelligence/delta-engine.ts`
- Create: `scripts/data/cities/intelligence/delta-engine.test.ts`
- Create: `scripts/data/cities/build-city-intelligence.ts`

**Interfaces:**
- Consumes: normalized city observations.
- Produces: `diffCityObservations(previous, current, now)` and public
  `city-intelligence.json` / `city-alerts.json` artifacts.

- [ ] Write failing tests for added, changed, removed, expired, stable, and sorted output.
- [ ] Run the focused test and confirm RED.
- [ ] Implement stable observation keys, comparison, severity, and alert summaries.
- [ ] Re-run focused tests and confirm GREEN.

### Task 3: Source Availability and Adapters

**Files:**
- Create: `scripts/data/cities/intelligence/source-adapters.ts`
- Create: `scripts/data/cities/intelligence/source-adapters.test.ts`
- Modify: `scripts/data/cities/source-catalog.ts`
- Modify: `docs/data/source-registry.md`

**Interfaces:**
- Produces: source contracts for Ookla, M-Lab, RIPE Atlas, FCC BDC, GSMA,
  GHSL, OpenAQ, NASA FIRMS, and USGS.

- [ ] Write failing tests for available, missing-file, credential-required, and licensed states.
- [ ] Run focused tests and confirm RED.
- [ ] Implement adapters that normalize present local snapshots and publish honest unavailable states otherwise.
- [ ] Re-run focused tests and confirm GREEN.

### Task 4: Client Loaders and Watchlist Alerts

**Files:**
- Create: `src/lib/city-intelligence-client.ts`
- Create: `src/lib/city-intelligence-client.test.ts`
- Create: `src/features/osint/lib/watchlist-alerts.ts`
- Create: `src/features/osint/lib/watchlist-alerts.test.ts`

**Interfaces:**
- Produces: `loadCityIntelligence()`, `loadCityAlerts()`,
  `alertsForWatchlist(alerts, cityIds)`.

- [ ] Write failing fetch, parse, cache, filtering, and ordering tests.
- [ ] Run focused tests and confirm RED.
- [ ] Implement static artifact readers and pure watchlist filtering.
- [ ] Re-run focused tests and confirm GREEN.

### Task 5: City Time Machine UI

**Files:**
- Create: `src/features/osint/components/city-time-machine.tsx`
- Create: `src/features/osint/components/city-time-machine.test.tsx`
- Create: `src/features/osint/components/city-evidence-panel.tsx`
- Create: `src/features/osint/components/city-evidence-panel.test.tsx`
- Modify: `src/features/osint/components/osint-console.tsx`

**Interfaces:**
- Consumes: `CityIntelligenceBundle`.
- Produces: accessible evidence, history, geography, and operational alert sections.

- [ ] Write failing tests for evidence labels, unknown 5G, history, hazards, and empty states.
- [ ] Run focused component tests and confirm RED.
- [ ] Implement dense responsive panels using existing OSINT visual conventions.
- [ ] Re-run focused tests and confirm GREEN.

### Task 6: Pipeline and Release Integration

**Files:**
- Modify: `package.json`
- Modify: `scripts/data/cities/copy-to-public.ts`
- Modify: `scripts/data/audit-data.mjs`
- Modify: `.planning/REQUIREMENTS.md`
- Modify: `.planning/ROADMAP.md`
- Modify: `.planning/STATE.md`

**Interfaces:**
- Produces: one-command intelligence generation and audited public artifacts.

- [ ] Add package scripts and pipeline invocation.
- [ ] Generate artifacts from locally available sources.
- [ ] Run focused tests, full tests, typecheck, lint, data audit, and production build.
- [ ] Run desktop/mobile browser verification for Bursa and a baseline-only city.
- [ ] Record measured outcomes and any source-unavailable states in planning documents.
