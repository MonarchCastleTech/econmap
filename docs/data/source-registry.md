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

## Rules

- Every normalized observation must point to one source id from this registry.
- Derived series still need a source id. Use `mapfactbook-lab`.
- Manual timeline and bloc records use `manual-registry`.
- Boundary datasets use `geoboundaries`.
- `wto` remains only as a transitional compatibility id while the current mock trade layer is still in place.
