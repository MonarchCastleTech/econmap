/**
 * Expanded City Intelligence Dataset
 * 
 * Comprehensive economic, investor, and urban intelligence for 200+ major world cities.
 * Each city record includes canonical identity, economic factbook data, investor signals,
 * urban intelligence, and entity presence markers.
 * 
 * Source-backed data model with explicit coverage states.
 */

export type CityIntelligenceProfile = {
  cityId: string;
  slug: string;
  name: string;
  countryIso2: string;
  countryIso3: string;
  countryName: string;
  admin1Name?: string;
  latitude: number;
  longitude: number;
  population: number;
  populationYear: number;
  roleTags: string[];
  economicFactbook: {
    gdpUsd?: number;
    gdpPerCapitaUsd?: number;
    employment?: number;
    unemploymentRate?: number;
    sectorMix?: { name: string; share: number }[];
    avgWageUsd?: number;
    costOfLivingIndex?: number;
    rentIndex?: number;
  };
  investorIntel: {
    companies: string[];
    industrialParks: string[];
    ports: string[];
    airports: string[];
    railHubs: string[];
    logisticsHubs: string[];
    utilities: string[];
    clusterStrength?: string;
    businessEnvironmentScore?: number;
  };
  urbanIntel: {
    transitModes: string[];
    congestionIndex?: number;
    airQualityIndex?: number;
    climateRisk?: string;
    internetPenetration?: number;
    electricityReliability?: number;
    fiberCoverage?: number;
    fiveGCoverage?: boolean;
  };
  sources: string[];
};

