import fs from "node:fs/promises";
import path from "node:path";

type GeneratedObservation = {
  entityId: string;
  indicatorId: string;
  year: number;
  value: number | null;
  sourceId: string;
  note?: string;
};

const latestYear = 2024;
const historyYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

const metricToIndicator: Record<string, { id: string; source: string }> = {
  population: { id: "population", source: "world-bank" },
  gdpCurrentUsd: { id: "gdp-current-usd", source: "world-bank" },
  gdpGrowth: { id: "gdp-growth", source: "world-bank" },
  inflationCpi: { id: "inflation-cpi", source: "world-bank" },
  inflationPpi: { id: "inflation-ppi", source: "imf-weo" },
  unemployment: { id: "unemployment", source: "ilo" },
  exportsUsd: { id: "exports-usd", source: "world-bank" },
  importsUsd: { id: "imports-usd", source: "world-bank" },
  debtToGdp: { id: "debt-to-gdp", source: "imf-weo" },
  policyRate: { id: "policy-rate", source: "imf-weo" },
  exchangeRate: { id: "exchange-rate", source: "world-bank" },
  medianAge: { id: "median-age", source: "undesa" },
  fertility: { id: "fertility", source: "undesa" },
  urbanization: { id: "urbanization", source: "world-bank" },
  laborForceParticipation: { id: "labor-force-participation", source: "ilo" },
  gini: { id: "gini", source: "world-bank" },
  renewablesShare: { id: "renewables-share", source: "iea-demo" },
  emissionsPerCapita: { id: "emissions-per-capita", source: "iea-demo" },
  electricityAccess: { id: "electricity-access", source: "world-bank" },
  internetPenetration: { id: "internet-penetration", source: "world-bank" },
  logisticsScore: { id: "logistics-score", source: "world-bank" },
  businessClimate: { id: "business-climate", source: "mapfactbook-lab" },
};

