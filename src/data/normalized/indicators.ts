import { indicatorCatalog } from "@/data/contracts/indicator-catalog";
import { latestYear } from "@/data/mock/catalog";
import { indicatorDefinitionSchema } from "@/domain/schemas";

type IndicatorPresentation = {
  name: string;
  category: string;
  unit: string;
  description: string;
  coverageNote?: string;
};

const indicatorPresentationById: Record<string, IndicatorPresentation> = {
  "gdp-current-usd": {
    name: "GDP (current USD)",
    category: "Macroeconomy",
    unit: "usd",
    description: "Nominal gross domestic product in current US dollars.",
  },
  "gdp-per-capita": {
    name: "GDP per capita",
    category: "Macroeconomy",
    unit: "usd",
    description: "Nominal GDP per person derived from current-dollar output and population.",
    coverageNote: "Calculated from GDP and population rather than fetched as a separate published series.",
  },
  "gdp-growth": {
    name: "Real GDP growth",
    category: "Macroeconomy",
    unit: "percent",
    description: "Annual real GDP growth rate.",
  },
  "inflation-cpi": {
    name: "CPI inflation",
    category: "Monetary & Currency",
    unit: "percent",
    description: "Consumer price inflation, annual average.",
  },
  "inflation-ppi": {
    name: "PPI inflation",
    category: "Monetary & Currency",
    unit: "percent",
    description: "Producer price inflation estimate.",
    coverageNote: "Sparse coverage by country and year; unavailable observations remain null.",
  },
  unemployment: {
    name: "Unemployment rate",
    category: "Labor",
    unit: "percent",
    description: "Share of the labor force that is unemployed.",
  },
  population: {
    name: "Population",
    category: "Demographics",
    unit: "people",
    description: "Total resident population.",
  },
  "exports-usd": {
    name: "Exports",
    category: "Trade",
    unit: "usd",
    description: "Goods and services exports in current US dollars.",
  },
  "imports-usd": {
    name: "Imports",
    category: "Trade",
    unit: "usd",
    description: "Goods and services imports in current US dollars.",
  },
  "debt-to-gdp": {
    name: "Debt-to-GDP",
    category: "Public Finance",
    unit: "percent",
    description: "General government gross debt as a share of GDP.",
  },
  "policy-rate": {
    name: "Policy rate",
    category: "Monetary & Currency",
    unit: "percent",
    description: "Representative monetary policy rate.",
    coverageNote: "Not yet integrated into the real-data pipeline.",
  },
  "exchange-rate": {
    name: "Exchange rate vs USD",
    category: "Monetary & Currency",
    unit: "local_per_usd",
    description: "Local currency units per US dollar.",
  },
  "median-age": {
    name: "Median age",
    category: "Demographics",
    unit: "years",
    description: "Median age of the population.",
    coverageNote: "Not yet integrated into the real-data pipeline.",
  },
  fertility: {
    name: "Fertility rate",
    category: "Demographics",
    unit: "births_per_woman",
    description: "Births per woman.",
  },
  urbanization: {
    name: "Urbanization",
    category: "Demographics",
    unit: "percent",
    description: "Urban population share.",
  },
  "labor-force-participation": {
    name: "Labor force participation",
    category: "Labor",
    unit: "percent",
    description: "Working-age population participating in the labor market.",
  },
  gini: {
    name: "Gini index",
    category: "Inequality & Welfare",
    unit: "index",
    description: "Income inequality estimate.",
  },
  "renewables-share": {
    name: "Renewables share",
    category: "Energy",
    unit: "percent",
    description: "Renewables share in primary energy or electricity mix.",
  },
  "emissions-per-capita": {
    name: "Emissions per capita",
    category: "Sustainability",
    unit: "tons_co2e",
    description: "Emissions per capita, tons CO2 equivalent.",
  },
  "electricity-access": {
    name: "Electricity access",
    category: "Infrastructure",
    unit: "percent",
    description: "Population with access to electricity.",
  },
  "internet-penetration": {
    name: "Internet penetration",
    category: "Technology",
    unit: "percent",
    description: "Population using the internet.",
  },
  "logistics-score": {
    name: "Logistics performance",
    category: "Infrastructure",
    unit: "score",
    description: "Composite logistics and corridor readiness score.",
    coverageNote: "Sparse release cadence; missing years remain unavailable rather than estimated.",
  },
  "business-climate": {
    name: "Business climate",
    category: "Business Environment",
    unit: "score",
    description: "Composite business environment and execution readiness score.",
    coverageNote: "Derived internal composite from real-source infrastructure and inequality inputs.",
  },
};

function getPrimarySourceId(indicatorId: string) {
  const strategy = indicatorCatalog.find((entry) => entry.id === indicatorId);

  if (!strategy) {
    throw new Error(`Missing acquisition strategy for indicator ${indicatorId}`);
  }

  if (strategy.kind === "direct") {
    return strategy.actualSources[0] ?? "mapfactbook-lab";
  }

  return "mapfactbook-lab";
}

export const indicatorDefinitions = indicatorDefinitionSchema.array().parse(
  indicatorCatalog.map((strategy) => {
    const presentation = indicatorPresentationById[strategy.id];

    if (!presentation) {
      throw new Error(`Missing presentation metadata for indicator ${strategy.id}`);
    }

    return {
      id: strategy.id,
      name: presentation.name,
      category: presentation.category,
      unit: presentation.unit,
      description: presentation.description,
      sourceId: getPrimarySourceId(strategy.id),
      latestYear,
      coverageNote: presentation.coverageNote ?? strategy.notes,
    };
  }),
);

export const indicatorById = Object.fromEntries(
  indicatorDefinitions.map((indicator) => [indicator.id, indicator]),
) as Record<string, (typeof indicatorDefinitions)[number]>;
