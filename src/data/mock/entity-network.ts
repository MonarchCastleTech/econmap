/**
 * Palantir-Style Entity Resolution & Network Analysis
 * 
 * Entity resolution engine that maps relationships between companies, facilities,
 * supply chains, and economic actors across cities and countries. Provides
 * network graph analysis, influence scoring, and relationship mapping.
 */

export type EntityNode = {
  id: string;
  name: string;
  type: "company" | "facility" | "industrial_park" | "port" | "airport" | "logistics_hub" | "subsidiary" | "supplier";
  industry?: string;
  citySlug?: string;
  countryIso3?: string;
  revenueUsd?: number;
  employees?: number;
  founded?: number;
  status: "active" | "acquired" | "merged" | "dissolved";
  riskFlags?: string[];
};

export type EntityEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: "parent" | "subsidiary" | "supplier" | "customer" | "competitor" | "joint_venture" | "logistics_route" | "investor";
  weight: number;
  evidence?: string;
  since?: number;
};

export type NetworkCluster = {
  id: string;
  label: string;
  nodes: string[];
  dominantIndustry?: string;
  totalRevenueUsd?: number;
  citySlugs: string[];
  countryIso3s: string[];
};

export type SupplyChainLink = {
  id: string;
  inputEntity: string;
  outputEntity: string;
  commodity: string;
  volumeUsd?: number;
  route?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  alternativeSources?: string[];
};

export type InfluenceScore = {
  entityId: string;
  entityName: string;
  degree: number;
  betweenness: number;
  pagerank: number;
  clusterCount: number;
  industries: string[];
};

/**
 * Global entity graph for network analysis
 */
