export function toCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
  columns?: string[],
) {
  const header = columns ?? Object.keys(rows[0] ?? {});
  const lines = rows.map((row) =>
    header
      .map((column) => {
        const value = row[column] ?? "";
        const normalized = String(value).replace(/"/g, '""');
        return `"${normalized}"`;
      })
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function sanitizeExportFileName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
