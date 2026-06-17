# MapFactbook City-First OSINT Recovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild MapFactbook into a city-first OSINT operating system where an analyst can select a meaningful city from the map, toggle real intelligence layers, and immediately see a complete source-backed city brief.

**Architecture:** The homepage, city workspace, and dataset workspaces must consume the same generated city-intelligence spine. The map becomes a selector over real visible city boundaries, the left rail becomes a true layer operator console, and every downloaded dataset must become either a live map layer, a city evidence feed, or both.

**Tech Stack:** Next.js App Router, React, TypeScript, MapLibre GL, Zod, Vitest, Python/GeoPandas publish scripts, generated JSON/GeoJSON static assets, local offline datasets only.

---

## Live Inspection Findings (2026-03-20)

Inspected routes:

- `/`
- `/city/geo-745044-istanbul`
- `/datasets`
- `/datasets/ookla`
- `/compare`
- `/dashboard`

Observed product gaps:

1. The homepage is still shell-first, not intelligence-first.
   The left rail mixes real live layers with dead-end dataset workspace links, while the map is not yet a decisive city selection surface.

2. City selection truth is inconsistent.
   The map draws one boundary set, but the selection logic has drifted between visible admin shapes and separate generated city-footprint assets. That creates wrong selections and destroys trust.

3. The left rail is not a real operator panel yet.
   Airports, ports, utilities, connectivity, environment, and economy are not exposed as an immediately understandable layer workflow.

4. The city brief is incomplete.
   The right-top `Infos` card shows useful items, but the homepage still does not answer: "What do I know about this city right now across economy, telecom, transport, utilities, environment, organizations, and sources?"

5. Dataset workspaces are mostly inventory pages, not analytical surfaces.
   Example: `Ookla` shows source-pack files and zero processed rows instead of a real city or map intelligence product.

6. Legacy product surfaces are detached.
   `compare`, `dashboard`, `rankings`, and `reports` still behave like the earlier macro-economics product rather than extensions of the OSINT operating model.

7. Data coverage is structurally under-published.
   Downloaded sources exist for OECD, Eurostat, Ookla, Aqueduct, Carbon Monitor, WHO, GLEIF, GHSL, and others, but most are not integrated into city briefs or live layer flows.

8. The map is visually acceptable, but not yet operationally trustworthy.
   It needs strict selection truth, layer discipline, zoom-gated rendering, and explicit coverage semantics.

## Non-Negotiable Product Rules

- No fabricated intelligence.
- Accepted dataset rows are enough evidence.
- Visible source labels everywhere.
- No runtime third-party APIs or backend data APIs.
- The homepage must be useful in under one minute for a first-time analyst.
- A city must be selectable from what the map visibly draws.
- Every downloaded dataset must surface somewhere usable in the product.
- The product is city-first. Shell and chrome are secondary.

## Target Product Shape

On first load:

- the homepage shows a dark tactical 2D map
- the user can search or click a meaningful city boundary directly on the map
- the left rail exposes real layer families and active overlays
- the top-right `Infos` card shows the selected city's immediate intelligence snapshot
- selecting a city opens a complete homepage brief and a deeper city workspace
- datasets are no longer "file inventory pages"; they become evidence providers and layer publishers

## Phase Order

1. Fix map selection truth
2. Rebuild the operator layer panel
3. Publish the missing datasets into usable layers and city evidence
4. Rebuild the homepage city brief
5. Rebuild the full city workspace as an OSINT dossier
6. Fold legacy macro surfaces into the same operating model
7. Optimize rendering and verification

---

### Task 1: Lock The Canonical City OSINT Contracts

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/domain/command-center-schemas.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/domain/types.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert:

```ts
expect(panel.workspace?.economicFactbook.some((metric) => metric.indicatorId === "gdp")).toBe(true)
expect(panel.workspace?.telecomIntel).toBeDefined()
expect(panel.workspace?.environmentIntel).toBeDefined()
expect(panel.workspace?.transportIntel).toBeDefined()
expect(panel.workspace?.coverageBoundaryType).toBe("admin_selection_surface")
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/lib/command-center-data.test.ts src/features/home/components/home-shell.test.tsx
```