export const entityNodes: EntityNode[] = [
  { id: "ent-tsmc", name: "TSMC", type: "company", industry: "Semiconductors", citySlug: "taipei", countryIso3: "TWN", revenueUsd: 70_000_000_000, employees: 75_000, founded: 1987, status: "active" },
  { id: "ent-samsung-electronics", name: "Samsung Electronics", type: "company", industry: "Semiconductors", citySlug: "seoul", countryIso3: "KOR", revenueUsd: 234_000_000_000, employees: 270_000, founded: 1969, status: "active" },
  { id: "ent-tencent", name: "Tencent", type: "company", industry: "Technology", citySlug: "shenzhen", countryIso3: "CHN", revenueUsd: 85_000_000_000, employees: 112_000, founded: 1998, status: "active" },
  { id: "ent-alibaba", name: "Alibaba", type: "company", industry: "E-Commerce", citySlug: "hangzhou", countryIso3: "CHN", revenueUsd: 130_000_000_000, employees: 235_000, founded: 1999, status: "active" },
  { id: "ent-toyota", name: "Toyota Motor", type: "company", industry: "Automotive", citySlug: "toyota-city", countryIso3: "JPN", revenueUsd: 310_000_000_000, employees: 375_000, founded: 1937, status: "active" },
  { id: "ent-volkswagen", name: "Volkswagen Group", type: "company", industry: "Automotive", citySlug: "wolfsburg", countryIso3: "DEU", revenueUsd: 293_000_000_000, employees: 675_000, founded: 1937, status: "active" },
  { id: "ent-apple", name: "Apple Inc.", type: "company", industry: "Technology", citySlug: "cupertino", countryIso3: "USA", revenueUsd: 383_000_000_000, employees: 164_000, founded: 1976, status: "active" },
  { id: "ent-microsoft", name: "Microsoft", type: "company", industry: "Technology", citySlug: "redmond", countryIso3: "USA", revenueUsd: 245_000_000_000, employees: 238_000, founded: 1975, status: "active" },
  { id: "ent-amazon", name: "Amazon", type: "company", industry: "E-Commerce", citySlug: "seattle", countryIso3: "USA", revenueUsd: 638_000_000_000, employees: 1_500_000, founded: 1994, status: "active" },
  { id: "ent-tesla", name: "Tesla", type: "company", industry: "Automotive", citySlug: "austin", countryIso3: "USA", revenueUsd: 97_000_000_000, employees: 140_000, founded: 2003, status: "active" },
  { id: "ent-nestle", name: "Nestle", type: "company", industry: "Food & Beverage", citySlug: "lausanne", countryIso3: "CHE", revenueUsd: 104_000_000_000, employees: 277_000, founded: 1866, status: "active" },
  { id: "ent-shell", name: "Shell", type: "company", industry: "Energy", citySlug: "london", countryIso3: "GBR", revenueUsd: 316_000_000_000, employees: 93_000, founded: 1907, status: "active" },
  { id: "ent-arcelormittal", name: "ArcelorMittal", type: "company", industry: "Steel", citySlug: "luxembourg", countryIso3: "LUX", revenueUsd: 68_000_000_000, employees: 154_000, founded: 2006, status: "active" },
  { id: "ent-byd", name: "BYD", type: "company", industry: "Automotive", citySlug: "shenzhen", countryIso3: "CHN", revenueUsd: 85_000_000_000, employees: 290_000, founded: 1995, status: "active" },
  { id: "ent-catl", name: "CATL", type: "company", industry: "Batteries", citySlug: "ningde", countryIso3: "CHN", revenueUsd: 50_000_000_000, employees: 115_000, founded: 2011, status: "active" },
  { id: "ent-huawei", name: "Huawei", type: "company", industry: "Telecommunications", citySlug: "shenzhen", countryIso3: "CHN", revenueUsd: 100_000_000_000, employees: 207_000, founded: 1987, status: "active", riskFlags: ["sanctions_risk", "geopolitical_exposure"] },
  { id: "ent-qualcomm", name: "Qualcomm", type: "company", industry: "Semiconductors", citySlug: "san-diego", countryIso3: "USA", revenueUsd: 44_000_000_000, employees: 51_000, founded: 1985, status: "active" },
  { id: "ent-nvidia", name: "NVIDIA", type: "company", industry: "Semiconductors", citySlug: "santa-clara", countryIso3: "USA", revenueUsd: 96_000_000_000, employees: 32_000, founded: 1993, status: "active" },
  { id: "ent-asml", name: "ASML", type: "company", industry: "Semiconductor Equipment", citySlug: "eindhoven", countryIso3: "NLD", revenueUsd: 29_000_000_000, employees: 42_000, founded: 1984, status: "active" },
  { id: "ent-totalenergies", name: "TotalEnergies", type: "company", industry: "Energy", citySlug: "paris", countryIso3: "FRA", revenueUsd: 237_000_000_000, employees: 102_000, founded: 1924, status: "active" },
  { id: "ent-petrochina", name: "PetroChina", type: "company", industry: "Energy", citySlug: "beijing", countryIso3: "CHN", revenueUsd: 400_000_000_000, employees: 460_000, founded: 1999, status: "active" },
  { id: "ent-sabic", name: "SABIC", type: "company", industry: "Chemicals", citySlug: "riyadh", countryIso3: "SAU", revenueUsd: 42_000_000_000, employees: 32_000, founded: 1976, status: "active" },
  { id: "ent-basf", name: "BASF", type: "company", industry: "Chemicals", citySlug: "ludwigshafen", countryIso3: "DEU", revenueUsd: 74_000_000_000, employees: 111_000, founded: 1865, status: "active" },
  { id: "ent-airbus", name: "Airbus", type: "company", industry: "Aerospace", citySlug: "toulouse", countryIso3: "FRA", revenueUsd: 70_000_000_000, employees: 134_000, founded: 1970, status: "active" },
  { id: "ent-boeing", name: "Boeing", type: "company", industry: "Aerospace", citySlug: "arlington", countryIso3: "USA", revenueUsd: 77_000_000_000, employees: 171_000, founded: 1916, status: "active" },
  { id: "ent-unilever", name: "Unilever", type: "company", industry: "Consumer Goods", citySlug: "london", countryIso3: "GBR", revenueUsd: 64_000_000_000, employees: 128_000, founded: 1929, status: "active" },
  { id: "ent-procter-gamble", name: "Procter & Gamble", type: "company", industry: "Consumer Goods", citySlug: "cincinnati", countryIso3: "USA", revenueUsd: 84_000_000_000, employees: 107_000, founded: 1837, status: "active" },
  { id: "ent-johnson-johnson", name: "Johnson & Johnson", type: "company", industry: "Pharmaceuticals", citySlug: "new-brunswick", countryIso3: "USA", revenueUsd: 90_000_000_000, employees: 131_000, founded: 1886, status: "active" },
  { id: "ent-pfizer", name: "Pfizer", type: "company", industry: "Pharmaceuticals", citySlug: "new-york", countryIso3: "USA", revenueUsd: 58_000_000_000, employees: 88_000, founded: 1849, status: "active" },
  { id: "ent-roche", name: "Roche", type: "company", industry: "Pharmaceuticals", citySlug: "basel", countryIso3: "CHE", revenueUsd: 66_000_000_000, employees: 105_000, founded: 1896, status: "active" },
];

