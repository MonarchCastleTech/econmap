# MapFactbook

MapFactbook is a premium dark-by-default economic intelligence web app built from the orchestration prompt stack in this workspace:

- `orchestrate.md` controls execution order and phase selection
- `prompt.md` defines the full product vision
- `mvp.md` defines the MVP slice
- `data.md` defines the advanced intelligence/data slice
- `premium.md` defines the polish and demo-readiness pass
- `upgrade.md` defines the final hardening pass

This implementation is a fresh-build Mode A run of that phased spec.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- MapLibre GL JS
- Recharts
- Prisma + SQLite
- Zod
- Vitest + Testing Library

## What Is Implemented

### Production-like structure

- Schema-driven domain models for countries, observations, trade flows, forecasts, historical events, blocs, dashboards, and watchlists
- Real World Bank-backed annual observations for the current covered country set, plus transparent derived metrics such as GDP per capita and business climate
- Normalized indicator, forecast, bloc, historical-event, and showcase ADM1 datasets separated from legacy compatibility modules
- Home route with map-first analyst shell, filters, URL-synced view state, and country drawer
- Country factbook route with overview, trade, demographics, risk, forecast, and methodology tabs
- Compare route with persisted country selections, normalized comparison logic, radar and bar charts, and CSV export
- Rankings route with metric switching and CSV export
- Indicator library route grouped by category
- Dashboard, reports, story mode, and region drill-down routes with seeded demo content
- Transparent risk, similarity, compare, forecast, formatting, and export utility layers
- Prisma schema and seed script for future saved dashboards/watchlists

### Demo-backed or scaffolded

- Map interaction uses country points and lightweight map layers rather than full world polygons
- Forecasts, risk scores, and business climate are derived inside the app from source-backed historical observations
- Trade partner flows, report narratives, dashboards, story mode, and ADM1 coverage still include scaffolded/demo surfaces
- Watchlists persist in local storage; database persistence is scaffolded via Prisma schema and seed data but not fully wired into runtime APIs
- Chart image/PDF export is not fully wired; CSV export is implemented

## Explicitly Excluded

News is excluded by design. There are no news feeds, headlines, article cards, breaking-news widgets, or external news integrations.

## Routes

- `/`
- `/country/[slug]`
- `/regions/[slug]`
- `/compare`
- `/rankings`
- `/indicators`
- `/dashboard`
- `/story-mode`
- `/reports`

## Local Development

1. Install dependencies

```bash
npm install
```

2. Copy environment values

```bash
copy .env.example .env
```

3. Generate the Prisma client

```bash
npm run prisma:generate
```

4. Optional: seed the SQLite database with saved dashboard/watchlist examples

```bash
npm run prisma:seed
```

5. Run the app

```bash
npm run dev
```

6. Refresh the checked-in real-data snapshot

```bash
npm run data:generate-core
```

7. Generate the global city data pipeline

```bash
npm run data:cities
```

Open [http://localhost:3000](http://localhost:3000).

## City Data Pipeline

MapFactbook includes a standalone pipeline for resolving and analyzing global cities, scaling up to every city in the world. 

The pipeline runs sequentially:
1. **Registry Ingestion**: Establishes a canonical worldwide city record (sources from known datasets, with local fallback).
2. **Source Fetching**: Pulls verified facts about city economies and entity presence.
3. **Entity Resolution**: Converts raw facts into standard schemas, capturing precise locations or city-wide presence footprints.
4. **Artifact Generation**: Outputs app-ready JSON components and GeoJSON layers directly into `src/data/generated/cities`.

Run the pipeline using `npm run data:cities`.

## Verification

Current verification commands:

```bash
npx vitest run
npm run lint
npm run build
```

## Architecture Notes

- `src/domain` contains Zod schemas and inferred domain types.
- `src/data/generated/world-bank-core.json` contains the checked-in World Bank snapshot used for the current annual country observations.
- `src/data/normalized` contains the stable app-facing datasets for countries, indicators, forecasts, blocs, events, and showcase ADM1 coverage.
- `src/data/mock` is now a thin compatibility layer for legacy imports while the rest of the provider migration continues.
- `src/features` contains route-level product slices such as home, country, compare, rankings, forecast, risk, and similarity.
- `src/components` contains shared layout, chart, state, and data display components.
- `src/lib` contains selectors, URL-state helpers, export helpers, formatting, and mock AI/provider stubs.
- `src/store` contains UI state and watchlist persistence.

## Future Real-Data Integration Points

- Replace `src/data/mock/*` with provider adapters that satisfy the same domain contracts.
- Add runtime APIs backed by Prisma for watchlists, dashboards, reports, and saved compare sets.
- Swap country points for full country and ADM1 polygon sources.
- Replace forecast, risk, and AI insight stubs with provider-backed services while preserving current schemas and UI contracts.

## Known Limitations

- The map currently emphasizes point-based interaction instead of polygon choropleths.
- Trade-flow arcs, PDF export, and dashboard layout persistence are not yet full production implementations.
- The subnational layer covers showcase countries only.
- Core annual country observations are source-backed snapshots, not live runtime API reads. Trade partner detail and several advanced modules remain scaffolded.