Expected: FAIL because the selected-city contract does not yet require or assemble those OSINT sections.

**Step 3: Write minimal implementation**

- Add explicit city-brief sections to the schemas and types:
  - `economicIntel`
  - `transportIntel`
  - `utilitiesIntel`
  - `telecomIntel`
  - `environmentIntel`
  - `organizationIntel`
  - `coverageBoundaryType`
  - `sourceCoverageSummary`
- Update the command-center loader so the homepage and city workspace consume the same sectioned city brief structure.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/lib/command-center-data.test.ts src/features/home/components/home-shell.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/command-center-schemas.ts src/domain/types.ts src/lib/command-center-data.ts src/lib/command-center-data.test.ts src/features/home/components/home-shell.test.tsx
git commit -m "feat: define canonical city osint contracts"
```

---

### Task 2: Make Map Selection Use The Same Visible Boundaries The User Sees

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/globe/generate-reference-layers.py`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/globe/generate-reference-layers.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert:

```ts
expect(catalog.selectionAssetPath).toBe("/data/globe/reference/city-footprints/selectable.geojson")
expect(catalog.cities.find((city) => city.slug === "geo-323786-ankara")?.sourceLabel).toBe("Natural Earth Admin1")
expect(extractCityTarget(feature)?.slug).toBe("geo-323786-ankara")
```

Also add a map test that asserts hover/click only resolves cities from the visible selection source, not a hidden fallback geometry.

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/globe/generate-reference-layers.test.ts src/features/home/components/tactical-map-2d.test.tsx
```

Expected: FAIL if selection logic is still drifting between drawn admin boundaries and separate footprint sources.

**Step 3: Write minimal implementation**

- Make `generate-reference-layers.py` produce one canonical selection surface from the same Natural Earth admin shapes used for rendering.
- Keep smoothing/simplification, but only on the exact selection geometry being rendered.
- Remove any hidden alternate boundary used only for hit testing.
- Make `tactical-map-2d.tsx` bind hover and click to that same rendered source.
- Label the geometry honestly:
  - `admin_selection_surface`
  - not generic `city footprint` when it is really admin-based.

**Step 4: Run test to verify it passes**

Run:

```bash
python scripts/data/globe/generate-reference-layers.py
npx vitest run scripts/data/globe/generate-reference-layers.test.ts src/features/home/components/tactical-map-2d.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/globe/generate-reference-layers.py src/features/home/components/tactical-map-2d.tsx src/lib/command-center-data.ts scripts/data/globe/generate-reference-layers.test.ts src/features/home/components/tactical-map-2d.test.tsx public/data/globe/reference/city-footprints
git commit -m "fix: bind city selection to visible map boundaries"
```

---

### Task 3: Rebuild The Left Rail Into A True Layer Operator Panel

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layers/layer-row.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/lib/layer-registry.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert the rail renders these groups in this order:

```ts
[
  "Search",
  "Active layers",
  "Borders & Labels",
  "Transport",
  "Utilities",
  "Connectivity",
  "Environment",
  "City brief",
]
```

And each real live layer row has:

```ts
expect(screen.getByText("Airports")).toBeInTheDocument()
expect(screen.getByText("Ports")).toBeInTheDocument()
expect(screen.getByText("Utilities")).toBeInTheDocument()
expect(screen.getByText("Connectivity")).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx
```

Expected: FAIL because the current rail still mixes dataset workspace rows and layer semantics.

**Step 3: Write minimal implementation**

- Separate `live layer toggles` from `dataset workspace links`.
- Promote live categories to operator-first families:
  - Borders & Labels
  - Transport
  - Utilities
  - Connectivity
  - Environment
  - Economy / Institutions
- Move dataset explorer entry into a small utility section at the bottom.
- Keep Inter as the dominant typography and remove decorative explanatory text that hides the useful controls.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/home/components/layout/tactical-sidebar.tsx src/features/home/components/layers/layer-row.tsx src/features/home/components/home-shell.tsx src/features/home/lib/layer-registry.ts src/features/home/components/layout/tactical-sidebar.test.tsx src/features/home/components/home-shell.test.tsx
git commit -m "feat: turn left rail into operator layer panel"
```

