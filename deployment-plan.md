# MapFactbook OSINT Tool — Deployment Plan

**Date:** April 12, 2026  
**Project:** `F:\EconMap` (mapfactbook-app v0.1.0)

---

## 1. Project Inventory

### Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, webpack mode) |
| Language | TypeScript 5 |
| Mapping | MapLibre GL, deck.gl 9, Cesium 1.139 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4, Inter + IBM Plex Mono |
| DB | SQLite via Prisma 6 (user state only) |
| Testing | Vitest 3, Testing Library |
| Charts | Recharts 3 |
| Animation | Framer Motion 12 |

### Routes (12 total)
`/` (globe home) · `/city/[slug]` · `/country/[slug]` · `/compare` · `/dashboard` · `/datasets` · `/indicators` · `/rankings` · `/regions` · `/reports` · `/story-mode` · `/health` · `/api/*`

### Data Footprint
| Directory | Size | Purpose |
|-----------|------|---------|
| `data/raw/` | **~22 GB** | Bulk source archives (GeoNames, GLEIF, GHSL, OECD, etc.) |
| `src/data/generated/cities/` | **~6 GB** | Pre-built JSON/GeoJSON city workspaces, entities, maps |
| `src/data/generated/command-center/` | small | Dashboard precomputed data |
| `public/data/` | **~790 MB** | Globe imagery tiles, static data served to client |
| `public/vendor/cesium/` | **~7 MB** | Cesium runtime assets |
| `src/data/mock/` + `normalized/` | small | Country indicators, blocs, mock catalog |

> [!CAUTION]
> The **22 GB raw data** is build-time only. It must NOT be deployed. Only the generated artifacts under `src/data/generated/` and `public/` are needed at runtime.

---

## 2. Critical Pre-Deployment Fixes

### 2.1 Separate Build-Time Data from Runtime Data

The `data/raw/` and `data/processed/` directories contain source archives and should be excluded from the deploy artifact entirely.

```
# Add to .gitignore (or deploy ignore):
/data/raw/
/data/processed/
```

### 2.2 Ensure Build Succeeds

```bash
npm run build
```

If the build fails due to memory on large JSON imports (~6 GB of city workspace files), you need to:

```bash
# Increase Node heap for build
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### 2.3 Environment Variables

Create `.env.production`:

```env
DATABASE_URL="file:./prod.db"
NEXT_PUBLIC_MAP_STYLE_MODE="dark"
NEXT_PUBLIC_CESIUM_BASE_URL="/vendor/cesium"
```

### 2.4 Initialize Prisma Production DB

```bash
npx prisma generate
npx prisma db push
```

---

## 3. Deployment Options

### Option A: Self-Hosted VPS (Recommended for OSINT tool)

**Why:** Full control, no vendor lock-in, can handle the ~7 GB deploy payload, persistent SQLite, no serverless cold start issues with large datasets.

**Recommended specs:**
- **RAM:** 8–16 GB (for build and serving large JSON)
- **Disk:** 40+ GB SSD (runtime artifacts + build cache)
- **CPU:** 4+ cores
- **OS:** Ubuntu 22.04 / Debian 12

**Providers:** Hetzner, DigitalOcean, Vultr, OVH, Contabo

**Setup steps:**

```bash
# 1. Install Node.js 20+ and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone / upload the project (WITHOUT data/raw/)
rsync -avz --exclude='data/raw' --exclude='data/processed' \
  --exclude='node_modules' --exclude='.next' \
  . user@server:/opt/mapfactbook/

# 3. On server
cd /opt/mapfactbook
npm ci --production=false
npx prisma generate
npx prisma db push
NODE_OPTIONS="--max-old-space-size=8192" npm run build
npm run start -- -p 3000

