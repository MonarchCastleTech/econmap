import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

/**
 * Streams a CSV file as typed records.
 *
 * Robustness (P1.3):
 *  - A source error (e.g. ENOENT for a missing optional file) is forwarded to the parser via
 *    destroy(err). Node's .pipe() does NOT forward errors, so without this the parser's async
 *    iterator would hang forever instead of rejecting — which is exactly what made
 *    parseOurAirportsCsv hang when runways.csv was absent.
 *  - relax_column_count tolerates ragged rows (a single malformed row no longer aborts the whole
 *    file), and bom strips a leading byte-order mark.
 */
export function createCsvRecordStream<T extends Record<string, unknown>>(filePath: string) {
  const source = createReadStream(filePath, { encoding: "utf-8" });
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });
  source.on("error", (err) => parser.destroy(err));
  return source.pipe(parser) as AsyncIterable<T>;
}