---

### Task 4: Recover The Broken Transport And Institution Pipelines

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/unlocode-parser.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/ror-parser.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-artifacts.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/unlocode-parser.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/parsers/ror-parser.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.test.ts`

**Step 1: Write the failing tests**

Add tests asserting:

```ts
expect(parsedUnlocodeEntities.length).toBeGreaterThan(0)
expect(parsedResearchOrganizations.length).toBeGreaterThan(0)
expect(datasetInventory.find((item) => item.id === "un-locode")?.status).toBe("published_to_website")
expect(datasetInventory.find((item) => item.id === "research-organizations-registry")?.status).toBe("published_to_website")
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/cities/parsers/unlocode-parser.test.ts scripts/data/cities/parsers/ror-parser.test.ts scripts/data/cities/generate-globe-artifacts.test.ts
```

Expected: FAIL because both datasets are currently `processed_without_data`.

**Step 3: Write minimal implementation**

- Fix UN/LOCODE parsing and normalization so accepted rows publish into:
  - ports
  - logistics hubs
  - rail hubs
- Fix ROR parsing and city linking so research entities publish into:
  - city bundles
  - map layer
  - city brief organization section
- Update the globe artifact generator so these datasets graduate from empty workspaces into actual product surfaces.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run scripts/data/cities/parsers/unlocode-parser.test.ts scripts/data/cities/parsers/ror-parser.test.ts scripts/data/cities/generate-globe-artifacts.test.ts
npx tsc --noEmit
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/cities/parsers/unlocode-parser.ts scripts/data/cities/parsers/ror-parser.ts scripts/data/cities/generate-artifacts.ts scripts/data/cities/generate-globe-artifacts.ts scripts/data/cities/parsers/unlocode-parser.test.ts scripts/data/cities/parsers/ror-parser.test.ts scripts/data/cities/generate-globe-artifacts.test.ts
git commit -m "fix: publish transport and research pipelines"
```

---

### Task 5: Publish Connectivity Layers From Ookla And Mobility

**Files:**
- Create: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-connectivity-artifacts.py`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/lib/layer-registry.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-connectivity-artifacts.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.test.ts`

**Step 1: Write the failing tests**

Add tests asserting:

```ts
expect(globeManifest.layers.some((layer) => layer.id === "connectivity-fixed")).toBe(true)
expect(globeManifest.layers.some((layer) => layer.id === "connectivity-mobile")).toBe(true)
expect(cityPanel.workspace?.urbanIntel.some((metric) => metric.indicatorId === "fixed-download-mbps")).toBe(true)
expect(cityPanel.workspace?.urbanIntel.some((metric) => metric.indicatorId === "mobile-download-mbps")).toBe(true)
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/cities/generate-connectivity-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx src/lib/city-intel-enrichment.test.ts
```

Expected: FAIL because Ookla and mobility data are still dataset workspaces rather than live overlays or city metrics.

**Step 3: Write minimal implementation**

- Generate tiled or region-sharded connectivity artifacts from Ookla and mobility sources.
- Publish:
  - a fixed broadband layer
  - a mobile broadband layer
  - city-level telecom metrics for the brief
- Register those layers in the layer catalog and render them with zoom gating.

**Step 4: Run test to verify it passes**

Run:

```bash
python scripts/data/cities/generate-connectivity-artifacts.py
npx vitest run scripts/data/cities/generate-connectivity-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx src/lib/city-intel-enrichment.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/cities/generate-connectivity-artifacts.py scripts/data/cities/generate-globe-artifacts.ts src/features/home/lib/layer-registry.ts src/features/home/components/tactical-map-2d.tsx src/lib/city-intel-enrichment.ts scripts/data/cities/generate-connectivity-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx src/lib/city-intel-enrichment.test.ts
git commit -m "feat: publish connectivity overlays and city telecom metrics"
```

---

### Task 6: Publish Environment Layers And City Environmental Metrics

**Files:**
- Create: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-environment-artifacts.py`
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/lib/layer-registry.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-environment-artifacts.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.test.ts`

**Step 1: Write the failing tests**

Add tests asserting:

```ts
expect(globeManifest.layers.some((layer) => layer.id === "air-quality")).toBe(true)
expect(globeManifest.layers.some((layer) => layer.id === "water-stress")).toBe(true)
expect(cityPanel.workspace?.urbanIntel.some((metric) => metric.indicatorId === "pm25")).toBe(true)
expect(cityPanel.workspace?.urbanIntel.some((metric) => metric.indicatorId === "water-stress")).toBe(true)
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/cities/generate-environment-artifacts.test.ts src/lib/city-intel-enrichment.test.ts
```

Expected: FAIL because WHO, Aqueduct, Carbon Monitor, and JRC are not yet transformed into live environmental surfaces.

**Step 3: Write minimal implementation**

- Generate environment overlays from:
  - WHO Air Quality
  - WRI Aqueduct
  - Carbon Monitor
  - JRC Global Surface Water
- Publish the city-level metrics into the selected city brief.
- Make environmental layers visible and togglable in the left rail.

**Step 4: Run test to verify it passes**

Run:

```bash
python scripts/data/cities/generate-environment-artifacts.py
npx vitest run scripts/data/cities/generate-environment-artifacts.test.ts src/lib/city-intel-enrichment.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/cities/generate-environment-artifacts.py scripts/data/cities/generate-globe-artifacts.ts src/lib/city-intel-enrichment.ts src/features/home/lib/layer-registry.ts src/features/home/components/tactical-map-2d.tsx scripts/data/cities/generate-environment-artifacts.test.ts src/lib/city-intel-enrichment.test.ts
git commit -m "feat: publish environment overlays and city environment brief"
```

---

### Task 7: Publish Economic And Institutional City Brief Coverage For All Major Cities

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-city-intel-enrichment.py`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.ts`
- Create: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-economic-coverage-artifacts.py`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/city-intel-enrichment.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.test.ts`

**Step 1: Write the failing tests**

Add tests that assert:

```ts
expect(panel.workspace?.economicFactbook.some((metric) => metric.indicatorId === "gdp-current-ppp")).toBe(true)
expect(panel.workspace?.economicFactbook.some((metric) => metric.indicatorId === "employment")).toBe(true)
expect(panel.workspace?.investorIntel.some((metric) => metric.indicatorId === "company-presence")).toBe(true)
expect(panel.workspace?.sourceSummary.some((item) => item.value.includes("estimate"))).toBe(false)
```

For at least the featured city set:

- Istanbul
- Ankara
- Rome
- Paris
- London
- Berlin
- Madrid
- Washington

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/lib/city-intel-enrichment.test.ts src/lib/command-center-data.test.ts
```

Expected: FAIL because GDP and economic coverage is still mixed between real coverage and country proxy fallback.

**Step 3: Write minimal implementation**

- Expand enrichment generation using:
  - OECD
  - Eurostat
  - World Bank
  - GLEIF
- Promote actual city/FUA economics and organization coverage for the featured city set and all major cities where the sources support it.
- Keep the proxy path as a fallback, but do not show it as the primary info when real city coverage exists.

**Step 4: Run test to verify it passes**

Run:

```bash
python scripts/data/cities/generate-city-intel-enrichment.py
python scripts/data/cities/generate-economic-coverage-artifacts.py
npx vitest run src/lib/city-intel-enrichment.test.ts src/lib/command-center-data.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/cities/generate-city-intel-enrichment.py scripts/data/cities/generate-economic-coverage-artifacts.py src/lib/city-intel-enrichment.ts src/lib/command-center-data.ts src/lib/city-intel-enrichment.test.ts src/lib/command-center-data.test.ts
git commit -m "feat: expand real economic and institutional city coverage"
```

---

### Task 8: Rebuild The Homepage Selected-City Brief Into A Real OSINT Surface

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/infos-panel.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.tsx`
- Create: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/city-brief-section.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/home-shell.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/layout/tactical-sidebar.test.tsx`

**Step 1: Write the failing tests**

Add tests asserting that selecting Istanbul shows, on the homepage:

```ts
[
  "Population",
  "GDP",
  "Airports",
  "Ports",
  "Utilities",
  "Telecom",
  "Environment",
  "Organizations",
  "Visible source labels",
]
```

And for an uncovered field:

```ts
expect(screen.queryByText("Not covered")).not.toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/home/components/home-shell.test.tsx src/features/home/components/layout/tactical-sidebar.test.tsx
```

Expected: FAIL because the current homepage brief still exposes only a partial subset.

**Step 3: Write minimal implementation**

- Make the homepage selected-city section read like an OSINT starter brief:
  - city identity
  - population / GDP
  - airports / ports / rail / logistics / utilities
  - telecom quality
  - air/water/environment
  - institution / company signals
  - source coverage and confidence
- Keep the top-right `Infos` block small, but make the left-rail selected city section decisive.
- Replace all empty placeholder language with explicit low-coverage metrics or absence semantics.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/home/components/home-shell.test.tsx src/features/home/components/layout/tactical-sidebar.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/home/components/home-shell.tsx src/features/home/components/layout/infos-panel.tsx src/features/home/components/layout/tactical-sidebar.tsx src/features/home/components/layout/city-brief-section.tsx src/features/home/components/home-shell.test.tsx src/features/home/components/layout/tactical-sidebar.test.tsx
git commit -m "feat: turn homepage into city-first osint brief"
```

