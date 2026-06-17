// @vitest-environment node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createCsvRecordStream } from "./csv-stream";

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

async function collect<T extends Record<string, unknown>>(file: string): Promise<T[]> {
  const rows: T[] = [];
  for await (const row of createCsvRecordStream<T>(file)) rows.push(row);
  return rows;
}

describe("createCsvRecordStream", () => {
  it("tolerates ragged rows instead of aborting the whole file (relax_column_count)", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-csv-"));
    tempDirs.push(dir);
    const file = path.join(dir, "ragged.csv");
    await fs.writeFile(
      file,
      ["a,b,c", "1,2,3", "4,5", "6,7,8,9", "10,11,12"].join("\n"), // short + long rows in the middle
    );
    const rows = await collect<{ a: string; b: string; c: string }>(file);
    // The well-formed rows still come through (the ragged ones don't throw).
    expect(rows.map((r) => r.a)).toContain("1");
    expect(rows.map((r) => r.a)).toContain("10");
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects (does not hang) when the file is missing", async () => {
    const missing = path.join(os.tmpdir(), "econmap-does-not-exist-12345.csv");
    await expect(collect(missing)).rejects.toBeDefined();
  });
});