/**
 * Relationship edges between entities
 */
export const entityEdges: EntityEdge[] = [
  { id: "edge-1", sourceId: "ent-apple", targetId: "ent-tsmc", relationship: "customer", weight: 0.95, since: 2014, evidence: "Primary chip fabrication partnership" },
  { id: "edge-2", sourceId: "ent-apple", targetId: "ent-samsung-electronics", relationship: "customer", weight: 0.7, since: 2010, evidence: "Display and chip supply" },
  { id: "edge-3", sourceId: "ent-nvidia", targetId: "ent-tsmc", relationship: "customer", weight: 0.92, since: 2020, evidence: "GPU fabrication partnership" },
  { id: "edge-4", sourceId: "ent-qualcomm", targetId: "ent-tsmc", relationship: "customer", weight: 0.85, since: 2015, evidence: "Mobile SoC fabrication" },
  { id: "edge-5", sourceId: "ent-asml", targetId: "ent-tsmc", relationship: "supplier", weight: 0.98, since: 2000, evidence: "EUV lithography equipment" },
  { id: "edge-6", sourceId: "ent-asml", targetId: "ent-samsung-electronics", relationship: "supplier", weight: 0.9, since: 2010, evidence: "EUV lithography equipment" },
  { id: "edge-7", sourceId: "ent-tesla", targetId: "ent-catl", relationship: "customer", weight: 0.88, since: 2020, evidence: "Battery cell supply agreement" },
  { id: "edge-8", sourceId: "ent-byd", targetId: "ent-tesla", relationship: "competitor", weight: 0.82, since: 2023, evidence: "EV market competition" },
  { id: "edge-9", sourceId: "ent-toyota", targetId: "ent-tesla", relationship: "competitor", weight: 0.75, since: 2020, evidence: "EV and hybrid market" },
  { id: "edge-10", sourceId: "ent-volkswagen", targetId: "ent-tesla", relationship: "competitor", weight: 0.78, since: 2022, evidence: "European EV market" },
  { id: "edge-11", sourceId: "ent-arcelormittal", targetId: "ent-toyota", relationship: "supplier", weight: 0.8, since: 2005, evidence: "Automotive steel supply" },
  { id: "edge-12", sourceId: "ent-basf", targetId: "ent-volkswagen", relationship: "supplier", weight: 0.82, since: 2010, evidence: "Battery materials and coatings" },
  { id: "edge-13", sourceId: "ent-shell", targetId: "ent-totalenergies", relationship: "competitor", weight: 0.9, since: 1929, evidence: "Global integrated oil competition" },
  { id: "edge-14", sourceId: "ent-petrochina", targetId: "ent-shell", relationship: "competitor", weight: 0.85, since: 2000, evidence: "Asian energy market" },
  { id: "edge-15", sourceId: "ent-sabic", targetId: "ent-basf", relationship: "competitor", weight: 0.7, since: 2000, evidence: "Petrochemical market" },
  { id: "edge-16", sourceId: "ent-boeing", targetId: "ent-airbus", relationship: "competitor", weight: 0.95, since: 1970, evidence: "Commercial aircraft duopoly" },
  { id: "edge-17", sourceId: "ent-amazon", targetId: "ent-microsoft", relationship: "competitor", weight: 0.88, since: 2010, evidence: "Cloud computing market" },
  { id: "edge-18", sourceId: "ent-alibaba", targetId: "ent-amazon", relationship: "competitor", weight: 0.75, since: 2010, evidence: "E-commerce competition" },
  { id: "edge-19", sourceId: "ent-tencent", targetId: "ent-alibaba", relationship: "competitor", weight: 0.8, since: 2015, evidence: "Chinese tech ecosystem" },
  { id: "edge-20", sourceId: "ent-pfizer", targetId: "ent-roche", relationship: "competitor", weight: 0.72, since: 2000, evidence: "Pharmaceutical market" },
  { id: "edge-21", sourceId: "ent-unilever", targetId: "ent-procter-gamble", relationship: "competitor", weight: 0.78, since: 1950, evidence: "Consumer goods market" },
  { id: "edge-22", sourceId: "ent-nestle", targetId: "ent-unilever", relationship: "competitor", weight: 0.75, since: 1950, evidence: "Food and consumer goods" },
  { id: "edge-23", sourceId: "ent-huawei", targetId: "ent-qualcomm", relationship: "competitor", weight: 0.85, since: 2010, evidence: "5G and chipset market" },
  { id: "edge-24", sourceId: "ent-catl", targetId: "ent-byd", relationship: "supplier", weight: 0.8, since: 2015, evidence: "Battery supply to BYD" },
  { id: "edge-25", sourceId: "ent-totalenergies", targetId: "ent-airbus", relationship: "supplier", weight: 0.6, since: 2020, evidence: "Sustainable aviation fuel" },
];

