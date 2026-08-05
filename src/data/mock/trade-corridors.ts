/**
 * Supply Chain Mapping & Trade Corridors
 * 
 * Models major global trade corridors, logistics routes, and supply chain
 * connections between cities, ports, and economic zones.
 */

export type TradeCorridor = {
  id: string;
  name: string;
  type: "maritime" | "rail" | "road" | "air" | "pipeline" | "digital";
  originCity: string;
  destinationCity: string;
  originCountry: string;
  destinationCountry: string;
  annualVolumeUsd?: number;
  primaryCommodities: string[];
  transitTimeDays?: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  chokepoints?: string[];
  strategicImportance: string;
};

export type LogisticsHub = {
  id: string;
  name: string;
  type: "port" | "airport" | "rail_terminal" | "dry_port" | "free_zone";
  citySlug: string;
  countryIso3: string;
  throughput?: number;
  throughputUnit?: string;
  worldRanking?: number;
  connectedCorridors: string[];
  operator?: string;
};

export type TradeFlow = {
  id: string;
  reporterCountry: string;
  partnerCountry: string;
  year: number;
  exportValueUsd: number;
  importValueUsd: number;
  topExportCommodities: { name: string; valueUsd: number; share: number }[];
  topImportCommodities: { name: string; valueUsd: number; share: number }[];
  balanceUsd: number;
};

/**
 * Major global trade corridors
 */
