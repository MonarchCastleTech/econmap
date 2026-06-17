import worldBankCore from "@/data/generated/world-bank-core.json";
import { historyYears, latestYear, sourceById, countrySeeds } from "@/data/mock/catalog";
import globalCountries from "@/data/generated/global-countries.json";
import { indicatorById } from "@/data/normalized/indicators";
import { countryProfileSchema, countrySchema, indicatorObservationSchema } from "@/domain/schemas";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";

const allCountrySeeds = [...countrySeeds, ...(globalCountries as any[])];

type GeneratedObservation = {
  entityId: string;
  indicatorId: string;
  year: number;
  value: number | null;
  sourceId: keyof typeof sourceById;
  note?: string;
};

const countriesBase = allCountrySeeds.map((seed) => ({
  id: seed.id,
  slug: seed.slug,
  iso2: seed.iso2,
  iso3: seed.iso3,
  name: seed.name,
  flag: seed.flag,
  capital: seed.capital,
  region: seed.region,
  subregion: seed.subregion,
  latitude: seed.latitude,
  longitude: seed.longitude,
  currencyCode: seed.currencyCode,
  currencyName: seed.currencyName,
  creditRating: seed.creditRating,
  blocs: seed.blocs,
  showcase: seed.showcase,
}));

export const countries = countrySchema.array().parse(countriesBase);

const normalizedObservations = (worldBankCore.observations as GeneratedObservation[]).map((entry) => ({
  id: `${entry.entityId}-${entry.indicatorId}-${entry.year}`,
  entityType: "country" as const,
  entityId: entry.entityId,
  indicatorId: entry.indicatorId,
  year: entry.year,
  value: entry.value,
  unit: indicatorById[entry.indicatorId]?.unit ?? "unknown",
  // Only direct World Bank reads are "actual"; derived/lab sources (e.g. mapfactbook-lab
  // gdp-per-capita, business-climate) are labelled "estimate" so derived values are never
  // presented as observed.
  status: (entry.sourceId === "world-bank" ? "actual" : "estimate") as "actual" | "estimate",
  source: sourceById[entry.sourceId],
  note: entry.note,
}));

export const indicatorObservations = indicatorObservationSchema.array().parse(normalizedObservations);

const observationByKey = new Map(
  indicatorObservations.map((observation) => [
    `${observation.entityId}:${observation.indicatorId}:${observation.year}`,
    observation,
  ]),
);

export function getObservation(entityId: string, indicatorId: string, year = latestYear) {
  return observationByKey.get(`${entityId}:${indicatorId}:${year}`);
}

function getLatestObservation(entityId: string, indicatorId: string) {
  for (const year of [...historyYears].reverse()) {
    const observation = getObservation(entityId, indicatorId, year);

    if (observation?.value !== null && observation?.value !== undefined) {
      return observation;
    }
  }

  return undefined;
}

function sourceSummaryForCountry(slug: string) {
  const sourceIds = new Set<string>();

  indicatorObservations.forEach((observation) => {
    if (observation.entityId === slug && observation.value !== null) {
      sourceIds.add(observation.source.id);
    }
  });

  return Array.from(sourceIds)
    .map((sourceId) => sourceById[sourceId])
    .filter(Boolean);
}

export const countryProfiles = countryProfileSchema.array().parse(
  allCountrySeeds.map((seed) => {
    const country = countries.find((entry) => entry.slug === seed.slug)!;
    const population = getLatestObservation(seed.slug, "population");
    const gdp = getLatestObservation(seed.slug, "gdp-current-usd");
    const gdpPerCapita = getLatestObservation(seed.slug, "gdp-per-capita");
    const growth = getLatestObservation(seed.slug, "gdp-growth");
    const inflation = getLatestObservation(seed.slug, "inflation-cpi");
    const unemployment = getLatestObservation(seed.slug, "unemployment");
    const debt = getLatestObservation(seed.slug, "debt-to-gdp");
    const exportsValue = getLatestObservation(seed.slug, "exports-usd");
    const importsValue = getLatestObservation(seed.slug, "imports-usd");
    const renewables = getLatestObservation(seed.slug, "renewables-share");
    const internet = getLatestObservation(seed.slug, "internet-penetration");
    const electricity = getLatestObservation(seed.slug, "electricity-access");

    return {
      country,
      overview: [
        {
          label: "Population",
          indicatorId: "population",
          value: population?.value ?? null,
          unit: "people",
          status: population?.status ?? "actual",
        },
        {
          label: "GDP",
          indicatorId: "gdp-current-usd",
          value: gdp?.value ?? null,
          unit: "usd",
          status: gdp?.status ?? "actual",
        },
        {
          label: "GDP per capita",
          indicatorId: "gdp-per-capita",
          value: gdpPerCapita?.value ?? null,
          unit: "usd",
          status: gdpPerCapita?.status ?? "actual",
        },
        {
          label: "Inflation",
          indicatorId: "inflation-cpi",
          value: inflation?.value ?? null,
          unit: "percent",
          status: inflation?.status ?? "actual",
        },
        {
          label: "Unemployment",
          indicatorId: "unemployment",
          value: unemployment?.value ?? null,
          unit: "percent",
          status: unemployment?.status ?? "actual",
        },
        {
          label: "Debt-to-GDP",
          indicatorId: "debt-to-gdp",
          value: debt?.value ?? null,
          unit: "percent",
          status: debt?.status ?? "actual",
        },
      ],
      highlights: [
        `${country.name} recorded ${formatPercent(growth?.value)} real GDP growth and ${formatPercent(inflation?.value)} CPI inflation in ${latestYear}.`,
        `GDP reached ${formatCurrency(gdp?.value, "USD", { compact: true })} while population stood at ${formatCompactNumber(population?.value)}.`,
        `Exports were ${formatCurrency(exportsValue?.value, "USD", { compact: true })}, imports were ${formatCurrency(importsValue?.value, "USD", { compact: true })}, internet penetration was ${formatPercent(internet?.value)}, and electricity access was ${formatPercent(electricity?.value)}.`,
      ],
      topExports: [],
      topImports: [],
      sectorMix: renewables?.value
        ? [
            { name: "Renewables share", share: Number(renewables.value.toFixed(1)) },
            { name: "Non-renewables share", share: Number((100 - renewables.value).toFixed(1)) },
          ]
        : [],
      sourceSummary: sourceSummaryForCountry(seed.slug),
    };
  }),
);

export const showcaseCountries = countries.filter((country) => country.showcase);