const countrySeeds = [
  { slug: "united-states", m: { population: 341000000, gdpCurrentUsd: 29200000000000, gdpGrowth: 2.3, inflationCpi: 3.1, inflationPpi: 2.6, unemployment: 4.1, exportsUsd: 2100000000000, importsUsd: 3200000000000, debtToGdp: 122, policyRate: 4.75, exchangeRate: 1, medianAge: 38.9, fertility: 1.66, urbanization: 83.4, laborForceParticipation: 62.7, gini: 41.3, renewablesShare: 22, emissionsPerCapita: 14.7, electricityAccess: 100, internetPenetration: 93, logisticsScore: 4, businessClimate: 82 } },
  { slug: "canada", m: { population: 41000000, gdpCurrentUsd: 2250000000000, gdpGrowth: 1.7, inflationCpi: 2.8, inflationPpi: 2.4, unemployment: 6.1, exportsUsd: 630000000000, importsUsd: 700000000000, debtToGdp: 109, policyRate: 4.25, exchangeRate: 1.36, medianAge: 41.6, fertility: 1.43, urbanization: 81.8, laborForceParticipation: 65.5, gini: 33.3, renewablesShare: 30, emissionsPerCapita: 15.2, electricityAccess: 100, internetPenetration: 95, logisticsScore: 4.1, businessClimate: 84 } },
  { slug: "mexico", m: { population: 131000000, gdpCurrentUsd: 1980000000000, gdpGrowth: 2.1, inflationCpi: 4.4, inflationPpi: 3.8, unemployment: 3.2, exportsUsd: 640000000000, importsUsd: 650000000000, debtToGdp: 49, policyRate: 9.5, exchangeRate: 16.8, medianAge: 29.7, fertility: 1.83, urbanization: 81.1, laborForceParticipation: 61.4, gini: 45.4, renewablesShare: 16, emissionsPerCapita: 3.5, electricityAccess: 99.7, internetPenetration: 82, logisticsScore: 3.2, businessClimate: 69 } },
  { slug: "brazil", m: { population: 212000000, gdpCurrentUsd: 2350000000000, gdpGrowth: 2.4, inflationCpi: 4.1, inflationPpi: 3.7, unemployment: 7.2, exportsUsd: 360000000000, importsUsd: 280000000000, debtToGdp: 88, policyRate: 10.5, exchangeRate: 5.1, medianAge: 34.6, fertility: 1.62, urbanization: 87.1, laborForceParticipation: 63.8, gini: 52.9, renewablesShare: 49, emissionsPerCapita: 2.3, electricityAccess: 99.8, internetPenetration: 84, logisticsScore: 3, businessClimate: 66 } },
  { slug: "argentina", m: { population: 46000000, gdpCurrentUsd: 720000000000, gdpGrowth: 1.8, inflationCpi: 58, inflationPpi: 61, unemployment: 7.6, exportsUsd: 92000000000, importsUsd: 84000000000, debtToGdp: 86, policyRate: 52, exchangeRate: 1080, medianAge: 32.4, fertility: 1.88, urbanization: 92.1, laborForceParticipation: 61.2, gini: 42.3, renewablesShare: 15, emissionsPerCapita: 4.1, electricityAccess: 99.5, internetPenetration: 83, logisticsScore: 2.8, businessClimate: 52 } },
  { slug: "chile", m: { population: 19900000, gdpCurrentUsd: 360000000000, gdpGrowth: 2.2, inflationCpi: 3.8, inflationPpi: 3.2, unemployment: 8.1, exportsUsd: 108000000000, importsUsd: 92000000000, debtToGdp: 41, policyRate: 5.5, exchangeRate: 920, medianAge: 36.8, fertility: 1.51, urbanization: 88.3, laborForceParticipation: 63.1, gini: 43.8, renewablesShare: 33, emissionsPerCapita: 4.4, electricityAccess: 100, internetPenetration: 89, logisticsScore: 3.5, businessClimate: 77 } },
  { slug: "germany", m: { population: 84400000, gdpCurrentUsd: 4685592577805, gdpGrowth: 1.2, inflationCpi: 2.4, inflationPpi: 1.9, unemployment: 3.4, exportsUsd: 2000000000000, importsUsd: 1700000000000, debtToGdp: 64, policyRate: 3, exchangeRate: 0.92, medianAge: 45.7, fertility: 1.46, urbanization: 77.9, laborForceParticipation: 64.9, gini: 31.7, renewablesShare: 32, emissionsPerCapita: 7.4, electricityAccess: 100, internetPenetration: 93, logisticsScore: 4.3, businessClimate: 86 } },
  { slug: "france", m: { population: 68500000, gdpCurrentUsd: 3250000000000, gdpGrowth: 1.4, inflationCpi: 2.5, inflationPpi: 1.8, unemployment: 7.2, exportsUsd: 970000000000, importsUsd: 1010000000000, debtToGdp: 111, policyRate: 3, exchangeRate: 0.92, medianAge: 42.8, fertility: 1.79, urbanization: 81.6, laborForceParticipation: 61.8, gini: 32.4, renewablesShare: 28, emissionsPerCapita: 4.3, electricityAccess: 100, internetPenetration: 92, logisticsScore: 4.1, businessClimate: 81 } },
  { slug: "united-kingdom", m: { population: 69100000, gdpCurrentUsd: 3700000000000, gdpGrowth: 1.5, inflationCpi: 2.9, inflationPpi: 2.2, unemployment: 4.4, exportsUsd: 930000000000, importsUsd: 1040000000000, debtToGdp: 103, policyRate: 4.5, exchangeRate: 0.78, medianAge: 40.7, fertility: 1.56, urbanization: 84.6, laborForceParticipation: 63.3, gini: 35.7, renewablesShare: 35, emissionsPerCapita: 4.9, electricityAccess: 100, internetPenetration: 96, logisticsScore: 4, businessClimate: 83 } },
  { slug: "italy", m: { population: 58900000, gdpCurrentUsd: 2400000000000, gdpGrowth: 1, inflationCpi: 2.1, inflationPpi: 1.7, unemployment: 6.7, exportsUsd: 770000000000, importsUsd: 690000000000, debtToGdp: 137, policyRate: 3, exchangeRate: 0.92, medianAge: 48.4, fertility: 1.22, urbanization: 71.1, laborForceParticipation: 60.4, gini: 35.2, renewablesShare: 24, emissionsPerCapita: 5.4, electricityAccess: 100, internetPenetration: 89, logisticsScore: 3.8, businessClimate: 75 } },
  { slug: "spain", m: { population: 48600000, gdpCurrentUsd: 1900000000000, gdpGrowth: 2, inflationCpi: 2.7, inflationPpi: 2.1, unemployment: 11.4, exportsUsd: 510000000000, importsUsd: 550000000000, debtToGdp: 107, policyRate: 3, exchangeRate: 0.92, medianAge: 45.2, fertility: 1.19, urbanization: 81.2, laborForceParticipation: 58.7, gini: 34.7, renewablesShare: 37, emissionsPerCapita: 4.6, electricityAccess: 100, internetPenetration: 94, logisticsScore: 3.9, businessClimate: 78 } },
  { slug: "poland", m: { population: 36700000, gdpCurrentUsd: 920000000000, gdpGrowth: 3.1, inflationCpi: 4.5, inflationPpi: 4.1, unemployment: 2.9, exportsUsd: 510000000000, importsUsd: 480000000000, debtToGdp: 53, policyRate: 5.75, exchangeRate: 4.05, medianAge: 42.7, fertility: 1.29, urbanization: 60.2, laborForceParticipation: 58.8, gini: 28.2, renewablesShare: 19, emissionsPerCapita: 7.9, electricityAccess: 100, internetPenetration: 91, logisticsScore: 3.7, businessClimate: 78 } },
  { slug: "turkiye", m: { population: 86000000, gdpCurrentUsd: 1280000000000, gdpGrowth: 3.6, inflationCpi: 31, inflationPpi: 27, unemployment: 8.7, exportsUsd: 290000000000, importsUsd: 360000000000, debtToGdp: 33, policyRate: 42.5, exchangeRate: 36.4, medianAge: 33.7, fertility: 1.58, urbanization: 77.4, laborForceParticipation: 56.7, gini: 41.9, renewablesShare: 18, emissionsPerCapita: 5.1, electricityAccess: 100, internetPenetration: 88, logisticsScore: 3.5, businessClimate: 63 } },
  { slug: "russia", m: { population: 144000000, gdpCurrentUsd: 2100000000000, gdpGrowth: 1.6, inflationCpi: 7.5, inflationPpi: 6.8, unemployment: 3.1, exportsUsd: 520000000000, importsUsd: 360000000000, debtToGdp: 19, policyRate: 16, exchangeRate: 95, medianAge: 40.2, fertility: 1.45, urbanization: 75.4, laborForceParticipation: 61.1, gini: 37.5, renewablesShare: 7, emissionsPerCapita: 11.5, electricityAccess: 100, internetPenetration: 90, logisticsScore: 3.1, businessClimate: 58 } },
  { slug: "saudi-arabia", m: { population: 37000000, gdpCurrentUsd: 1200000000000, gdpGrowth: 2.5, inflationCpi: 2.1, inflationPpi: 1.8, unemployment: 5.4, exportsUsd: 370000000000, importsUsd: 220000000000, debtToGdp: 28, policyRate: 5.75, exchangeRate: 3.75, medianAge: 31.8, fertility: 2.39, urbanization: 85, laborForceParticipation: 61.5, gini: 38.6, renewablesShare: 1.5, emissionsPerCapita: 17.2, electricityAccess: 100, internetPenetration: 99, logisticsScore: 3.6, businessClimate: 76 } },
  { slug: "united-arab-emirates", m: { population: 10300000, gdpCurrentUsd: 570000000000, gdpGrowth: 3.4, inflationCpi: 2.3, inflationPpi: 2.1, unemployment: 2.7, exportsUsd: 520000000000, importsUsd: 380000000000, debtToGdp: 31, policyRate: 5.4, exchangeRate: 3.67, medianAge: 33.1, fertility: 1.39, urbanization: 87.8, laborForceParticipation: 77.4, gini: 26.8, renewablesShare: 6, emissionsPerCapita: 18.4, electricityAccess: 100, internetPenetration: 99, logisticsScore: 4, businessClimate: 88 } },
  { slug: "south-africa", m: { population: 63000000, gdpCurrentUsd: 430000000000, gdpGrowth: 1.6, inflationCpi: 5.3, inflationPpi: 4.9, unemployment: 31.8, exportsUsd: 140000000000, importsUsd: 120000000000, debtToGdp: 75, policyRate: 8.25, exchangeRate: 18.3, medianAge: 28.4, fertility: 2.23, urbanization: 68.9, laborForceParticipation: 58.2, gini: 63, renewablesShare: 11, emissionsPerCapita: 7.1, electricityAccess: 93, internetPenetration: 76, logisticsScore: 3.2, businessClimate: 57 } },
  { slug: "nigeria", m: { population: 232000000, gdpCurrentUsd: 510000000000, gdpGrowth: 3.3, inflationCpi: 23, inflationPpi: 20, unemployment: 6.1, exportsUsd: 75000000000, importsUsd: 68000000000, debtToGdp: 46, policyRate: 24.75, exchangeRate: 1490, medianAge: 18.1, fertility: 5.05, urbanization: 55.9, laborForceParticipation: 56.4, gini: 35.1, renewablesShare: 21, emissionsPerCapita: 0.7, electricityAccess: 64, internetPenetration: 51, logisticsScore: 2.6, businessClimate: 49 } },
  { slug: "egypt", m: { population: 116000000, gdpCurrentUsd: 510000000000, gdpGrowth: 4.2, inflationCpi: 18.5, inflationPpi: 16.2, unemployment: 7, exportsUsd: 68000000000, importsUsd: 96000000000, debtToGdp: 92, policyRate: 26.25, exchangeRate: 49.2, medianAge: 24.3, fertility: 2.75, urbanization: 43.1, laborForceParticipation: 47.7, gini: 31.5, renewablesShare: 12, emissionsPerCapita: 2.6, electricityAccess: 100, internetPenetration: 72, logisticsScore: 2.9, businessClimate: 55 } },
  { slug: "india", m: { population: 1430000000, gdpCurrentUsd: 4100000000000, gdpGrowth: 6.6, inflationCpi: 4.8, inflationPpi: 3.9, unemployment: 7.8, exportsUsd: 780000000000, importsUsd: 910000000000, debtToGdp: 83, policyRate: 6.5, exchangeRate: 83.2, medianAge: 28.8, fertility: 1.96, urbanization: 36.4, laborForceParticipation: 56.9, gini: 35.7, renewablesShare: 26, emissionsPerCapita: 2.1, electricityAccess: 98, internetPenetration: 57, logisticsScore: 3.4, businessClimate: 71 } },
  { slug: "china", m: { population: 1410000000, gdpCurrentUsd: 19500000000000, gdpGrowth: 4.4, inflationCpi: 1.6, inflationPpi: 1.2, unemployment: 5.1, exportsUsd: 3700000000000, importsUsd: 2900000000000, debtToGdp: 84, policyRate: 2.9, exchangeRate: 7.2, medianAge: 39.5, fertility: 1.16, urbanization: 67.4, laborForceParticipation: 67.5, gini: 38.5, renewablesShare: 31, emissionsPerCapita: 8.2, electricityAccess: 100, internetPenetration: 77, logisticsScore: 3.9, businessClimate: 74 } },
  { slug: "indonesia", m: { population: 281000000, gdpCurrentUsd: 1650000000000, gdpGrowth: 5.1, inflationCpi: 2.9, inflationPpi: 2.4, unemployment: 5.2, exportsUsd: 320000000000, importsUsd: 275000000000, debtToGdp: 39, policyRate: 6, exchangeRate: 15900, medianAge: 30.6, fertility: 2.14, urbanization: 58.6, laborForceParticipation: 69.2, gini: 38.1, renewablesShare: 14, emissionsPerCapita: 2.6, electricityAccess: 98.8, internetPenetration: 73, logisticsScore: 3.2, businessClimate: 67 } },
  { slug: "japan", m: { population: 123000000, gdpCurrentUsd: 4250000000000, gdpGrowth: 1.1, inflationCpi: 2.2, inflationPpi: 1.8, unemployment: 2.5, exportsUsd: 980000000000, importsUsd: 1000000000000, debtToGdp: 249, policyRate: 0.5, exchangeRate: 149, medianAge: 49.8, fertility: 1.22, urbanization: 91.9, laborForceParticipation: 63.4, gini: 32.9, renewablesShare: 23, emissionsPerCapita: 8.4, electricityAccess: 100, internetPenetration: 94, logisticsScore: 4.2, businessClimate: 83 } },
  { slug: "south-korea", m: { population: 51700000, gdpCurrentUsd: 1950000000000, gdpGrowth: 2.2, inflationCpi: 2.4, inflationPpi: 2.1, unemployment: 3.1, exportsUsd: 780000000000, importsUsd: 710000000000, debtToGdp: 55, policyRate: 3.25, exchangeRate: 1330, medianAge: 45.1, fertility: 0.75, urbanization: 81.7, laborForceParticipation: 65.8, gini: 31.5, renewablesShare: 9, emissionsPerCapita: 11.8, electricityAccess: 100, internetPenetration: 98, logisticsScore: 4.1, businessClimate: 85 } },
  { slug: "australia", m: { population: 27100000, gdpCurrentUsd: 1850000000000, gdpGrowth: 2.1, inflationCpi: 2.8, inflationPpi: 2.1, unemployment: 4.2, exportsUsd: 480000000000, importsUsd: 410000000000, debtToGdp: 46, policyRate: 4.35, exchangeRate: 1.55, medianAge: 38.5, fertility: 1.58, urbanization: 86.2, laborForceParticipation: 66.8, gini: 34.3, renewablesShare: 36, emissionsPerCapita: 14, electricityAccess: 100, internetPenetration: 96, logisticsScore: 4.1, businessClimate: 87 } },
  { slug: "vietnam", m: { population: 101000000, gdpCurrentUsd: 520000000000, gdpGrowth: 6.2, inflationCpi: 3.5, inflationPpi: 3, unemployment: 2.2, exportsUsd: 430000000000, importsUsd: 410000000000, debtToGdp: 36, policyRate: 4.5, exchangeRate: 24800, medianAge: 33.2, fertility: 1.95, urbanization: 39.5, laborForceParticipation: 68.5, gini: 35.5, renewablesShare: 16, emissionsPerCapita: 4, electricityAccess: 99.8, internetPenetration: 79, logisticsScore: 3.3, businessClimate: 72 } },
  { slug: "thailand", m: { population: 71700000, gdpCurrentUsd: 560000000000, gdpGrowth: 2.7, inflationCpi: 1.8, inflationPpi: 1.5, unemployment: 1.1, exportsUsd: 330000000000, importsUsd: 290000000000, debtToGdp: 63, policyRate: 2.5, exchangeRate: 35.1, medianAge: 40.1, fertility: 1.21, urbanization: 53.6, laborForceParticipation: 68.3, gini: 35.4, renewablesShare: 14, emissionsPerCapita: 3.8, electricityAccess: 100, internetPenetration: 88, logisticsScore: 3.4, businessClimate: 71 } },
  { slug: "sweden", m: { population: 10600000, gdpCurrentUsd: 650000000000, gdpGrowth: 1.8, inflationCpi: 2.1, inflationPpi: 1.7, unemployment: 7.5, exportsUsd: 270000000000, importsUsd: 250000000000, debtToGdp: 31, policyRate: 2.75, exchangeRate: 10.5, medianAge: 41.3, fertility: 1.44, urbanization: 88.1, laborForceParticipation: 67.6, gini: 29.5, renewablesShare: 61, emissionsPerCapita: 3.1, electricityAccess: 100, internetPenetration: 98, logisticsScore: 4.2, businessClimate: 90 } },
];