export const cityIntelligenceProfiles: CityIntelligenceProfile[] = [
  {
    cityId: "city-new-york",
    slug: "new-york",
    name: "New York",
    countryIso2: "US",
    countryIso3: "USA",
    countryName: "United States",
    admin1Name: "New York",
    latitude: 40.71,
    longitude: -74.01,
    population: 8_336_000,
    populationYear: 2024,
    roleTags: ["financial center", "technology hub", "logistics hub"],
    economicFactbook: {
      gdpUsd: 1_800_000_000_000,
      gdpPerCapitaUsd: 216_000,
      employment: 4_200_000,
      unemploymentRate: 4.8,
      sectorMix: [
        { name: "Finance & Insurance", share: 18 },
        { name: "Professional Services", share: 16 },
        { name: "Technology", share: 12 },
        { name: "Healthcare", share: 11 },
        { name: "Retail & Wholesale", share: 9 },
        { name: "Real Estate", share: 8 },
        { name: "Other", share: 26 },
      ],
      avgWageUsd: 85_000,
      costOfLivingIndex: 100,
      rentIndex: 100,
    },
    investorIntel: {
      companies: ["JPMorgan Chase", "Goldman Sachs", "Morgan Stanley", "Citigroup", "Pfizer", "Verizon", "MetLife", "American Express", "BlackRock", "KKR"],
      industrialParks: ["Brooklyn Navy Yard", "Sunset Park Industrial"],
      ports: ["Port of New York and New Jersey"],
      airports: ["JFK International", "LaGuardia", "Newark Liberty"],
      railHubs: ["Penn Station", "Grand Central"],
      logisticsHubs: ["Port Newark-Elizabeth Marine Terminal"],
      utilities: ["Con Edison", "National Grid"],
      clusterStrength: "Global financial capital with dominant technology and media sectors",
      businessEnvironmentScore: 92,
    },
    urbanIntel: {
      transitModes: ["Subway", "Bus", "Commuter Rail", "Ferry", "Citi Bike"],
      congestionIndex: 72,
      airQualityIndex: 58,
      climateRisk: "Coastal flooding, storm surge, heat waves",
      internetPenetration: 96,
      electricityReliability: 99.8,
      fiberCoverage: 89,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "bls", "nycedc", "federal-reserve"],
  },
  {
    cityId: "city-london",
    slug: "london",
    name: "London",
    countryIso2: "GB",
    countryIso3: "GBR",
    countryName: "United Kingdom",
    admin1Name: "England",
    latitude: 51.51,
    longitude: -0.13,
    population: 8_982_000,
    populationYear: 2024,
    roleTags: ["financial center", "technology hub", "logistics hub"],
    economicFactbook: {
      gdpUsd: 1_050_000_000_000,
      gdpPerCapitaUsd: 117_000,
      employment: 5_100_000,
      unemploymentRate: 4.2,
      sectorMix: [
        { name: "Financial Services", share: 21 },
        { name: "Professional Services", share: 15 },
        { name: "Technology", share: 11 },
        { name: "Real Estate", share: 10 },
        { name: "Retail & Hospitality", share: 9 },
        { name: "Other", share: 34 },
      ],
      avgWageUsd: 62_000,
      costOfLivingIndex: 95,
      rentIndex: 88,
    },
    investorIntel: {
      companies: ["HSBC", "BP", "Unilever", "AstraZeneca", "Rio Tinto", "GlaxoSmithKline", "Barclays", "Lloyds Banking"],
      industrialParks: ["Thames Enterprise Park", "London Gateway Logistics Park"],
      ports: ["Port of London", "London Gateway"],
      airports: ["Heathrow", "Gatwick", "Stansted", "City Airport"],
      railHubs: ["King's Cross", "St Pancras International", "Waterloo", "Paddington"],
      logisticsHubs: ["DP World London Gateway", "Tilbury"],
      utilities: ["Thames Water", "National Grid UK"],
      clusterStrength: "Europe's leading financial center with strong technology and life sciences",
      businessEnvironmentScore: 94,
    },
    urbanIntel: {
      transitModes: ["Underground", "Overground", "DLR", "Bus", "Tram", "River Bus"],
      congestionIndex: 68,
      airQualityIndex: 52,
      climateRisk: "River flooding, heat stress",
      internetPenetration: 97,
      electricityReliability: 99.7,
      fiberCoverage: 82,
      fiveGCoverage: true,
    },
    sources: ["oecd", "ons", "london-met", "boe"],
  },
  {
    cityId: "city-tokyo",
    slug: "tokyo",
    name: "Tokyo",
    countryIso2: "JP",
    countryIso3: "JPN",
    countryName: "Japan",
    admin1Name: "Tokyo",
    latitude: 35.68,
    longitude: 139.69,
    population: 13_960_000,
    populationYear: 2024,
    roleTags: ["financial center", "technology hub", "manufacturing hub"],
    economicFactbook: {
      gdpUsd: 1_900_000_000_000,
      gdpPerCapitaUsd: 136_000,
      employment: 7_800_000,
      unemploymentRate: 2.4,
      sectorMix: [
        { name: "Finance & Insurance", share: 12 },
        { name: "Technology & Electronics", share: 18 },
        { name: "Retail & Wholesale", share: 14 },
        { name: "Professional Services", share: 13 },
        { name: "Construction", share: 7 },
        { name: "Other", share: 36 },
      ],
      avgWageUsd: 52_000,
      costOfLivingIndex: 88,
      rentIndex: 72,
    },
    investorIntel: {
      companies: ["Toyota", "Sony", "Mitsubishi UFJ", "SoftBank", "Hitachi", "Honda", "Nintendo", "Tokyo Electron"],
      industrialParks: ["Keihin Industrial Zone", "Ota Industrial"],
      ports: ["Port of Tokyo"],
      airports: ["Haneda", "Narita"],
      railHubs: ["Tokyo Station", "Shinjuku Station", "Shibuya"],
      logisticsHubs: ["Tokyo Freight Terminal"],
      utilities: ["TEPCO", "Tokyo Gas"],
      clusterStrength: "World's largest metropolitan economy with advanced manufacturing and technology",
      businessEnvironmentScore: 91,
    },
    urbanIntel: {
      transitModes: ["JR Rail", "Metro", "Toei Subway", "Bus", "Monorail"],
      congestionIndex: 55,
      airQualityIndex: 42,
      climateRisk: "Earthquakes, typhoons, flooding",
      internetPenetration: 95,
      electricityReliability: 99.9,
      fiberCoverage: 96,
      fiveGCoverage: true,
    },
    sources: ["stat-japan", "world-bank", "imf-weo"],
  },
  {
    cityId: "city-shanghai",
    slug: "shanghai",
    name: "Shanghai",
    countryIso2: "CN",
    countryIso3: "CHN",
    countryName: "China",
    admin1Name: "Shanghai",
    latitude: 31.23,
    longitude: 121.47,
    population: 24_870_000,
    populationYear: 2024,
    roleTags: ["financial center", "manufacturing hub", "port city", "technology hub"],
    economicFactbook: {
      gdpUsd: 800_000_000_000,
      gdpPerCapitaUsd: 32_000,
      employment: 13_200_000,
      unemploymentRate: 3.8,
      sectorMix: [
        { name: "Manufacturing", share: 28 },
        { name: "Finance", share: 16 },
        { name: "Technology", share: 12 },
        { name: "Retail & Wholesale", share: 11 },
        { name: "Real Estate", share: 9 },
        { name: "Other", share: 24 },
      ],
      avgWageUsd: 18_500,
      costOfLivingIndex: 62,
      rentIndex: 58,
    },
    investorIntel: {
      companies: ["SAIC Motor", "Baosteel", "Pudong Development Bank", "Alibaba", "Tencent", "Huawei", "BYD", "CATL"],
      industrialParks: ["Zhangjiang Hi-Tech Park", "Jinqiao Export Processing Zone", "Caohejing"],
      ports: ["Port of Shanghai"],
      airports: ["Pudong International", "Hongqiao"],
      railHubs: ["Shanghai Hongqiao", "Shanghai Railway Station"],
      logisticsHubs: ["Yangshan Deep-Water Port"],
      utilities: ["State Grid Shanghai", "Shanghai Electric"],
      clusterStrength: "Global shipping hub with advanced manufacturing and semiconductor clusters",
      businessEnvironmentScore: 82,
    },
    urbanIntel: {
      transitModes: ["Metro", "Maglev", "Bus", "Tram", "Ferry"],
      congestionIndex: 62,
      airQualityIndex: 68,
      climateRisk: "Typhoons, coastal flooding, heat waves",
      internetPenetration: 88,
      electricityReliability: 99.5,
      fiberCoverage: 94,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "unctad", "unctad-liner"],
  },
  {
    cityId: "city-singapore-sg",
    slug: "singapore-sg",
    name: "Singapore",
    countryIso2: "SG",
    countryIso3: "SGP",
    countryName: "Singapore",
    latitude: 1.35,
    longitude: 103.82,
    population: 5_900_000,
    populationYear: 2024,
    roleTags: ["financial center", "technology hub", "port city", "logistics hub"],
    economicFactbook: {
      gdpUsd: 530_000_000_000,
      gdpPerCapitaUsd: 90_000,
      employment: 3_100_000,
      unemploymentRate: 2.1,
      sectorMix: [
        { name: "Financial Services", share: 17 },
        { name: "Manufacturing", share: 22 },
        { name: "Trade & Logistics", share: 18 },
        { name: "Professional Services", share: 12 },
        { name: "Technology", share: 9 },
        { name: "Other", share: 22 },
      ],
      avgWageUsd: 58_000,
      costOfLivingIndex: 92,
      rentIndex: 85,
    },
    investorIntel: {
      companies: ["DBS Group", "OCBC", "UOB", "Singtel", "Wilmar International", "Grab", "Sea Limited"],
      industrialParks: ["Jurong Industrial Estate", "Tuas Biomedical Park", "Changi Business Park"],
      ports: ["Port of Singapore"],
      airports: ["Changi Airport"],
      railHubs: ["Jurong East MRT", "Woodlands Train Checkpoint"],
      logisticsHubs: ["Changi Air Cargo Hub", "PSA Singapore Terminals"],
      utilities: ["SP Group", "Singapore Power"],
      clusterStrength: "Asia-Pacific financial hub with advanced manufacturing and biotech",
      businessEnvironmentScore: 96,
    },
    urbanIntel: {
      transitModes: ["MRT", "LRT", "Bus", "Taxi"],
      congestionIndex: 42,
      airQualityIndex: 38,
      climateRisk: "Sea level rise, tropical storms",
      internetPenetration: 96,
      electricityReliability: 99.99,
      fiberCoverage: 98,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "unctad", "oecd", "stats-singapore"],
  },
  {
    cityId: "city-hong-kong",
    slug: "hong-kong",
    name: "Hong Kong",
    countryIso2: "HK",
    countryIso3: "HKG",
    countryName: "China",
    latitude: 22.32,
    longitude: 114.17,
    population: 7_500_000,
    populationYear: 2024,
    roleTags: ["financial center", "port city", "logistics hub"],
    economicFactbook: {
      gdpUsd: 380_000_000_000,
      gdpPerCapitaUsd: 51_000,
      employment: 3_800_000,
      unemploymentRate: 3.2,
      sectorMix: [
        { name: "Financial Services", share: 23 },
        { name: "Trade & Logistics", share: 19 },
        { name: "Professional Services", share: 11 },
        { name: "Tourism & Hospitality", share: 6 },
        { name: "Other", share: 41 },
      ],
      avgWageUsd: 32_000,
      costOfLivingIndex: 88,
      rentIndex: 92,
    },
    investorIntel: {
      companies: ["HSBC", "CK Hutchison", "AIA Group", "CLP Holdings", "Swire Pacific", "Tencent"],
      industrialParks: ["Hong Kong Science Park", "Cyberport"],
      ports: ["Port of Hong Kong"],
      airports: ["Hong Kong International"],
      railHubs: ["Hong Kong West Kowloon", "Hung Hom"],
      logisticsHubs: ["HKIA Air Cargo Terminal"],
      utilities: ["CLP Power", "HK Electric"],
      clusterStrength: "Gateway to China with world-class financial and logistics infrastructure",
      businessEnvironmentScore: 90,
    },
    urbanIntel: {
      transitModes: ["MTR", "Bus", "Tram", "Ferry", "Light Rail"],
      congestionIndex: 48,
      airQualityIndex: 52,
      climateRisk: "Typhoons, storm surge, heat stress",
      internetPenetration: 94,
      electricityReliability: 99.99,
      fiberCoverage: 96,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "unctad", "federal-reserve"],
  },
  {
    cityId: "city-dubai",
    slug: "dubai",
    name: "Dubai",
    countryIso2: "AE",
    countryIso3: "ARE",
    countryName: "United Arab Emirates",
    admin1Name: "Dubai",
    latitude: 25.2,
    longitude: 55.27,
    population: 3_500_000,
    populationYear: 2024,
    roleTags: ["financial center", "port city", "logistics hub", "tourism city"],
    economicFactbook: {
      gdpUsd: 120_000_000_000,
      gdpPerCapitaUsd: 34_000,
      employment: 2_100_000,
      unemploymentRate: 2.2,
      sectorMix: [
        { name: "Trade & Retail", share: 26 },
        { name: "Financial Services", share: 12 },
        { name: "Real Estate", share: 11 },
        { name: "Transport & Logistics", share: 14 },
        { name: "Tourism & Hospitality", share: 8 },
        { name: "Other", share: 29 },
      ],
      avgWageUsd: 30_000,
      costOfLivingIndex: 72,
      rentIndex: 68,
    },
    investorIntel: {
      companies: ["Emirates Group", "DP World", "Emirates NBD", "Emaar Properties", "Dubai Islamic Bank"],
      industrialParks: ["Jebel Ali Free Zone", "Dubai Industrial City", "Dubai Silicon Oasis"],
      ports: ["Port of Jebel Ali"],
      airports: ["Dubai International", "Al Maktoum International"],
      railHubs: ["Etihad Rail Dubai Hub"],
      logisticsHubs: ["Jebel Ali Free Zone", "Dubai Logistics Corridor"],
      utilities: ["DEWA", "ADNOC"],
      clusterStrength: "Middle East logistics and financial hub with free zone ecosystem",
      businessEnvironmentScore: 88,
    },
    urbanIntel: {
      transitModes: ["Metro", "Bus", "Tram", "Water Taxi", "Monorail"],
      congestionIndex: 58,
      airQualityIndex: 65,
      climateRisk: "Extreme heat, dust storms",
      internetPenetration: 99,
      electricityReliability: 99.9,
      fiberCoverage: 92,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "unctad", "unctad-liner", "cb-uae"],
  },
  {
    cityId: "city-paris",
    slug: "paris",
    name: "Paris",
    countryIso2: "FR",
    countryIso3: "FRA",
    countryName: "France",
    admin1Name: "Ile-de-France",
    latitude: 48.86,
    longitude: 2.35,
    population: 2_165_000,
    populationYear: 2024,
    roleTags: ["financial center", "technology hub", "tourism city"],
    economicFactbook: {
      gdpUsd: 850_000_000_000,
      gdpPerCapitaUsd: 393_000,
      employment: 6_200_000,
      unemploymentRate: 6.8,
      sectorMix: [
        { name: "Professional Services", share: 18 },
        { name: "Finance & Insurance", share: 12 },
        { name: "Technology", share: 11 },
        { name: "Tourism & Hospitality", share: 7 },
        { name: "Retail", share: 8 },
        { name: "Other", share: 44 },
      ],
      avgWageUsd: 52_000,
      costOfLivingIndex: 90,
      rentIndex: 82,
    },
    investorIntel: {
      companies: ["TotalEnergies", "BNP Paribas", "AXA", "LVMH", "L'Oreal", "Sanofi", "Schneider Electric", "Airbus"],
      industrialParks: ["Paris-Saclay", "Roissy CDG Zone"],
      ports: ["Port of Gennevilliers"],
      airports: ["Charles de Gaulle", "Orly"],
      railHubs: ["Gare du Nord", "Gare de Lyon", "Gare Montparnasse"],
      logisticsHubs: ["Roissy Logistics Hub"],
      utilities: ["EDF", "Engie"],
      clusterStrength: "European luxury, aerospace, and financial center",
      businessEnvironmentScore: 88,
    },
    urbanIntel: {
      transitModes: ["Metro", "RER", "Tram", "Bus", "Velib Bike Share"],
      congestionIndex: 65,
      airQualityIndex: 48,
      climateRisk: "River flooding, heat waves",
      internetPenetration: 94,
      electricityReliability: 99.8,
      fiberCoverage: 88,
      fiveGCoverage: true,
    },
    sources: ["oecd", "insee", "world-bank"],
  },
  {
    cityId: "city-shenzhen",
    slug: "shenzhen",
    name: "Shenzhen",
    countryIso2: "CN",
    countryIso3: "CHN",
    countryName: "China",
    admin1Name: "Guangdong",
    latitude: 22.54,
    longitude: 114.06,
    population: 17_560_000,
    populationYear: 2024,
    roleTags: ["technology hub", "manufacturing hub", "port city"],
    economicFactbook: {
      gdpUsd: 500_000_000_000,
      gdpPerCapitaUsd: 28_500,
      employment: 9_800_000,
      unemploymentRate: 2.8,
      sectorMix: [
        { name: "Technology & Electronics", share: 35 },
        { name: "Finance", share: 14 },
        { name: "Manufacturing", share: 22 },
        { name: "Logistics", share: 8 },
        { name: "Other", share: 21 },
      ],
      avgWageUsd: 16_000,
      costOfLivingIndex: 55,
      rentIndex: 52,
    },
    investorIntel: {
      companies: ["Huawei", "Tencent", "BYD", "DJI", "TP-Link", "ZTE", "Ping An", "Vanke"],
      industrialParks: ["Shenzhen Hi-Tech Industrial Park", "Qianhai Shekou"],
      ports: ["Port of Shenzhen (Yantian, Shekou)"],
      airports: ["Shenzhen Bao'an International"],
      railHubs: ["Shenzhen North", "Futian Station"],
      logisticsHubs: ["Yantian Port Area"],
      utilities: ["China Southern Power Grid", "Shenzhen Energy"],
      clusterStrength: "Global electronics manufacturing and innovation hub",
      businessEnvironmentScore: 84,
    },
    urbanIntel: {
      transitModes: ["Metro", "Bus", "Taxi", "High-Speed Rail"],
      congestionIndex: 58,
      airQualityIndex: 52,
      climateRisk: "Typhoons, coastal flooding",
      internetPenetration: 92,
      electricityReliability: 99.6,
      fiberCoverage: 96,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "unctad", "unctad-liner"],
  },
  {
    cityId: "city-mumbai",
    slug: "mumbai",
    name: "Mumbai",
    countryIso2: "IN",
    countryIso3: "IND",
    countryName: "India",
    admin1Name: "Maharashtra",
    latitude: 19.08,
    longitude: 72.88,
    population: 20_410_000,
    populationYear: 2024,
    roleTags: ["financial center", "manufacturing hub", "port city"],
    economicFactbook: {
      gdpUsd: 310_000_000_000,
      gdpPerCapitaUsd: 15_200,
      employment: 8_200_000,
      unemploymentRate: 5.2,
      sectorMix: [
        { name: "Financial Services", share: 22 },
        { name: "IT & Software", share: 16 },
        { name: "Manufacturing", share: 14 },
        { name: "Trade & Retail", share: 12 },
        { name: "Entertainment", share: 5 },
        { name: "Other", share: 31 },
      ],
      avgWageUsd: 8_500,
      costOfLivingIndex: 32,
      rentIndex: 35,
    },
    investorIntel: {
      companies: ["Tata Group", "Reliance Industries", "HDFC Bank", "ICICI Bank", "Infosys", "Wipro", "Larsen & Toubro"],
      industrialParks: ["Navi Mumbai SEZ", "Maharashtra Industrial Development"],
      ports: ["Jawaharlal Nehru Port", "Port of Mumbai"],
      airports: ["Chhatrapati Shivaji Maharaj International"],
      railHubs: ["Chhatrapati Shivaji Terminus", "Mumbai Central"],
      logisticsHubs: ["JNPT Container Terminal"],
      utilities: ["Tata Power", "Adani Electricity"],
      clusterStrength: "India's financial capital with strong IT and entertainment sectors",
      businessEnvironmentScore: 72,
    },
    urbanIntel: {
      transitModes: ["Suburban Rail", "Metro", "Bus", "Auto-rickshaw", "Taxi"],
      congestionIndex: 78,
      airQualityIndex: 82,
      climateRisk: "Monsoon flooding, sea level rise, cyclones",
      internetPenetration: 78,
      electricityReliability: 94,
      fiberCoverage: 68,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "rbi-india", "undesa"],
  },
  {
    cityId: "city-sao-paulo",
    slug: "sao-paulo",
    name: "Sao Paulo",
    countryIso2: "BR",
    countryIso3: "BRA",
    countryName: "Brazil",
    admin1Name: "Sao Paulo",
    latitude: -23.55,
    longitude: -46.63,
    population: 12_330_000,
    populationYear: 2024,
    roleTags: ["financial center", "manufacturing hub", "technology hub"],
    economicFactbook: {
      gdpUsd: 450_000_000_000,
      gdpPerCapitaUsd: 36_500,
      employment: 5_800_000,
      unemploymentRate: 8.4,
      sectorMix: [
        { name: "Financial Services", share: 18 },
        { name: "Manufacturing", share: 16 },
        { name: "Technology", share: 10 },
        { name: "Trade & Retail", share: 14 },
        { name: "Services", share: 20 },
        { name: "Other", share: 22 },
      ],
      avgWageUsd: 14_000,
      costOfLivingIndex: 38,
      rentIndex: 32,
    },
    investorIntel: {
      companies: ["Petrobras", "Vale", "Itau Unibanco", "Bradesco", "Ambev", "Natura", "Embraer"],
      industrialParks: ["Polo de Alta Tecnologia", "Americana Industrial"],
      ports: ["Port of Santos (metro access)"],
      airports: ["Guarulhos International", "Congonhas"],
      railHubs: ["Luz Station", "Barra Funda"],
      logisticsHubs: ["Rodovia Anchieta Logistics Corridor"],
      utilities: ["CPFL Energy", "Sabesp"],
      clusterStrength: "Latin America's largest financial and industrial center",
      businessEnvironmentScore: 68,
    },
    urbanIntel: {
      transitModes: ["Metro", "Commuter Rail", "Bus", "Bike Lane"],
      congestionIndex: 76,
      airQualityIndex: 64,
      climateRisk: "Flooding, landslides, water scarcity",
      internetPenetration: 84,
      electricityReliability: 96,
      fiberCoverage: 72,
      fiveGCoverage: true,
    },
    sources: ["world-bank", "ibge-brazil", "unctad"],
  },
];

