/**
 * Inspect public/data/globe/layers.pmtiles with the same `pmtiles` library the browser uses.
 * Prints header zoom range + the vector_layer ids, so a regen can be verified before deploy.
 * RUN:  npx tsx scripts/data/globe/inspect-pmtiles.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PMTiles, type Source, type RangeResponse } from "pmtiles";

const ARCHIVE = path.join(process.cwd(), "public", "data", "globe", "layers.pmtiles");

class NodeFileSource implements Source {
  private fd: number;
  constructor(private filePath: string) {
    this.fd = fs.openSync(filePath, "r");
  }
  getKey() {
    return this.filePath;
  }
  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const buf = Buffer.alloc(length);
    fs.readSync(this.fd, buf, 0, length, offset);
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  }
}

async function main() {
  if (!fs.existsSync(ARCHIVE)) {
    console.error(`missing ${ARCHIVE} — run generate-pmtiles.ts first`);
    process.exit(1);
  }
  const pm = new PMTiles(new NodeFileSource(ARCHIVE));
  const header = await pm.getHeader();
  const meta = (await pm.getMetadata()) as { vector_layers?: Array<{ id: string }> };
  const layers = (meta.vector_layers ?? []).map((l) => l.id).sort();
  const sizeMb = (fs.statSync(ARCHIVE).size / 1048576).toFixed(1);
  console.log(`archive: ${sizeMb} MB  zoom ${header.minZoom}-${header.maxZoom}`);
  console.log(`vector_layers (${layers.length}): ${layers.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