/**
 * Pre-computed industry clusters
 */
export const networkClusters: NetworkCluster[] = [
  {
    id: "cluster-semis",
    label: "Semiconductor Ecosystem",
    nodes: ["ent-tsmc", "ent-samsung-electronics", "ent-nvidia", "ent-qualcomm", "ent-asml", "ent-apple", "ent-huawei"],
    dominantIndustry: "Semiconductors",
    totalRevenueUsd: 903_000_000_000,
    citySlugs: ["taipei", "seoul", "santa-clara", "san-diego", "eindhoven", "cupertino", "shenzhen"],
    countryIso3s: ["TWN", "KOR", "USA", "NLD", "CHN"],
  },
  {
    id: "cluster-ev",
    label: "Electric Vehicle Value Chain",
    nodes: ["ent-tesla", "ent-byd", "ent-catl", "ent-toyota", "ent-volkswagen"],
    dominantIndustry: "Automotive",
    totalRevenueUsd: 875_000_000_000,
    citySlugs: ["austin", "shenzhen", "ningde", "toyota-city", "wolfsburg"],
    countryIso3s: ["USA", "CHN", "JPN", "DEU"],
  },
  {
    id: "cluster-energy",
    label: "Global Energy Majors",
    nodes: ["ent-shell", "ent-totalenergies", "ent-petrochina", "ent-sabic"],
    dominantIndustry: "Energy",
    totalRevenueUsd: 1_095_000_000_000,
    citySlugs: ["london", "paris", "beijing", "riyadh"],
    countryIso3s: ["GBR", "FRA", "CHN", "SAU"],
  },
  {
    id: "cluster-bigtech",
    label: "Big Technology Platforms",
    nodes: ["ent-apple", "ent-microsoft", "ent-amazon", "ent-alibaba", "ent-tencent"],
    dominantIndustry: "Technology",
    totalRevenueUsd: 1_491_000_000_000,
    citySlugs: ["cupertino", "redmond", "seattle", "hangzhou", "shenzhen"],
    countryIso3s: ["USA", "CHN"],
  },
  {
    id: "cluster-pharma",
    label: "Pharmaceutical Leaders",
    nodes: ["ent-pfizer", "ent-roche", "ent-johnson-johnson"],
    dominantIndustry: "Pharmaceuticals",
    totalRevenueUsd: 254_000_000_000,
    citySlugs: ["new-york", "basel", "new-brunswick"],
    countryIso3s: ["USA", "CHE"],
  },
  {
    id: "cluster-aero",
    label: "Aerospace & Defense",
    nodes: ["ent-boeing", "ent-airbus"],
    dominantIndustry: "Aerospace",
    totalRevenueUsd: 147_000_000_000,
    citySlugs: ["arlington", "toulouse"],
    countryIso3s: ["USA", "FRA"],
  },
];

/**
 * Supply chain vulnerability mapping
 */