---

### Task 9: Rebuild The City Workspace As A Full OSINT Dossier

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/city/components/city-workspace.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/app/city/[slug]/page.tsx`
- Create: `C:/Users/akgul/Downloads/EconMap/src/features/city/components/osint-dossier-section.tsx`
- Create: `C:/Users/akgul/Downloads/EconMap/src/features/city/components/layer-evidence-table.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/city/components/city-workspace.test.tsx`

**Step 1: Write the failing tests**

Add tests asserting the city workspace renders sections for:

```ts
[
  "Economic Factbook",
  "Transport & Logistics",
  "Utilities & Energy",
  "Telecom & Connectivity",
  "Environment",
  "Organizations & Assets",
  "Source Audit",
]
```

And that it no longer behaves like a generic metric dump.

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/city/components/city-workspace.test.tsx
```

Expected: FAIL because the current page is still a partial workspace, not a full dossier.

**Step 3: Write minimal implementation**

- Turn the city page into the deeper version of the homepage brief.
- Group evidence by analytical job, not by whatever source generated it.
- Add direct source audit visibility and city-level evidence tables.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/city/components/city-workspace.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/city/components/city-workspace.tsx src/app/city/[slug]/page.tsx src/features/city/components/osint-dossier-section.tsx src/features/city/components/layer-evidence-table.tsx src/features/city/components/city-workspace.test.tsx
git commit -m "feat: rebuild city workspace as osint dossier"
```

---

### Task 10: Turn Dataset Workspaces Into Analytical Surfaces Instead Of File Inventories

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/datasets/components/dataset-workspace-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/datasets/components/dataset-catalog-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/datasets/components/dataset-workspace-page.test.tsx`

**Step 1: Write the failing tests**

Add tests asserting that dataset pages show:

```ts
[
  "Website surfaces",
  "Processed evidence",
  "City coverage",
  "Layer availability",
  "Source pack",
  "Open related cities",
]
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/datasets/components/dataset-workspace-page.test.tsx
```

Expected: FAIL because current pages are mostly file inventory and pipeline status.

**Step 3: Write minimal implementation**

- For each dataset workspace, add:
  - linked cities
  - linked layers
  - accepted row counts
  - coverage regions
  - "where this shows up in the product"