# 4. Reverse proxy with nginx
sudo apt install nginx
```

**Nginx config:**

```nginx
server {
    listen 80;
    server_name mapfactbook.yourdomain.com;

    # Allow large JSON responses
    proxy_read_timeout 60s;
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets aggressively
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /vendor/ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

**Process manager:**

```bash
sudo npm install -g pm2
pm2 start npm --name mapfactbook -- start -- -p 3000
pm2 save
pm2 startup
```

**SSL:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mapfactbook.yourdomain.com
```

---

### Option B: Docker (Portable)

```dockerfile
# Dockerfile
FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source (exclude raw data via .dockerignore)
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN NODE_OPTIONS="--max-old-space-size=8192" npm run build

# Production
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

```dockerignore
# .dockerignore
data/raw/
data/processed/
node_modules/
.next/
*.md
*.png
*.log
.codex-*
```

> [!IMPORTANT]
> To use standalone output, add `output: "standalone"` to `next.config.ts`. This reduces the deploy image significantly.

---

### Option C: Vercel / Cloud Functions

> [!WARNING]
> **Not recommended** for this project. Vercel has a **250 MB** function size limit and a **50 MB** deploy payload limit (compressed). The `src/data/generated/cities/` directory alone is ~6 GB. Serverless cold starts with this data volume would be unacceptable.

If you must use Vercel, you would need to:
1. Move all city JSON to an external object store (R2, S3, GCS)
2. Serve them via API routes or CDN
3. Rewrite all `fs.readFile` calls to fetch from the store

This is a major refactor and not recommended for initial deployment.

---

### Option D: Fully Static Website (Recommended for Public OSINT Distribution)

**Why:** No server needed. Users download or clone the built site and open it. Works on any static host (GitHub Pages, Cloudflare Pages, Netlify, S3, or even a local `file://` open). Zero infrastructure cost. Maximum portability.

#### Architecture

```
┌─────────────────────────────────────────────┐
│  BUILD MACHINE (your laptop / CI runner)    │
│                                             │
│  data/raw/ (22 GB) ──► pipeline scripts     │
│                           │                 │
│                     src/data/generated/     │
│                           │                 │
│         next build (static export)          │
│                           │                 │
│                       out/  ◄── deployable  │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  STATIC HOST  (or local file system)        │
│                                             │
│  out/                                       │
│  ├── index.html                             │
│  ├── city/istanbul/index.html               │
│  ├── country/turkey/index.html              │
│  ├── data/cities/workspaces/geo-745042.json │
│  ├── data/cities/map/cities.geojson         │
│  ├── vendor/cesium/...                      │
│  └── _next/static/...                       │
└─────────────────────────────────────────────┘
```

#### What Needs to Change

The current codebase uses a few server-side features that must be converted for static export:

##### 1. Switch `next.config.ts` to static output

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",       // ← static HTML export
  trailingSlash: true,    // ← /city/istanbul/ instead of /city/istanbul
  images: { unoptimized: true },  // ← no server-side image optimization
  // ... keep webpack/Cesium config as-is
};
```

##### 2. Remove or Replace Prisma / SQLite

Prisma requires a Node.js runtime. For a static site:
- **Remove** `prisma/`, `@prisma/client`, `prisma` from `package.json`
- **Replace** watchlists / dashboards / saved collections with **`localStorage`** on the client
- Create a `src/lib/local-storage.ts` helper that wraps `localStorage` with the same API shape

##### 3. Remove API Routes

Static export does not support `/api/*` routes. All server-side API routes must be removed or converted:
- **Delete** `src/app/api/` directory entirely
- City workspace data loads via **client-side `fetch()`** from pre-generated JSON files placed in `public/data/`

##### 4. Move Generated City Data to `public/`

Static export can only serve files from `public/`. The generated city data must be copied there at build time:

```bash
# Add to package.json scripts:
"prebuild": "tsx scripts/data/cities/copy-to-public.ts"
```

```typescript
// scripts/data/cities/copy-to-public.ts
// Copies src/data/generated/cities/ → public/data/cities/
// This makes workspace JSONs fetchable at /data/cities/workspaces/geo-745042.json
```

##### 5. Pre-generate All Dynamic Routes

Next.js static export requires `generateStaticParams()` for every `[slug]` route:

```typescript
// src/app/city/[slug]/page.tsx
import registry from "@/data/generated/cities/registry.json";

export function generateStaticParams() {
  return registry.map((city) => ({ slug: city.slug }));
}
```

Same pattern for `/country/[slug]`.

> [!WARNING]
> With hundreds of thousands of cities, this generates a massive `out/` folder. Consider limiting to cities with `population > 5000` or similar for the initial static export, and loading the rest on-demand via client-side fetch.

##### 6. Client-Side Data Loading Pattern

Replace server-side `fs.readFile` calls with client-side `fetch`:

```typescript
// src/lib/city-data-client.ts
export async function loadCityWorkspace(cityId: string) {
  const res = await fetch(`/data/cities/workspaces/${cityId}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function loadCityEntities(cityId: string) {
  const res = await fetch(`/data/cities/entities/${cityId}.json`);
  if (!res.ok) return null;
  return res.json();
}
```

##### 7. Map Tile Strategy

MapLibre tile sources (CARTO dark basemap) require internet access. For fully offline use:
- Download tiles with a tool like `tileserver-gl` or `mbtiles`
- Serve from `public/tiles/` and point `StyleSpecification` to local paths
- For online-only: keep the CARTO URLs as-is (no change needed)

#### Static Export Build Command

```bash
# Full pipeline:
npm run data:cities              # regenerate city artifacts
npm run prebuild                 # copy generated data to public/
NODE_OPTIONS="--max-old-space-size=8192" npm run build
# Output: out/ directory with all static files
```

#### Static Hosting Options

| Host | Free Tier | Max Size | Notes |
|------|-----------|----------|-------|
| **GitHub Pages** | 1 GB | 1 GB per repo | Best for small subsets; won't fit 6 GB |
| **Cloudflare Pages** | Unlimited bandwidth | 25 MB per file, 20k files | Good if workspace JSONs are split small enough |
| **Netlify** | 100 GB/mo bandwidth | No hard site size limit | Works well; deploy via CLI |
| **AWS S3 + CloudFront** | Pay-as-you-go | Unlimited | Best for the full 6 GB dataset |
| **Cloudflare R2 + Pages** | 10 GB free storage | Unlimited | Best free option for large data |
| **Self-hosted nginx** | N/A | Unlimited | Just `nginx -c` pointing to `out/` |
| **Local** | N/A | N/A | Just open `out/index.html` |

#### Reducing the Static Export Size

The full 6 GB of city workspaces is too large for most free static hosts. Strategies:

1. **Tiered export:** Pre-render HTML pages for top ~5,000 cities (pop > 50k). Serve the rest as JSON-only (fetched client-side, no pre-rendered HTML page).
2. **Compress JSON:** Run `gzip` on all `.json` files at deploy time. Most static hosts serve `.json.gz` transparently.
3. **Lazy entity loading:** Don't embed entity arrays in workspace JSONs. Load them separately on click.
4. **Country-level splitting:** Instead of per-city dirs, serve one JSON per country with all city summaries. Load detail on demand.

#### Codex Task List for Static Conversion

These are the concrete file-level tasks to convert the project to static export:

```
1. [ ] Modify `next.config.ts`: set output="export", trailingSlash=true, images.unoptimized=true
2. [ ] Create `scripts/data/cities/copy-to-public.ts`: copy generated data → public/data/
3. [ ] Add "prebuild" script to `package.json`
4. [ ] Remove `src/app/api/` directory entirely
5. [ ] Remove `prisma/` directory, `@prisma/client` and `prisma` from package.json
6. [ ] Create `src/lib/local-storage.ts`: localStorage wrapper for watchlists/dashboards/collections
7. [ ] Update `src/app/city/[slug]/page.tsx`: add generateStaticParams(), use client-side fetch
8. [ ] Update `src/app/country/[slug]/page.tsx`: add generateStaticParams()
9. [ ] Create `src/lib/city-data-client.ts`: client-side fetch helpers for workspaces/entities
10.[ ] Update all city/country components: replace fs.readFile with client fetch
11.[ ] Update `src/components/providers/app-providers.tsx`: remove Prisma/DB providers if any
12.[ ] Update `src/store/ui-store.ts`: use localStorage for saved state
13.[ ] Add population threshold filter in generateStaticParams (~5k+ for HTML pages)
14.[ ] Test: `npm run build` produces `out/` with working HTML
15.[ ] Test: serve `out/` with `npx serve out` and verify all routes work
16.[ ] Compress: `find out -name '*.json' -exec gzip -k {} \;` for hosting
```

---

## 4. Data Size Optimization

### 4.1 Compress Generated City Data

The 6 GB of JSON workspace files can be significantly reduced:

```bash
# Check if you can serve gzipped files
# In nginx:
gzip on;
gzip_types application/json application/geo+json;
gzip_min_length 1000;
gzip_comp_level 6;
```

### 4.2 Move City Workspaces to API Routes

Instead of importing all workspace JSON at build time, serve them on-demand:

```typescript
// src/app/api/cities/[slug]/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const file = path.join(process.cwd(), "src/data/generated/cities/workspaces", `${params.slug}.json`);
  const data = await fs.readFile(file, "utf-8");
  return NextResponse.json(JSON.parse(data), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
```

### 4.3 Split Large GeoJSON

If `cities.geojson` or entity layers are very large, consider tiling them or splitting by region for faster initial loads.

---

## 5. Security Hardening (OSINT Tool)

### 5.1 Headers

Add to `next.config.ts`:

```typescript
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

### 5.2 Rate Limiting

Add rate limiting to API routes to prevent data scraping:

```bash
npm install express-rate-limit  # or use middleware
```

### 5.3 Access Control (Optional)

If this is an internal OSINT tool, add basic auth or SSO:

```bash
npm install next-auth  # or simple middleware-based auth
```

---

## 6. CI/CD Pipeline

### GitHub Actions (example)

```yaml
name: Deploy MapFactbook
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true  # if using Git LFS for data files

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx prisma generate
      - run: NODE_OPTIONS="--max-old-space-size=8192" npm run build
      - run: npm test

      # Deploy to VPS via SSH
      - name: Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/mapfactbook
            git pull
            npm ci
            npx prisma generate
            NODE_OPTIONS="--max-old-space-size=8192" npm run build
            pm2 restart mapfactbook
```

---

## 7. Launch Checklist

- [ ] **Build passes:** `NODE_OPTIONS="--max-old-space-size=8192" npm run build` succeeds
- [ ] **Tests pass:** `npm test` green
- [ ] **Lint clean:** `npm run lint` no errors
- [ ] **Raw data excluded:** `data/raw/` and `data/processed/` not in deploy
- [ ] **Env vars set:** `.env.production` created
- [ ] **Prisma DB initialized:** `npx prisma db push` run on server (skip if static)
- [ ] **PM2 / Docker running:** process auto-restarts on crash (skip if static)
- [ ] **Nginx configured:** reverse proxy + gzip + SSL (or static host configured)
- [ ] **SSL active:** HTTPS via Let's Encrypt or host-provided
- [ ] **Health check:** `/health` route returns 200 (skip if static)
- [ ] **Security headers:** X-Frame-Options, CSP, etc. (via host config if static)
- [ ] **Source labels visible:** every city metric shows `Source: OECD` etc.
- [ ] **Domain pointed:** DNS A record → server IP (or CNAME → static host)

---

## 8. Data Refresh Strategy

The bulk datasets (GeoNames, WHO, OECD, GLEIF, etc.) should be refreshed periodically:

| Source | Refresh Cadence |
|--------|----------------|
| GeoNames | Monthly |
| GLEIF | Weekly |
| WHO Air Quality | Annually |
| OECD FUA Economy | Quarterly |
| Eurostat | Quarterly |
| OurAirports | Monthly |
| WRI Power Plants | Annually |
| Carbon Monitor | Monthly |
| Ookla | Quarterly |

**Refresh workflow:**
1. Download updated sources to `data/raw/` on a dev machine
2. Run `npm run data:cities` to regenerate artifacts
3. For static: rebuild and re-deploy `out/`
4. For VPS: copy `src/data/generated/` to server, rebuild, restart

---

## Summary

| Decision | Static (Option D) | VPS (Option A) |
|----------|------------------|----------------|
| **Platform** | Any static host / local | Hetzner/DigitalOcean |
| **Server** | None needed | PM2 + nginx |
| **Cost** | Free–$5/mo | $10–30/mo |
| **Build memory** | 8 GB+ Node heap | 8 GB+ Node heap |
| **Data delivery** | Client-side fetch from JSON | Server-side fs.readFile or API |
| **User state** | localStorage | SQLite via Prisma |
| **Offline capable** | Yes (with local tiles) | No |
| **Best for** | Public distribution, OSINT | Private tools, heavy API use |

