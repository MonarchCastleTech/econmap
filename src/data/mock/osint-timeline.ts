/**
 * Enhanced OSINT Dossier — Timeline & Investigation Tools
 * 
 * Structured historical events, crisis timelines, and investigation
 * tracking for countries and cities. Enables analysts to map events,
 * track patterns, and build case files.
 */

export type TimelineEvent = {
  id: string;
  entityId: string;
  entityType: "country" | "city" | "entity";
  year: number;
  month?: number;
  title: string;
  kind: "crisis" | "devaluation" | "reform" | "imf-program" | "recession" | "sanctions" | "election" | "conflict" | "policy-shift" | "merger" | "trade-deal";
  summary: string;
  impact: "low" | "medium" | "high" | "critical";
  sources: string[];
  relatedEntities?: string[];
};

export type Investigation = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  summary: string;
  subjects: string[];
  findings: string[];
  linkedEvents: string[];
  tags: string[];
};

export type PatternAlert = {
  id: string;
  pattern: string;
  description: string;
  entities: string[];
  confidence: number;
  detectedAt: string;
  recommendedAction: string;
};

/**
 * Country historical timeline events
 */
export const countryTimelineEvents: TimelineEvent[] = [
  {
    id: "evt-2008-global-crisis",
    entityId: "united-states",
    entityType: "country",
    year: 2008,
    month: 9,
    title: "Global Financial Crisis — Lehman Brothers Collapse",
    kind: "crisis",
    summary: "Lehman Brothers bankruptcy triggered global financial meltdown. US GDP contracted 4.3%, unemployment peaked at 10%.",
    impact: "critical",
    sources: ["federal-reserve", "imf-weo"],
    relatedEntities: ["united-kingdom", "germany"],
  },
  {
    id: "evt-2015-china-devaluation",
    entityId: "china",
    entityType: "country",
    year: 2015,
    month: 8,
    title: "PBOC Yuan Devaluation",
    kind: "devaluation",
    summary: "People's Bank of China devalued the yuan by 3% over two days, triggering global market volatility.",
    impact: "high",
    sources: ["pboc-china", "imf-weo"],
    relatedEntities: ["united-states"],
  },
  {
    id: "evt-2016-brexit",
    entityId: "united-kingdom",
    entityType: "country",
    year: 2016,
    month: 6,
    title: "Brexit Referendum",
    kind: "policy-shift",
    summary: "UK voted 52-48 to leave the EU. GBP fell 15%, triggering prolonged political and economic uncertainty.",
    impact: "high",
    sources: ["ons", "boe"],
    relatedEntities: ["germany", "france"],
  },
  {
    id: "evt-2018-us-china-trade-war",
    entityId: "united-states",
    entityType: "country",
    year: 2018,
    month: 3,
    title: "US-China Trade War Begins",
    kind: "sanctions",
    summary: "US imposed tariffs on $50B Chinese goods. China retaliated. Escalated to cover $550B in bilateral trade.",
    impact: "high",
    sources: ["wto", "un-comtrade"],
    relatedEntities: ["china"],
  },
  {
    id: "evt-2020-covid-pandemic",
    entityId: "global",
    entityType: "country",
    year: 2020,
    month: 3,
    title: "COVID-19 Pandemic Global Recession",
    kind: "crisis",
    summary: "Global pandemic caused worst recession since WWII. Global GDP fell 3.1%. Supply chains severely disrupted.",
    impact: "critical",
    sources: ["world-bank", "imf-weo", "who"],
  },
  {
    id: "evt-2021-evergiven",
    entityId: "global",
    entityType: "country",
    year: 2021,
    month: 3,
    title: "Ever Given Blocks Suez Canal",
    kind: "crisis",
    summary: "Container ship blocked Suez Canal for 6 days, disrupting $9.6B/day in global trade.",
    impact: "high",
    sources: ["unctad", "wto"],
  },
  {
    id: "evt-2022-russia-sanctions",
    entityId: "russia",
    entityType: "country",
    year: 2022,
    month: 2,
    title: "Western Sanctions on Russia (Ukraine Conflict)",
    kind: "sanctions",
    summary: "SWIFT exclusion, asset freezes, and trade restrictions on Russia. RUB fell 40% before recovering.",
    impact: "critical",
    sources: ["bis", "imf-weo"],
    relatedEntities: ["ukraine", "germany"],
  },
  {
    id: "evt-2022-sri-lanka-default",
    entityId: "sri-lanka",
    entityType: "country",
    year: 2022,
    month: 5,
    title: "Sri Lanka Sovereign Default",
    kind: "crisis",
    summary: "Sri Lanka defaulted on $51B foreign debt. Political crisis led to president fleeing country.",
    impact: "critical",
    sources: ["imf-weo", "world-bank"],
  },
  {
    id: "evt-2022-uk-gilts-crisis",
    entityId: "united-kingdom",
    entityType: "country",
    year: 2022,
    month: 9,
    title: "UK Gilts Crisis (Mini-Budget)",
    kind: "crisis",
    summary: "Unfunded tax cuts triggered gilt market crash, forcing BoE intervention and PM resignation.",
    impact: "high",
    sources: ["boe", "ons"],
  },
  {
    id: "evt-2023-svb-collapse",
    entityId: "united-states",
    entityType: "country",
    year: 2023,
    month: 3,
    title: "Silicon Valley Bank Collapse",
    kind: "crisis",
    summary: "SVB failed in second-largest US bank collapse. Triggered regional banking stress and Credit Suisse merger.",
    impact: "high",
    sources: ["federal-reserve", "fdic"],
    relatedEntities: ["switzerland"],
  },
  {
    id: "evt-2023-argentina-inflation",
    entityId: "argentina",
    entityType: "country",
    year: 2023,
    month: 12,
    title: "Argentina Inflation Exceeds 200%",
    kind: "crisis",
    summary: "Annual inflation surpassed 200% following presidential election and peso devaluation.",
    impact: "critical",
    sources: ["indec-argentina", "imf-weo"],
  },
  {
    id: "evt-2024-ai-investment-surge",
    entityId: "united-states",
    entityType: "country",
    year: 2024,
    month: 1,
    title: "Global AI Investment Surge",
    kind: "policy-shift",
    summary: "AI-related investment exceeded $200B globally. US tech stocks surged 40%+ on AI optimism.",
    impact: "high",
    sources: ["federal-reserve", "wipo"],
    relatedEntities: ["china"],
  },
];

