export type GeoNamesAliasRecord = {
  alternateNameId: string;
  geonameId: string;
  isoLanguage: string;
  alternateName: string;
  isPreferredName: boolean;
  isShortName: boolean;
  isColloquial: boolean;
  isHistoric: boolean;
};

export function parseAlternateNameRow(row: string): GeoNamesAliasRecord | null {
  const fields = row.split("\t");
  if (fields.length < 4) return null;

  const alternateNameId = fields[0];
  const geonameId = fields[1];
  const isoLanguage = fields[2];
  const alternateName = fields[3];

  if (!alternateName || alternateName.trim() === "") return null;

  return {
    alternateNameId,
    geonameId,
    isoLanguage,
    alternateName,
    isPreferredName: fields[4] === "1",
    isShortName: fields[5] === "1",
    isColloquial: fields[6] === "1",
    isHistoric: fields[7] === "1",
  };
}

export function mergeAliases(existing: string[], newAliases: string[]): string[] {
  const normalized = new Set(existing.map((a) => a.toLowerCase()));
  const merged = [...existing];

  for (const alias of newAliases) {
    if (!alias) continue;
    const lower = alias.toLowerCase();
    if (!normalized.has(lower)) {
      normalized.add(lower);
      merged.push(alias);
    }
  }

  return merged;
}

export function collectAliasesForGeoname(targetGeonameId: string, rows: string[]): string[] {
  let aliases: string[] = [];

  for (const row of rows) {
    const parsed = parseAlternateNameRow(row);
    if (parsed && parsed.geonameId === targetGeonameId) {
      aliases = mergeAliases(aliases, [parsed.alternateName]);
    }
  }

  // Keep alias ordering deterministic across runtimes; localeCompare can reorder
  // accented names differently depending on host locale data.
  return aliases.sort();
}
