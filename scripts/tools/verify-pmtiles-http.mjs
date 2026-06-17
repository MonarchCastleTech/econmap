/**
 * End-to-end check of the browser's data path for layers.pmtiles WITHOUT a browser:
 * serve public/ with HTTP Range support, then use the same `pmtiles` library maplibre uses to fetch
 * the header + real tiles over HTTP. If tiles return non-empty bytes for each source-layer, the
 * pmtiles:// protocol + range serving works; maplibre renders those tiles with standard circle layers.
 * RUN:  node scripts/tools/verify-pmtiles-http.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { PMTiles } from "pmtiles";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ARCHIVE_URL_PATH = "/data/globe/layers.pmtiles";

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(PUBLIC_DIR, decodeURIComponent(req.url.split("?")[0]));
      if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      const size = fs.statSync(filePath).size;
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : size - 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { "Content-Length": size, "Accept-Ranges": "bytes" }).end(fs.readFileSync(filePath));
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const server = await serve();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}${ARCHIVE_URL_PATH}`;
  try {
    const pm = new PMTiles(url);
    const header = await pm.getHeader();
    const meta = await pm.getMetadata();
    const layers = (meta.vector_layers ?? []).map((l) => l.id);
    console.log(`header: zoom ${header.minZoom}-${header.maxZoom}, tileType ${header.tileType}`);
    console.log(`vector_layers (${layers.length}): ${layers.join(", ")}`);

    // Pull a spread of tiles across zooms; each must return bytes (gzipped MVT) for the world to render.
    const probes = [
      [0, 0, 0],
      [2, 1, 1],
      [2, 2, 1],
      [4, 8, 5],
      [6, 33, 22],
    ];
    let ok = 0;
    for (const [z, x, y] of probes) {
      const tile = await pm.getZxy(z, x, y);
      const bytes = tile?.data?.byteLength ?? 0;
      console.log(`  tile z${z}/${x}/${y}: ${bytes ? `${bytes} bytes ✓` : "EMPTY"}`);
      if (bytes > 0) ok += 1;
    }
    if (ok === 0) {
      console.error("\nFAIL: no tiles returned data over HTTP range.");
      process.exit(1);
    }
    console.log(`\n✓ HTTP range + pmtiles protocol verified: ${ok}/${probes.length} probe tiles served, ${layers.length} layers.`);
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