/**
 * Sample investigations
 */
export const investigations: Investigation[] = [
  {
    id: "inv-semiconductor-supply-chain",
    title: "Semiconductor Supply Chain Concentration Risk",
    status: "in_progress",
    priority: "critical",
    createdAt: "2025-09-15T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
    summary: "Mapping single-point-of-failure risks in global semiconductor supply chain, with focus on TSMC dependency.",
    subjects: ["ent-tsmc", "ent-samsung-electronics", "ent-asml", "ent-nvidia", "ent-apple"],
    findings: [
      "TSMC produces 90% of advanced sub-7nm chips globally",
      "ASML is sole producer of EUV lithography equipment",
      "No viable alternative to TSMC for Apple/NVIDIA at 3nm",
      "Geopolitical risk in Taiwan Strait is unhedgeable concentration",
    ],
    linkedEvents: ["evt-2018-us-china-trade-war", "evt-2020-covid-pandemic"],
    tags: ["semiconductors", "geopolitics", "supply-chain", "concentration-risk"],
  },
  {
    id: "inv-ev-battery-chain",
    title: "EV Battery Mineral Supply Chain",
    status: "open",
    priority: "high",
    createdAt: "2025-11-01T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    summary: "Tracing cobalt, lithium, and nickel supply chains from mine to battery cell for EV market.",
    subjects: ["ent-catl", "ent-byd", "ent-tesla", "ent-toyota"],
    findings: [
      "70% of cobalt mined in DRC with Chinese processing dominance",
      "CATL controls 37% of global battery cell production",
      "Chile/Australia lithium supply adequate but refining concentrated in China",
    ],
    linkedEvents: ["evt-2022-russia-sanctions"],
    tags: ["batteries", "critical-minerals", "china", "ev"],
  },
  {
    id: "inv-chokepoint-vulnerability",
    title: "Maritime Chokepoint Vulnerability Assessment",
    status: "in_progress",
    priority: "critical",
    createdAt: "2025-08-01T00:00:00Z",
    updatedAt: "2026-01-10T00:00:00Z",
    summary: "Assessing economic impact of disruption at key maritime chokepoints (Suez, Malacca, Panama, Hormuz).",
    subjects: ["corridor-strait-malacca", "corridor-suez-energy", "corridor-panama"],
    findings: [
      "Strait of Malacca handles 25% of global trade — no feasible alternative at scale",
      "Suez disruption adds 12 days and $8B/month to Asia-Europe trade costs",
      "Hormuz closure would spike oil prices 150%+ within weeks",
    ],
    linkedEvents: ["evt-2021-evergiven", "evt-2022-russia-sanctions"],
    tags: ["maritime", "chokepoints", "energy-security", "trade"],
  },
  {
    id: "inv-russia-sanctions-evasion",
    title: "Russian Sanctions Evasion Networks",
    status: "open",
    priority: "high",
    createdAt: "2025-12-01T00:00:00Z",
    updatedAt: "2026-01-25T00:00:00Z",
    summary: "Tracking parallel import routes and third-country transshipment networks for sanctioned goods entering Russia.",
    subjects: ["russia", "kazakhstan", "uzbekistan", "united-arab-emirates"],
    findings: [
      "Parallel imports via Kazakhstan and UAE increased 300% post-sanctions",
      "Semiconductor components transshipped through Chinese special economic zones",
      "Shadow fleet of 600+ tankers transporting Russian oil",
    ],
    linkedEvents: ["evt-2022-russia-sanctions"],
    tags: ["sanctions", "russia", "evasion", "trade-routes"],
  },
];