- Stop using dataset pages as dead-end technical inventory.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/datasets/components/dataset-workspace-page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/datasets/components/dataset-workspace-page.tsx src/features/datasets/components/dataset-catalog-page.tsx src/lib/command-center-data.ts src/features/datasets/components/dataset-workspace-page.test.tsx
git commit -m "feat: turn dataset workspaces into analytical surfaces"
```

---

### Task 11: Reposition Compare, Dashboard, Rankings, And Reports Around The Same OSINT Spine

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/compare/components/compare-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/dashboard/components/dashboard-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/rankings/components/rankings-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/reports/components/reports-page.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/lib/command-center-data.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/compare/components/compare-page.test.tsx`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/dashboard/components/dashboard-page.test.tsx`

**Step 1: Write the failing tests**

Add tests asserting:

```ts
expect(screen.getByText("Selected cities")).toBeInTheDocument()
expect(screen.getByText("OSINT compare set")).toBeInTheDocument()
expect(screen.getByText("Infrastructure watchlist")).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/compare/components/compare-page.test.tsx src/features/dashboard/components/dashboard-page.test.tsx
```

Expected: FAIL because those routes still reflect the legacy macro product.

**Step 3: Write minimal implementation**

- Reframe:
  - `compare` as city/country intelligence comparison
  - `dashboard` as saved OSINT watchlists
  - `rankings` as evidence-backed ranking tables
  - `reports` as analyst output built from the same city spine
- Use one shared selection and saved-watchlist model.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/compare/components/compare-page.test.tsx src/features/dashboard/components/dashboard-page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/compare/components/compare-page.tsx src/features/dashboard/components/dashboard-page.tsx src/features/rankings/components/rankings-page.tsx src/features/reports/components/reports-page.tsx src/lib/command-center-data.ts src/features/compare/components/compare-page.test.tsx src/features/dashboard/components/dashboard-page.test.tsx
git commit -m "feat: align legacy surfaces with osint operating model"
```

---

### Task 12: Optimize Rendering, Layer Sharding, And Verification

**Files:**
- Modify: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.ts`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.tsx`
- Modify: `C:/Users/akgul/Downloads/EconMap/src/features/home/lib/layer-registry.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/scripts/data/cities/generate-globe-artifacts.test.ts`
- Test: `C:/Users/akgul/Downloads/EconMap/src/features/home/components/tactical-map-2d.test.tsx`

**Step 1: Write the failing tests**

Add tests asserting:

```ts
expect(layer.bootFeatureCount).toBeLessThan(layer.featureCount!)
expect(layer.assetPath).toContain("/shards/")
expect(renderedVisibleLayers).not.toContain("all-features-on-boot")
```

**Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run scripts/data/cities/generate-globe-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx
```

Expected: FAIL because the map still treats some large datasets too monolithically.

**Step 3: Write minimal implementation**

- Shard dense layers by zoom and region.
- Keep the homepage boot clean.
- Render only active layers and only for visible regions.
- Add a final verification pass for:
  - homepage city selection
  - city workspace
  - datasets
  - compare/dashboard

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run scripts/data/cities/generate-globe-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx
npx tsc --noEmit
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/data/cities/generate-globe-artifacts.ts src/features/home/components/tactical-map-2d.tsx src/features/home/lib/layer-registry.ts scripts/data/cities/generate-globe-artifacts.test.ts src/features/home/components/tactical-map-2d.test.tsx
git commit -m "perf: shard map layers and harden verification"
```

---

## Final Verification Checklist

After all tasks are implemented, verify:

1. Homepage:
   - click Istanbul, Ankara, Paris, Rome, London, Berlin directly from visible map boundaries
   - layer toggles for Airports, Ports, Utilities, Connectivity, Environment work
   - selected city brief shows population, GDP, transport, utilities, telecom, environment, and sources

2. City workspace:
   - major cities open a full dossier with grouped intelligence sections
   - no fake data
   - no `Not covered` placeholders for fields that can be satisfied by real data

3. Dataset workspaces:
   - every local dataset has a usable analytical page
   - every dataset either powers a layer, powers a city brief section, or both

4. Legacy surfaces:
   - compare, dashboard, rankings, reports are tied to the same OSINT spine

5. Technical:
   - `npx vitest run`
   - `npx tsc --noEmit`
   - manual browser verification on the key routes

## Success Definition

MapFactbook is only "recovered" when:

- the homepage is city-first
- the visible map boundaries are the actual selection surface
- the left rail works like an operator's layer console
- every downloaded dataset is usable somewhere real
- a selected city immediately yields a coherent OSINT brief
- the city workspace deepens that brief instead of repeating random counts
- legacy macro pages stop feeling like a separate product

Plan complete and saved to `docs/plans/2026-03-20-mapfactbook-city-first-osint-recovery.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
