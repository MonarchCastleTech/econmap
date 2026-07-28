# MapFactbook Source Registry

This registry is the contract layer between provider fetchers and UI-facing normalized datasets.

## Active source ids

| Source ID | Role | Status support | Notes |
| --- | --- | --- | --- |
| `world-bank` | core actual annual global indicators | `actual` | primary source for macro, infrastructure, and several sustainability series |
| `imf-weo` | macro estimates and forecasts | `actual`, `estimate`, `forecast` | preferred for debt and forward macro paths |
| `ilo` | labor market series | `actual`, `estimate` | unemployment and participation |
| `undesa` | demographics and projections | `actual`, `forecast` | population, fertility, age structure |
| `wto` | transitional trade totals source | `actual`, `estimate` | keep only until Comtrade cutover is complete |
| `un-comtrade` | bilateral trade and commodities | `actual` | partner and commodity detail |
| `iea-demo` | temporary seeded energy layer | `actual`, `forecast`, `derived` | to be replaced gradually by official energy sources |
| `world-bank-enterprise-surveys` | business environment inputs | `actual` | partial coverage, useful for composites |
| `world-bank-pip` | poverty and inequality inputs | `actual` | sparse but credible |
| `nd-gain` | climate vulnerability input | `actual` | optional for risk composites pending fit |
| `geoboundaries` | country and ADM1 geometry | `geometry` | boundary source, not an indicator source |
| `mapfactbook-lab` | internal derived layer | `estimate`, `forecast`, `manual`, `derived` | scenarios and transparent composites only |
| `manual-registry` | curated static records | `manual` | blocs, event timeline, reviewed registries |

## City intelligence source contracts

| Source ID | Coverage | Access in this workspace | Evidence rule |
| --- | --- | --- | --- |
| `ookla-open-data` | global fixed/mobile performance | local bulk snapshot | measured speed is not 5G coverage |
| `mlab-ndt` | global user-initiated network tests | Google Cloud credentials | publish sample counts; absence is unknown |
| `ripe-atlas` | global probe reachability/path quality | normalized local snapshot | probe density is uneven |
| `fcc-bdc` | United States provider-reported broadband | manual official download | technology coverage may support regulator-confirmed 5G |
| `gsma-coverage` | global operator-submitted mobile coverage | licensed | do not publish geometry without clearance |
| `ghsl-urban-centres` | global urban-centre geometry/population | official local package | satellite/census-derived urban geography |
| `openaq` | global station air quality | API key | no matched station means unknown, not clean air |
| `nasa-firms` | global active-fire detections | map key | no detection does not prove no fire |
| `usgs-earthquakes` | global earthquakes | public API, active | authoritative event observation matched by distance |

The generated `public/data/cities/source-contracts.json` records scope, cadence, methodology, gap reason,
snapshot path, and access mode. Runtime availability is published in `intelligence.json`. Current refreshes
only emit observations for sources with a normalized local snapshot; unavailable, credentialed, manual, and
licensed sources remain explicit states.

Normalized source snapshots are JSON objects with `observations` and `geographies` arrays conforming to
`src/domain/city-intelligence-schemas.ts`. Every observation requires a canonical `cityId`, topic, state,
value/unit, evidence kind, source ID/URL, ISO timestamp, methodology, and confidence.

## Rules

- Every normalized observation must point to one source id from this registry.
- Derived series still need a source id. Use `mapfactbook-lab`.
- Manual timeline and bloc records use `manual-registry`.
- Boundary datasets use `geoboundaries`.
- `wto` remains only as a transitional compatibility id while the current mock trade layer is still in place.
- Performance observations never imply radio technology. A 5G/NR coverage observation requires
  `regulator_reported` or `operator_reported` evidence.