/**
 * Pattern detection alerts
 */
export const patternAlerts: PatternAlert[] = [
  {
    id: "pattern-chip-concentration",
    pattern: "Geographic Concentration Risk",
    description: "Semiconductor manufacturing is disproportionately concentrated in Taiwan and South Korea, creating systemic single-point-of-failure.",
    entities: ["ent-tsmc", "ent-samsung-electronics"],
    confidence: 0.94,
    detectedAt: "2026-01-15T00:00:00Z",
    recommendedAction: "Diversify chip sourcing; monitor geopolitical developments; stress-test with 30-day disruption scenario",
  },
  {
    id: "pattern-energy-transition-bottleneck",
    pattern: "Energy Transition Mineral Bottleneck",
    description: "Critical mineral processing capacity is concentrated in China, creating vulnerability for energy transition supply chains.",
    entities: ["ent-catl", "ent-byd"],
    confidence: 0.88,
    detectedAt: "2026-01-10T00:00:00Z",
    recommendedAction: "Map alternative mineral sources; track new processing capacity outside China; monitor stockpile levels",
  },
  {
    id: "pattern-dollar-diversification",
    pattern: "De-dollarization Trade Settlement",
    description: "Increasing use of non-USD currencies in bilateral trade settlement between BRICS nations and regional partners.",
    entities: ["china", "russia", "brazil", "india"],
    confidence: 0.72,
    detectedAt: "2026-01-08T00:00:00Z",
    recommendedAction: "Track bilateral local currency swap agreements; monitor commodity pricing currency shifts",
  },
  {
    id: "pattern-supply-chain-relocation",
    pattern: "China+1 Supply Chain Relocation",
    description: "Manufacturing diversification from China to Vietnam, India, and Mexico accelerating across electronics and textiles.",
    entities: ["vietnam", "india", "mexico"],
    confidence: 0.85,
    detectedAt: "2026-01-05T00:00:00Z",
    recommendedAction: "Track FDI flows into alternative manufacturing hubs; assess infrastructure readiness in recipient countries",
  },
];

/**
 * Get timeline events for an entity
 */
export function getTimelineForEntity(entityId: string): TimelineEvent[] {
  return countryTimelineEvents
    .filter((e) => e.entityId === entityId || e.relatedEntities?.includes(entityId))
    .sort((a, b) => b.year - a.year);
}

/**
 * Get events by type
 */
export function getEventsByKind(kind: TimelineEvent["kind"]): TimelineEvent[] {
  return countryTimelineEvents.filter((e) => e.kind === kind);
}

/**
 * Get active investigations
 */
export function getActiveInvestigations(): Investigation[] {
  return investigations.filter((i) => i.status === "open" || i.status === "in_progress");
}

/**
 * Get investigations by tag
 */
export function getInvestigationsByTag(tag: string): Investigation[] {
  return investigations.filter((i) => i.tags.includes(tag));
}

/**
 * Get pattern alerts above confidence threshold
 */
export function getHighConfidencePatterns(threshold = 0.8): PatternAlert[] {
  return patternAlerts.filter((p) => p.confidence >= threshold);
}
