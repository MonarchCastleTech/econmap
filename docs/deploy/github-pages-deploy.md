# Deploying EconMap to GitHub Pages

EconMap is a **static export** served by GitHub Pages. The 19 GB bulk source data + the city pipeline
run **locally** (they can't run in CI), so you build the site on your machine and publish the slimmed
`out/`. After the shrink work, `out/` is **~902 MB / 119K files, no file > 50 MiB**, which fits the
GitHub Pages 1 GB soft cap and the 100 MB-per-file git limit.

## 1. Build + verify locally (every publish)
```bash
npm run build            # Next.js static export → out/
npm run deploy:assemble  # drop the dead globe geojson tree (superseded by layers.pmtiles) + cap/clean country assets
npm run audit:data       # MUST print "Overall: PASS" (size/license/counts/provenance/geospatial)
```
The globe vector layers are served from a single PMTiles archive `public/data/globe/layers.pmtiles`
(see §6). It only needs regenerating when the globe layer data changes — `npm run data:globe:pmtiles`,
not on every publish.
Do **not** publish if `audit:data` fails — it gates size (<1 GB, no file >100 MB), licensing (no
commercial sources), count consistency, provenance (no fabrication), and geospatial sanity.

## 2. Publish — two options

**Option A — one command (simplest first deploy).** The `gh-pages` package pushes `out/` to a
`gh-pages` branch (no file exceeds 100 MB after assemble, so git accepts it):
```bash
npx gh-pages -d out -t   # -t includes dotfiles (.nojekyll); add a .nojekyll to out/ first
```
Then in repo Settings → Pages, set Source = `gh-pages` branch.

**Option B — Actions + Release asset (recommended for repeatability).** Keeps the heavy site out of
git history:
```bash
tar -czf econmap-site.tar.gz -C out .
gh release create site-$(date +%Y%m%d) econmap-site.tar.gz   # gh auth login first
```
Then in repo Settings → Pages set Source = **GitHub Actions**, and run the **Deploy to GitHub Pages**
workflow (`.github/workflows/deploy.yml`) with `release_tag = site-YYYYMMDD`. It downloads the tarball
and deploys — no bulk data needed in CI.

## 3. Repo hygiene (.gitignore)
The existing `.gitignore` already excludes `node_modules`, `/.next/`, `/out/`, `/data/raw/`,
`/data/processed/`. The generated served data is large and **regenerable**, so to keep the source repo
pushable you may also want to ignore it (it stays on your disk; build regenerates / the Release asset
carries it to Pages):
```
/public/data/cities/dossiers/
/public/data/cities/search-index.json
/public/data/globe/layers/
/public/data/assets/
/src/data/generated/cities/workspaces/
/src/data/generated/cities/entities/
/src/data/generated/cities/sources/
/src/data/generated/cities/coverage/
/src/data/generated/cities/registry.json
/src/data/generated/cities/search-index.json
*.tar.gz
```
KEEP in git the small build-time inputs the export needs: `src/data/generated/cities/slug-meta.json`
(generateStaticParams), `src/data/generated/cities/manifest.json`, `src/data/generated/command-center/*`,
`public/data/globe/manifest.json` + `base-imagery/catalog.json`. (If you prefer a fully data-less repo,
move those few small manifests under a non-ignored `config/` path or fetch them from the Release asset
in a build step.)

## 4. Base path
If you deploy to a **project** URL `https://<user>.github.io/<repo>/` (not a user-root repo or a custom
domain), every absolute `/data/...` fetch needs the `<repo>` prefix. Set `basePath`/`assetPrefix` in
`next.config.ts` and route the hardcoded `/data/...` fetches through a single `assetUrl()` helper, OR —
simplest — use a **custom domain** or a `<user>.github.io` root repo so `basePath` stays empty and no
path changes are needed (recommended).

## 5. Rendering at scale (already in place)
- **Dossiers** stream one city at a time from a Range-addressable gzip bundle (`dossiers/index.json` +
  `shard-*.dossierbin`) — one ~1.5 KB byte-range fetch per opened city. GitHub Pages (Fastly) serves
  HTTP Range, so this works with no server.
- **Map** operational layers stream from one range-addressable **PMTiles** archive
  (`layers.pmtiles`, ~20 MB) — maplibre fetches only the visible vector tiles. This replaced ~290 MB of
  per-layer geojson region shards (see §6).
- **Search** loads a 2.4 MB navigable-city index lazily on first keystroke, not on first paint.

## 6. Globe layers → PMTiles
The 11 operational globe layers (airports, ports, rail/logistics hubs, utilities, connectivity, air
quality, water stress, research) are tiled into one `public/data/globe/layers.pmtiles` (one vector
`source-layer` per layer id). The 2D map (`tactical-map-2d.tsx`) registers the `pmtiles://` protocol and
reads a single maplibre `vector` source from it; `tippecanoe`'s point-thinning gives a sparse overview
at low zoom and every point when zoomed in (the map caps at zoom 10).

- **Regenerate** (only when globe layer geojson changes): `npm run data:globe:pmtiles`
  (`scripts/data/globe/generate-pmtiles.ts`). Needs the local tippecanoe Docker image — build once:
  `docker build -t econmap/tippecanoe scripts/tools/tippecanoe`.
- **Inspect/verify**: `npx tsx scripts/data/globe/inspect-pmtiles.ts` (layer ids + zoom range) and
  `node scripts/tools/verify-pmtiles-http.mjs` (HTTP-range tile retrieval, the browser's data path).
- The `cities` layer is **excluded** — its points come from `reference/city-footprints/selectable.geojson`,
  not the layer geojson, so its shards were dead weight. `deploy:assemble` drops the whole
  `out/data/globe/layers/**` geojson tree (incl. cities), keeping only `layers.pmtiles`.
