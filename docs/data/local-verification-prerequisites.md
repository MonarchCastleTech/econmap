# Local verification prerequisites

EconMap does not fabricate substitute rows when reviewed World Bank, Natural
Earth, or city-pipeline artifacts are absent. The application’s generated and
bulk datasets are intentionally ignored by Git because the complete local
pipeline is large.

Before a full production build, reproduce the required artifacts:

```shell
npm ci
npm run data:generate-core
npm run data:cities:download-bulk -- --optional
npm run data:cities
npm test
npm run lint
npm run build
```

The commands consume the source URLs encoded in
[`scripts/data/generate-world-bank-core.ts`](../../scripts/data/generate-world-bank-core.ts)
and
[`scripts/data/cities/download-bulk-sources.mjs`](../../scripts/data/cities/download-bulk-sources.mjs).
The optional bulk download includes the Natural Earth administrative,
populated-place, and urban-area shapefiles required by the reference-layer
generator. Source licensing and redistribution boundaries remain governed by
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

`npm run verify:data-prereqs` and the `prebuild` hook list every missing
generated artifact and stop. This is deliberate: do not create placeholder
World Bank observations, empty geometry, invented city records, or synthetic
provenance to make verification pass.

On 2026-07-18 the repository checkout lacked its ignored generated artifacts.
The documented World Bank regeneration was attempted, but the official API
returned HTTP `400` for `PA.NUS.FCRF` after earlier indicators had been
requested. No partial snapshot was written. Retry against the official API
before a release build; do not bypass the failed source.
