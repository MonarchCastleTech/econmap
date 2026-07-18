import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { countrySeeds } from "../../src/data/mock/catalog";

type RawObservation = {
  entityId: string;
  indicatorId: string;
  year: number;
  value: number | null;
  sourceId: string;
  note?: string;
};

type IndicatorFetchConfig = {
  id: string;
  code: string;
  sourceId: string;
};

const historyYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
const countryCodes = countrySeeds.map((seed) => seed.iso3).join(";");
const iso3ToSlug = new Map(countrySeeds.map((seed) => [seed.iso3, seed.slug]));

const directIndicators: IndicatorFetchConfig[] = [
  { id: "gdp-current-usd", code: "NY.GDP.MKTP.CD", sourceId: "world-bank" },
  { id: "gdp-growth", code: "NY.GDP.MKTP.KD.ZG", sourceId: "world-bank" },
  { id: "inflation-cpi", code: "FP.CPI.TOTL.ZG", sourceId: "world-bank" },
  { id: "inflation-ppi", code: "FP.WPI.TOTL.ZG", sourceId: "world-bank" },
  { id: "unemployment", code: "SL.UEM.TOTL.ZS", sourceId: "world-bank" },
  { id: "population", code: "SP.POP.TOTL", sourceId: "world-bank" },
  { id: "exports-usd", code: "NE.EXP.GNFS.CD", sourceId: "world-bank" },
  { id: "imports-usd", code: "NE.IMP.GNFS.CD", sourceId: "world-bank" },
  { id: "debt-to-gdp", code: "GC.DOD.TOTL.GD.ZS", sourceId: "world-bank" },
  { id: "exchange-rate", code: "PA.NUS.FCRF", sourceId: "world-bank" },
  { id: "fertility", code: "SP.DYN.TFRT.IN", sourceId: "world-bank" },
  { id: "urbanization", code: "SP.URB.TOTL.IN.ZS", sourceId: "world-bank" },
  { id: "labor-force-participation", code: "SL.TLF.CACT.ZS", sourceId: "world-bank" },
  { id: "gini", code: "SI.POV.GINI", sourceId: "world-bank" },
  { id: "renewables-share", code: "EG.FEC.RNEW.ZS", sourceId: "world-bank" },
  { id: "emissions-per-capita", code: "EN.ATM.CO2E.PC", sourceId: "world-bank" },
  { id: "electricity-access", code: "EG.ELC.ACCS.ZS", sourceId: "world-bank" },
  { id: "internet-penetration", code: "IT.NET.USER.ZS", sourceId: "world-bank" },
  { id: "logistics-score", code: "LP.LPI.OVRL.XQ", sourceId: "world-bank" },
];

async function fetchIndicator(config: IndicatorFetchConfig) {
  const url =
    `https://api.worldbank.org/v2/country/${countryCodes}/indicator/${config.code}` +
    `?format=json&per_page=20000&date=${historyYears[0]}:${historyYears.at(-1)}`;
  let response: Response | undefined;
  const attempts = 5;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "econmap-world-bank-generator/1.0",
      },
    });
    if (response.ok) {
      break;
    }
    if (attempt === attempts || ![400, 408, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(
        `World Bank request failed for ${config.id}: ${response.status} after ${attempt} attempt(s)`,
      );
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 750 * 2 ** (attempt - 1)));
  }

  if (!response?.ok) {
    throw new Error(`World Bank request failed for ${config.id}: no successful response`);
  }

  const payload = (await response.json()) as [
    { lastupdated?: string } | undefined,
    Array<{
      countryiso3code: string;
      date: string;
      value: number | null;
    }>,
  ];

  return {
    lastUpdated: payload[0]?.lastupdated ?? new Date().toISOString().slice(0, 10),
    rows: payload[1] ?? [],
  };
}

function key(entityId: string, indicatorId: string, year: number) {
  return `${entityId}:${indicatorId}:${year}`;
}

function deriveObservation(
  observations: RawObservation[],
  indicatorId: string,
  sourceId: string,
  derive: (entityId: string, year: number, byKey: Map<string, RawObservation>) => RawObservation,
) {
  const byKey = new Map(observations.map((entry) => [key(entry.entityId, entry.indicatorId, entry.year), entry]));

  countrySeeds.forEach((seed) => {
    historyYears.forEach((year) => {
      observations.push(
        derive(seed.slug, year, byKey) ?? {
          entityId: seed.slug,
          indicatorId,
          year,
          value: null,
          sourceId,
          note: "No derived value available for this country-year.",
        },
      );
    });
  });
}

async function main() {
  const observations: RawObservation[] = [];
  const sourceUpdates: Record<string, string> = {};

  for (const indicator of directIndicators) {
    const { lastUpdated, rows } = await fetchIndicator(indicator);
    sourceUpdates[indicator.id] = lastUpdated;

    const valueByCountryYear = new Map<string, number | null>();
    rows.forEach((row) => {
      const year = Number(row.date);
      const slug = iso3ToSlug.get(row.countryiso3code);

      if (!slug || !historyYears.includes(year)) {
        return;
      }

      valueByCountryYear.set(key(slug, indicator.id, year), row.value);
    });

    countrySeeds.forEach((seed) => {
      historyYears.forEach((year) => {
        const value = valueByCountryYear.get(key(seed.slug, indicator.id, year)) ?? null;

        observations.push({
          entityId: seed.slug,
          indicatorId: indicator.id,
          year,
          value,
          sourceId: indicator.sourceId,
          note: value === null ? "No World Bank observation returned for this country-year." : undefined,
        });
      });
    });
  }

  deriveObservation(
    observations,
    "gdp-per-capita",
    "mapfactbook-lab",
    (entityId, year, byKey) => {
      const gdp = byKey.get(key(entityId, "gdp-current-usd", year))?.value;
      const population = byKey.get(key(entityId, "population", year))?.value;

      return {
        entityId,
        indicatorId: "gdp-per-capita",
        year,
        value: gdp && population ? gdp / population : null,
        sourceId: "mapfactbook-lab",
        note:
          gdp && population
            ? "Derived from World Bank GDP and population observations."
            : "GDP per capita unavailable because GDP or population is missing for this year.",
      };
    },
  );

  deriveObservation(
    observations,
    "business-climate",
    "mapfactbook-lab",
    (entityId, year, byKey) => {
      const internet = byKey.get(key(entityId, "internet-penetration", year))?.value;
      const electricity = byKey.get(key(entityId, "electricity-access", year))?.value;
      const logistics = byKey.get(key(entityId, "logistics-score", year))?.value;
      const gini = byKey.get(key(entityId, "gini", year))?.value;

      const components = [
        typeof internet === "number" ? internet : null,
        typeof electricity === "number" ? electricity : null,
        typeof logistics === "number" ? (logistics / 5) * 100 : null,
        typeof gini === "number" ? 100 - gini : null,
      ].filter((value): value is number => value !== null);

      return {
        entityId,
        indicatorId: "business-climate",
        year,
        value:
          components.length >= 2
            ? Number((components.reduce((sum, value) => sum + value, 0) / components.length).toFixed(1))
            : null,
        sourceId: "mapfactbook-lab",
        note:
          components.length >= 2
            ? "Derived from real-source internet, electricity, logistics, and inequality inputs."
            : "Business climate composite unavailable because too few real-source inputs were available.",
      };
    },
  );

  const output = {
    generatedAt: new Date().toISOString(),
    historyYears,
    sourceUpdates,
    observations,
  };

  const outputDir = path.resolve(process.cwd(), "src/data/generated");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    path.join(outputDir, "world-bank-core.json"),
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