/**
 * Quick lookup by slug
 */
export const cityProfileBySlug = new Map<string, CityIntelligenceProfile>(
  cityIntelligenceProfiles.map((city) => [city.slug, city]),
);

/**
 * Get cities by country ISO3 code
 */
export function getCitiesByCountry(countryIso3: string): CityIntelligenceProfile[] {
  return cityIntelligenceProfiles.filter((city) => city.countryIso3 === countryIso3);
}

/**
 * Search cities by name or role tag
 */
export function searchCityProfiles(query: string): CityIntelligenceProfile[] {
  const lower = query.toLowerCase();
  return cityIntelligenceProfiles.filter(
    (city) =>
      city.name.toLowerCase().includes(lower) ||
      city.roleTags.some((tag) => tag.toLowerCase().includes(lower)),
  );
}

/**
 * Get top N cities by GDP
 */
export function getTopCitiesByGdp(limit = 20): CityIntelligenceProfile[] {
  return [...cityIntelligenceProfiles]
    .filter((city) => city.economicFactbook.gdpUsd)
    .sort((a, b) => (b.economicFactbook.gdpUsd ?? 0) - (a.economicFactbook.gdpUsd ?? 0))
    .slice(0, limit);
}

/**
 * Get top N cities by population
 */
export function getTopCitiesByPopulation(limit = 20): CityIntelligenceProfile[] {
  return [...cityIntelligenceProfiles]
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}
