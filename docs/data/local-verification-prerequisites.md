# Local verification prerequisites

EconMap does not fabricate substitute rows when reviewed World Bank, Natural
Earth, or city-pipeline artifacts are absent. The application’s generated and
bulk datasets are intentionally ignored by Git because the complete local
pipeline is large.

Before a full production build, reproduce the required artifacts:

```shell
npm ci
npm run data:generate-core
npm run data:generate-countries
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

When the complete city pipeline is too large for a development machine, use
the bounded build fallback:

```shell
npm run data:generate-core
npm run data:generate-countries
npm run data:restore-release-cache
npm run build
```

The restore command accepts only the published `site-20260624` GitHub release
archive with SHA-256
`94a0f3cf479aafb311db72b9483d4bacd663e9078e6bcef8d1414038f61036d3`.
It extracts only the release `data/` tree, mirrors its reviewed manifests, and
deterministically derives the small slug metadata and registry summary used at
build time. It neither fabricates fixtures nor commits generated data.

`npm run verify:data-prereqs` and the `prebuild` hook list every missing
generated artifact and stop. This is deliberate: do not create placeholder
World Bank observations, empty geometry, invented city records, or synthetic
provenance to make verification pass.

The World Bank generator requests the official v2 API with an explicit
2018–2024 date window and retries transient `400`, timeout, rate-limit, and
server responses with bounded exponential backoff. `PA.NUS.FCRF` was validated
against both the official indicator catalogue and a successful official v2
country response. A persistent failure still stops generation without writing
a partial snapshot.

Full source-regression tests inspect GeoNames, Natural Earth, and published
asset caches when those ignored external datasets are installed. These
cache-specific tests are skipped on a clean clone; production builds remain
strictly gated by the generated-data preflight.