export const tradeCorridors: TradeCorridor[] = [
  {
    id: "corridor-asia-europe-maritime",
    name: "Asia-Europe Maritime (Suez)",
    type: "maritime",
    originCity: "shanghai",
    destinationCity: "rotterdam",
    originCountry: "CHN",
    destinationCountry: "NLD",
    annualVolumeUsd: 1_500_000_000_000,
    primaryCommodities: ["Electronics", "Machinery", "Textiles", "Automobiles"],
    transitTimeDays: 30,
    riskLevel: "high",
    chokepoints: ["Strait of Malacca", "Suez Canal", "Strait of Gibraltar"],
    strategicImportance: "World's busiest trade route connecting East Asian manufacturing to European consumers",
  },
  {
    id: "corridor-transpacific",
    name: "Trans-Pacific Maritime",
    type: "maritime",
    originCity: "shanghai",
    destinationCity: "los-angeles",
    originCountry: "CHN",
    destinationCountry: "USA",
    annualVolumeUsd: 1_200_000_000_000,
    primaryCommodities: ["Electronics", "Apparel", "Machinery", "Furniture"],
    transitTimeDays: 18,
    riskLevel: "medium",
    chokepoints: ["Panama Canal (alternate)"],
    strategicImportance: "Critical Asia-US trade artery with massive container volumes",
  },
  {
    id: "corridor-china-europe-rail",
    name: "China-Europe Rail (Belt & Road)",
    type: "rail",
    originCity: "yiwu",
    destinationCity: "duisburg",
    originCountry: "CHN",
    destinationCountry: "DEU",
    annualVolumeUsd: 75_000_000_000,
    primaryCommodities: ["Electronics", "Auto parts", "Machinery", "Consumer goods"],
    transitTimeDays: 16,
    riskLevel: "medium",
    chokepoints: ["Khorgos Gateway", "Brest/Malaszewicze"],
    strategicImportance: "Overland alternative to maritime with faster transit for time-sensitive cargo",
  },
  {
    id: "corridor-strait-malacca",
    name: "Strait of Malacca Energy Corridor",
    type: "maritime",
    originCity: "singapore-sg",
    destinationCity: "shanghai",
    originCountry: "SGP",
    destinationCountry: "CHN",
    annualVolumeUsd: 500_000_000_000,
    primaryCommodities: ["Crude oil", "LNG", "Petroleum products"],
    transitTimeDays: 7,
    riskLevel: "critical",
    chokepoints: ["Strait of Malacca"],
    strategicImportance: "World's second busiest chokepoint carrying 25% of global trade and 25% of oil shipments",
  },
  {
    id: "corridor-suez-energy",
    name: "Suez-Mediterranean Energy Corridor",
    type: "maritime",
    originCity: "jeddah",
    destinationCity: "marseille",
    originCountry: "SAU",
    destinationCountry: "FRA",
    annualVolumeUsd: 400_000_000_000,
    primaryCommodities: ["Crude oil", "Refined products", "LNG", "Chemicals"],
    transitTimeDays: 14,
    riskLevel: "high",
    chokepoints: ["Suez Canal", "Bab el-Mandeb"],
    strategicImportance: "Primary energy supply route from Middle East to Europe",
  },
  {
    id: "corridor-panama",
    name: "Panama Canal Corridor",
    type: "maritime",
    originCity: "shanghai",
    destinationCity: "new-york",
    originCountry: "CHN",
    destinationCountry: "USA",
    annualVolumeUsd: 300_000_000_000,
    primaryCommodities: ["Grain", "Containers", "LNG", "Vehicles"],
    transitTimeDays: 22,
    riskLevel: "medium",
    chokepoints: ["Panama Canal"],
    strategicImportance: "Connects Atlantic and Pacific with LNG and grain as fast-growing segments",
  },
  {
    id: "corridor-digital-asia",
    name: "Asia Digital Corridor",
    type: "digital",
    originCity: "singapore-sg",
    destinationCity: "tokyo",
    originCountry: "SGP",
    destinationCountry: "JPN",
    annualVolumeUsd: 200_000_000_000,
    primaryCommodities: ["Data services", "Fintech", "Cloud computing"],
    transitTimeDays: 0,
    riskLevel: "low",
    chokepoints: ["Submarine cable landing points"],
    strategicImportance: "Growing digital services trade between Asian financial centers",
  },
  {
    id: "corridor-brazil-china",
    name: "Brazil-China Commodity Corridor",
    type: "maritime",
    originCity: "santos-br",
    destinationCity: "qingdao",
    originCountry: "BRA",
    destinationCountry: "CHN",
    annualVolumeUsd: 100_000_000_000,
    primaryCommodities: ["Soybeans", "Iron ore", "Crude oil", "Beef"],
    transitTimeDays: 35,
    riskLevel: "medium",
    chokepoints: ["Cape of Good Hope (alternate)"],
    strategicImportance: "Largest South-South trade route driven by Chinese commodity demand",
  },
  {
    id: "corridor-gulf-asia",
    name: "Gulf-Asia Energy Corridor",
    type: "maritime",
    originCity: "doha",
    destinationCity: "tokyo",
    originCountry: "QAT",
    destinationCountry: "JPN",
    annualVolumeUsd: 150_000_000_000,
    primaryCommodities: ["LNG", "Petrochemicals", "Aluminum"],
    transitTimeDays: 14,
    riskLevel: "high",
    chokepoints: ["Strait of Hormuz", "Strait of Malacca"],
    strategicImportance: "Qatar's LNG exports to Asian energy markets",
  },
  {
    id: "corridor-silk-road-central",
    name: "Central Asia Silk Road",
    type: "rail",
    originCity: "urumqi",
    destinationCity: "tehran",
    originCountry: "CHN",
    destinationCountry: "IRN",
    annualVolumeUsd: 25_000_000_000,
    primaryCommodities: ["Textiles", "Machinery", "Construction materials"],
    transitTimeDays: 12,
    riskLevel: "high",
    chokepoints: ["Kazakhstan border crossings"],
    strategicImportance: "Belt & Road Initiative extension into Central and Western Asia",
  },
  {
    id: "corridor-africa-minerals",
    name: "Southern Africa Minerals Corridor",
    type: "rail",
    originCity: "lubumbashi",
    destinationCity: "durban",
    originCountry: "COD",
    destinationCountry: "ZAF",
    annualVolumeUsd: 35_000_000_000,
    primaryCommodities: ["Copper", "Cobalt", "Manganese", "Chromium"],
    transitTimeDays: 8,
    riskLevel: "medium",
    chokepoints: ["Beitbridge border post"],
    strategicImportance: "Critical minerals supply chain for battery and electronics manufacturing",
  },
  {
    id: "corridor-arctic-northern",
    name: "Northern Sea Route",
    type: "maritime",
    originCity: "murmansk",
    destinationCity: "shanghai",
    originCountry: "RUS",
    destinationCountry: "CHN",
    annualVolumeUsd: 15_000_000_000,
    primaryCommodities: ["LNG", "Oil", "Minerals"],
    transitTimeDays: 20,
    riskLevel: "high",
    chokepoints: ["Bering Strait"],
    strategicImportance: "Emerging shorter Arctic route between Europe and Asia (seasonal)",
  },
];