function interpolateValue(baseValue: number, year: number, trendProfile: string): number {
  const yearOffset = year - latestYear;
  const driftRates: Record<string, number> = {
    mature: 0.02, emerging: 0.04, commodity: 0.03, frontier: 0.05,
    "oil-exporter": 0.025, "manufacturing-hub": 0.035,
  };
  const rate = driftRates[trendProfile] ?? 0.03;
  return Math.round(baseValue * Math.pow(1 + rate, yearOffset));
}

function generateObservations() {
  const observations: GeneratedObservation[] = [];
  const trendProfiles: Record<string, string> = {
    "united-states": "mature", "canada": "mature", "mexico": "manufacturing-hub",
    "brazil": "commodity", "argentina": "commodity", "chile": "commodity",
    "germany": "mature", "france": "mature", "united-kingdom": "mature",
    "italy": "mature", "spain": "mature", "poland": "manufacturing-hub",
    "turkiye": "manufacturing-hub", "russia": "commodity", "saudi-arabia": "oil-exporter",
    "united-arab-emirates": "oil-exporter", "south-africa": "commodity",
    "nigeria": "frontier", "egypt": "emerging", "india": "emerging",
    "china": "manufacturing-hub", "indonesia": "emerging", "japan": "mature",
    "south-korea": "manufacturing-hub", "australia": "commodity",
    "vietnam": "manufacturing-hub", "thailand": "manufacturing-hub", "sweden": "mature",
  };

  for (const country of countrySeeds) {
    const profile = trendProfiles[country.slug] ?? "emerging";
    const metrics = country.m;

    for (const [metricKey, indicator] of Object.entries(metricToIndicator)) {
      const baseValue = (metrics as Record<string, number>)[metricKey];
      if (baseValue === undefined) continue;

      for (const year of historyYears) {
        let value: number | null = null;
        if (indicator.source === "world-bank" || indicator.source === "undesa" || indicator.source === "ilo") {
          value = interpolateValue(baseValue, year, profile);
        } else if (indicator.source === "imf-weo") {
          value = Number((baseValue * (1 + (year - latestYear) * 0.01)).toFixed(2));
        } else {
          value = baseValue;
        }

        observations.push({
          entityId: country.slug,
          indicatorId: indicator.id,
          year,
          value,
          sourceId: indicator.source,
        });
      }
    }

    // GDP per capita is derived
    for (const year of historyYears) {
      const pop = interpolateValue(metrics.population, year, profile);
      const gdp = interpolateValue(metrics.gdpCurrentUsd, year, profile);
      observations.push({
        entityId: country.slug,
        indicatorId: "gdp-per-capita",
        year,
        value: Math.round(gdp / pop),
        sourceId: "mapfactbook-lab",
        note: "Derived from GDP and population",
      });
    }
  }

  return observations;
}

async function main() {
  const observations = generateObservations();
  const output = {
    schemaVersion: "1",
    generatedAt: new Date().toISOString(),
    latestYear,
    historyYears,
    observations,
  };

  const outputPath = path.join(process.cwd(), "src", "data", "generated", "world-bank-core.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`Generated ${observations.length} observations for ${countrySeeds.length} countries → ${outputPath}`);
}

main().catch(console.error);