export const supplyChainLinks: SupplyChainLink[] = [
  { id: "sc-1", inputEntity: "ent-tsmc", outputEntity: "ent-apple", commodity: "A-series/M-series chips", volumeUsd: 25_000_000_000, route: "Taiphai -> Cupertino", riskLevel: "medium", alternativeSources: ["ent-samsung-electronics"] },
  { id: "sc-2", inputEntity: "ent-tsmc", outputEntity: "ent-nvidia", commodity: "GPU chips", volumeUsd: 18_000_000_000, route: "Taiphai -> Santa Clara", riskLevel: "medium", alternativeSources: ["ent-samsung-electronics"] },
  { id: "sc-3", inputEntity: "ent-asml", outputEntity: "ent-tsmc", commodity: "EUV lithography systems", volumeUsd: 8_000_000_000, route: "Eindhoven -> Taiphai", riskLevel: "critical", alternativeSources: [] },
  { id: "sc-4", inputEntity: "ent-catl", outputEntity: "ent-tesla", commodity: "Lithium-ion battery cells", volumeUsd: 12_000_000_000, route: "Ningde -> Austin", riskLevel: "high", alternativeSources: ["ent-byd", "ent-samsung-electronics"] },
  { id: "sc-5", inputEntity: "ent-qualcomm", outputEntity: "ent-huawei", commodity: "5G chipsets", volumeUsd: 2_000_000_000, route: "San Diego -> Shenzhen", riskLevel: "critical", alternativeSources: [] },
  { id: "sc-6", inputEntity: "ent-arcelormittal", outputEntity: "ent-toyota", commodity: "Automotive steel", volumeUsd: 5_000_000_000, route: "Global -> Toyota City", riskLevel: "low", alternativeSources: ["Nippon Steel", "POSCO"] },
  { id: "sc-7", inputEntity: "ent-sabic", outputEntity: "ent-basf", commodity: "Petrochemical feedstock", volumeUsd: 4_000_000_000, route: "Riyadh -> Ludwigshafen", riskLevel: "medium", alternativeSources: ["Dow Chemical", "Sinopec"] },
  { id: "sc-8", inputEntity: "ent-boeing", outputEntity: "ent-airbus", commodity: "Aerospace-grade titanium", volumeUsd: 1_500_000_000, route: "Global supply chain", riskLevel: "high", alternativeSources: ["VSMPO-AVISMA"] },
];

/**
 * Compute simplified influence scores for entities
 */
export function computeInfluenceScores(): InfluenceScore[] {
  const nodeMap = new Map(entityNodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>();

  for (const node of entityNodes) {
    adjacency.set(node.id, new Set());
  }

  for (const edge of entityEdges) {
    adjacency.get(edge.sourceId)?.add(edge.targetId);
    adjacency.get(edge.targetId)?.add(edge.sourceId);
  }

  return entityNodes.map((node) => {
    const neighbors = adjacency.get(node.id) ?? new Set();
    const clusterMemberships = networkClusters.filter((c) => c.nodes.includes(node.id));
    const industries = clusterMemberships
      .map((c) => c.dominantIndustry)
      .filter((i): i is string => Boolean(i));

    return {
      entityId: node.id,
      entityName: node.name,
      degree: neighbors.size,
      betweenness: Math.min(1, neighbors.size / (entityNodes.length - 1)),
      pagerank: Math.min(1, neighbors.size / 10),
      clusterCount: clusterMemberships.length,
      industries: [...new Set(industries)],
    };
  });
}

/**
 * Find shortest path between two entities (BFS)
 */
export function findEntityPath(sourceId: string, targetId: string): string[] | null {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of entityEdges) {
    if (!adjacency.has(edge.sourceId)) adjacency.set(edge.sourceId, new Set());
    if (!adjacency.has(edge.targetId)) adjacency.set(edge.targetId, new Set());
    adjacency.get(edge.sourceId)!.add(edge.targetId);
    adjacency.get(edge.targetId)!.add(edge.sourceId);
  }

  const visited = new Set<string>([sourceId]);
  const queue: Array<{ node: string; path: string[] }> = [{ node: sourceId, path: [sourceId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.node === targetId) return current.path;

    const neighbors = adjacency.get(current.node) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null;
}

/**
 * Get all entities in a specific industry cluster
 */
export function getClusterEntities(clusterId: string): EntityNode[] {
  const cluster = networkClusters.find((c) => c.id === clusterId);
  if (!cluster) return [];
  const nodeMap = new Map(entityNodes.map((n) => [n.id, n]));
  return cluster.nodes.map((id) => nodeMap.get(id)).filter((n): n is EntityNode => Boolean(n));
}

/**
 * Identify supply chain vulnerabilities (single-source dependencies)
 */
export function getSupplyChainVulnerabilities(): SupplyChainLink[] {
  return supplyChainLinks.filter(
    (link) => !link.alternativeSources || link.alternativeSources.length === 0,
  );
}

/**
 * Get entity relationship summary
 */
export function getEntityRelationships(entityId: string): {
  outgoing: EntityEdge[];
  incoming: EntityEdge[];
  network: string[];
} {
  const outgoing = entityEdges.filter((e) => e.sourceId === entityId);
  const incoming = entityEdges.filter((e) => e.targetId === entityId);
  const network = [...new Set([...outgoing.map((e) => e.targetId), ...incoming.map((e) => e.sourceId)])];
  return { outgoing, incoming, network };
}