/**
 * Major logistics hubs worldwide
 */
export const logisticsHubs: LogisticsHub[] = [
  { id: "hub-shanghai-port", name: "Port of Shanghai", type: "port", citySlug: "shanghai", countryIso3: "CHN", throughput: 47_030_000, throughputUnit: "TEU", worldRanking: 1, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
  { id: "hub-singapore-port", name: "Port of Singapore", type: "port", citySlug: "singapore-sg", countryIso3: "SGP", throughput: 37_290_000, throughputUnit: "TEU", worldRanking: 2, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-strait-malacca"] },
  { id: "hub-rotterdam-port", name: "Port of Rotterdam", type: "port", citySlug: "rotterdam", countryIso3: "NLD", throughput: 14_460_000, throughputUnit: "TEU", worldRanking: 10, connectedCorridors: ["corridor-asia-europe-maritime"] },
  { id: "hub-jebel-ali", name: "Jebel Ali Port", type: "port", citySlug: "dubai", countryIso3: "ARE", throughput: 13_500_000, throughputUnit: "TEU", worldRanking: 11, connectedCorridors: ["corridor-suez-energy", "corridor-gulf-asia"] },
  { id: "hub-los-angeles-port", name: "Port of Los Angeles", type: "port", citySlug: "los-angeles", countryIso3: "USA", throughput: 9_910_000, throughputUnit: "TEU", worldRanking: 17, connectedCorridors: ["corridor-transpacific"] },
  { id: "hub-shenzhen-port", name: "Port of Shenzhen", type: "port", citySlug: "shenzhen", countryIso3: "CHN", throughput: 28_800_000, throughputUnit: "TEU", worldRanking: 4, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
  { id: "hub-hongkong-port", name: "Port of Hong Kong", type: "port", citySlug: "hong-kong", countryIso3: "HKG", throughput: 14_340_000, throughputUnit: "TEU", worldRanking: 9, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
  { id: "hub-busan-port", name: "Port of Busan", type: "port", citySlug: "busan", countryIso3: "KOR", throughput: 21_660_000, throughputUnit: "TEU", worldRanking: 7, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
  { id: "hub-antwerp-port", name: "Port of Antwerp", type: "port", citySlug: "antwerp", countryIso3: "BEL", throughput: 12_020_000, throughputUnit: "TEU", worldRanking: 14, connectedCorridors: ["corridor-asia-europe-maritime"] },
  { id: "hub-hamburg-port", name: "Port of Hamburg", type: "port", citySlug: "hamburg", countryIso3: "DEU", throughput: 8_330_000, throughputUnit: "TEU", worldRanking: 20, connectedCorridors: ["corridor-asia-europe-maritime"] },
  { id: "hub-hkia", name: "Hong Kong International Airport", type: "airport", citySlug: "hong-kong", countryIso3: "HKG", throughput: 4_200_000, throughputUnit: "tonnes cargo", worldRanking: 1, connectedCorridors: ["corridor-transpacific"] },
  { id: "hub-memphis", name: "Memphis (FedEx SuperHub)", type: "airport", citySlug: "memphis", countryIso3: "USA", throughput: 4_500_000, throughputUnit: "tonnes cargo", worldRanking: 2, connectedCorridors: ["corridor-transpacific"] },
  { id: "hub-pudong", name: "Shanghai Pudong Airport", type: "airport", citySlug: "shanghai", countryIso3: "CHN", throughput: 3_400_000, throughputUnit: "tonnes cargo", worldRanking: 3, connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
  { id: "hub-dubai-air", name: "Dubai International Airport", type: "airport", citySlug: "dubai", countryIso3: "ARE", throughput: 2_400_000, throughputUnit: "tonnes cargo", worldRanking: 6, connectedCorridors: ["corridor-suez-energy", "corridor-gulf-asia"] },
  { id: "hub-frankfurt-air", name: "Frankfurt Airport", type: "airport", citySlug: "frankfurt", countryIso3: "DEU", throughput: 2_100_000, throughputUnit: "tonnes cargo", worldRanking: 11, connectedCorridors: ["corridor-asia-europe-maritime"] },
  { id: "hub-dry-khorgos", name: "Khorgos Dry Port", type: "dry_port", citySlug: "khorgos", countryIso3: "KAZ", throughput: 300_000, throughputUnit: "TEU", connectedCorridors: ["corridor-china-europe-rail", "corridor-silk-road-central"] },
  { id: "hub-dry-duisburg", name: "Duisburg Intermodal Terminal", type: "dry_port", citySlug: "duisburg", countryIso3: "DEU", throughput: 300_000, throughputUnit: "TEU", connectedCorridors: ["corridor-china-europe-rail"] },
  { id: "hub-jafza", name: "JAFZA Free Zone", type: "free_zone", citySlug: "dubai", countryIso3: "ARE", throughput: 0, throughputUnit: "companies", connectedCorridors: ["corridor-suez-energy", "corridor-gulf-asia"] },
  { id: "hub-qianhai", name: "Qianhai Free Trade Zone", type: "free_zone", citySlug: "shenzhen", countryIso3: "CHN", throughput: 0, throughputUnit: "companies", connectedCorridors: ["corridor-asia-europe-maritime", "corridor-transpacific"] },
];

/**
 * Bilateral trade flows between major economies
 */
export const bilateralTradeFlows: TradeFlow[] = [
  {
    id: "tf-usa-chn-2024",
    reporterCountry: "USA",
    partnerCountry: "CHN",
    year: 2024,
    exportValueUsd: 150_000_000_000,
    importValueUsd: 440_000_000_000,
    topExportCommodities: [
      { name: "Semiconductors", valueUsd: 28_000_000_000, share: 19 },
      { name: "Aircraft & parts", valueUsd: 15_000_000_000, share: 10 },
      { name: "Soybeans", valueUsd: 12_000_000_000, share: 8 },
      { name: "Crude oil", valueUsd: 10_000_000_000, share: 7 },
    ],
    topImportCommodities: [
      { name: "Consumer electronics", valueUsd: 95_000_000_000, share: 22 },
      { name: "Machinery", valueUsd: 68_000_000_000, share: 15 },
      { name: "Apparel & textiles", valueUsd: 42_000_000_000, share: 10 },
      { name: "Furniture", valueUsd: 28_000_000_000, share: 6 },
    ],
    balanceUsd: -290_000_000_000,
  },
  {
    id: "tf-deu-chn-2024",
    reporterCountry: "DEU",
    partnerCountry: "CHN",
    year: 2024,
    exportValueUsd: 110_000_000_000,
    importValueUsd: 165_000_000_000,
    topExportCommodities: [
      { name: "Automobiles", valueUsd: 32_000_000_000, share: 29 },
      { name: "Machinery", valueUsd: 22_000_000_000, share: 20 },
      { name: "Chemicals", valueUsd: 12_000_000_000, share: 11 },
      { name: "Aircraft parts", valueUsd: 8_000_000_000, share: 7 },
    ],
    topImportCommodities: [
      { name: "Electronics", valueUsd: 42_000_000_000, share: 25 },
      { name: "Machinery", valueUsd: 28_000_000_000, share: 17 },
      { name: "Toys & games", valueUsd: 12_000_000_000, share: 7 },
      { name: "Batteries", valueUsd: 10_000_000_000, share: 6 },
    ],
    balanceUsd: -55_000_000_000,
  },
  {
    id: "tf-usa-deu-2024",
    reporterCountry: "USA",
    partnerCountry: "DEU",
    year: 2024,
    exportValueUsd: 75_000_000_000,
    importValueUsd: 145_000_000_000,
    topExportCommodities: [
      { name: "Aircraft", valueUsd: 12_000_000_000, share: 16 },
      { name: "Pharmaceuticals", valueUsd: 10_000_000_000, share: 13 },
      { name: "Semiconductors", valueUsd: 8_000_000_000, share: 11 },
      { name: "Medical equipment", valueUsd: 7_000_000_000, share: 9 },
    ],
    topImportCommodities: [
      { name: "Automobiles", valueUsd: 52_000_000_000, share: 36 },
      { name: "Pharmaceuticals", valueUsd: 18_000_000_000, share: 12 },
      { name: "Machinery", valueUsd: 14_000_000_000, share: 10 },
      { name: "Auto parts", valueUsd: 10_000_000_000, share: 7 },
    ],
    balanceUsd: -70_000_000_000,
  },
  {
    id: "tf-jpn-kor-2024",
    reporterCountry: "JPN",
    partnerCountry: "KOR",
    year: 2024,
    exportValueUsd: 52_000_000_000,
    importValueUsd: 35_000_000_000,
    topExportCommodities: [
      { name: "Semiconductor equipment", valueUsd: 14_000_000_000, share: 27 },
      { name: "Steel", valueUsd: 6_000_000_000, share: 12 },
      { name: "Chemicals", valueUsd: 5_000_000_000, share: 10 },
      { name: "Auto parts", valueUsd: 4_000_000_000, share: 8 },
    ],
    topImportCommodities: [
      { name: "Semiconductors", valueUsd: 8_000_000_000, share: 23 },
      { name: "Petroleum products", valueUsd: 6_000_000_000, share: 17 },
      { name: "Steel", valueUsd: 4_000_000_000, share: 11 },
      { name: "Machinery", valueUsd: 3_000_000_000, share: 9 },
    ],
    balanceUsd: 17_000_000_000,
  },
  {
    id: "tf-gbr-usa-2024",
    reporterCountry: "GBR",
    partnerCountry: "USA",
    year: 2024,
    exportValueUsd: 72_000_000_000,
    importValueUsd: 68_000_000_000,
    topExportCommodities: [
      { name: "Pharmaceuticals", valueUsd: 14_000_000_000, share: 19 },
      { name: "Financial services", valueUsd: 12_000_000_000, share: 17 },
      { name: "Automobiles", valueUsd: 8_000_000_000, share: 11 },
      { name: "Aerospace", valueUsd: 6_000_000_000, share: 8 },
    ],
    topImportCommodities: [
      { name: "Aircraft", valueUsd: 10_000_000_000, share: 15 },
      { name: "Pharmaceuticals", valueUsd: 8_000_000_000, share: 12 },
      { name: "Crude oil", valueUsd: 7_000_000_000, share: 10 },
      { name: "Medical equipment", valueUsd: 5_000_000_000, share: 7 },
    ],
    balanceUsd: 4_000_000_000,
  },
];

/**
 * Get corridors passing through a specific country
 */
export function getCorridorsByCountry(countryIso3: string): TradeCorridor[] {
  return tradeCorridors.filter(
    (c) => c.originCountry === countryIso3 || c.destinationCountry === countryIso3,
  );
}

/**
 * Get hubs located in a specific city
 */
export function getHubsByCity(citySlug: string): LogisticsHub[] {
  return logisticsHubs.filter((h) => h.citySlug === citySlug);
}

/**
 * Get high-risk corridors
 */
export function getHighRiskCorridors(): TradeCorridor[] {
  return tradeCorridors.filter((c) => c.riskLevel === "high" || c.riskLevel === "critical");
}

/**
 * Calculate corridor concentration (which corridors carry the most value)
 */
export function getTopCorridorsByVolume(limit = 5): TradeCorridor[] {
  return [...tradeCorridors]
    .filter((c) => c.annualVolumeUsd)
    .sort((a, b) => (b.annualVolumeUsd ?? 0) - (a.annualVolumeUsd ?? 0))
    .slice(0, limit);
}
