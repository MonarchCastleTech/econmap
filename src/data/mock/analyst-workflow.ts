/**
 * Analyst Workflow Tools — Watchlist Alerts, Case Files, Export
 * 
 * Provides the analyst with persistent watchlists, alert generation,
 * investigation case files, and data export capabilities.
 */

import { getHighConfidencePatterns, investigations, patternAlerts } from "@/data/mock/osint-timeline";
import { computeInfluenceScores, getSupplyChainVulnerabilities } from "@/data/mock/entity-network";
import { getHighRiskCorridors, getTopCorridorsByVolume } from "@/data/mock/trade-corridors";
import { countries, getObservation } from "@/data/mock/countries";

export type Watchlist = {
  id: string;
  name: string;
  description: string;
  entities: string[];
  createdBy: string;
  createdAt: string;
  alertThreshold: "low" | "medium" | "high";
  lastChecked?: string;
};

export type WatchlistAlert = {
  id: string;
  watchlistId: string;
  watchlistName: string;
  entityId: string;
  entityName: string;
  alertType: "risk_spike" | "new_relationship" | "supply_disruption" | "pattern_match" | "geopolitical";
  severity: "info" | "watch" | "warning" | "critical";
  message: string;
  detectedAt: string;
  acknowledged: boolean;
};

export type CaseFile = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  lead: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  subjects: CaseFileSubject[];
  evidence: EvidenceItem[];
  notes: AnalystNote[];
  tags: string[];
  exportFormat?: "pdf" | "csv" | "json";
};

export type CaseFileSubject = {
  id: string;
  name: string;
  type: "entity" | "country" | "city" | "corridor";
  role: "primary" | "secondary" | "witness";
  notes?: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  date: string;
  relevance: "direct" | "circumstantial" | "contextual";
  description: string;
  tags: string[];
};

export type AnalystNote = {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  linkedSubjects?: string[];
  linkedEvidence?: string[];
};

/**
 * Default watchlists for the analyst dashboard
 */
export const defaultWatchlists: Watchlist[] = [
  {
    id: "wl-semiconductors",
    name: "Semiconductor Supply Chain",
    description: "Monitor concentration risks in global semiconductor manufacturing and equipment",
    entities: ["ent-tsmc", "ent-samsung-electronics", "ent-asml", "ent-nvidia", "ent-qualcomm"],
    createdBy: "system",
    createdAt: "2025-10-01T00:00:00Z",
    alertThreshold: "high",
  },
  {
    id: "wl-energy-security",
    name: "Energy Security Corridor",
    description: "Track disruptions in major energy shipping routes and producer nations",
    entities: ["ent-shell", "ent-totalenergies", "ent-petrochina", "corridor-strait-malacca", "corridor-suez-energy"],
    createdBy: "system",
    createdAt: "2025-11-15T00:00:00Z",
    alertThreshold: "medium",
  },
  {
    id: "wl-ev-transition",
    name: "EV Battery Value Chain",
    description: "Monitor battery mineral supply, cell manufacturing, and EV market dynamics",
    entities: ["ent-tesla", "ent-byd", "ent-catl", "ent-toyota", "ent-volkswagen"],
    createdBy: "system",
    createdAt: "2025-12-01T00:00:00Z",
    alertThreshold: "medium",
  },
  {
    id: "wl-bigtech",
    name: "Big Tech Platform Risk",
    description: "Track regulatory actions, market concentration, and competitive dynamics",
    entities: ["ent-apple", "ent-microsoft", "ent-amazon", "ent-alibaba", "ent-tencent"],
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    alertThreshold: "low",
  },
];

/**
 * Generate alerts for a watchlist based on current data
 */
export function generateWatchlistAlerts(watchlist: Watchlist): WatchlistAlert[] {
  const alerts: WatchlistAlert[] = [];
  const influenceScores = computeInfluenceScores();
  const supplyVulns = getSupplyChainVulnerabilities();
  const highRiskCorridors = getHighRiskCorridors();
  const patterns = getHighConfidencePatterns(0.75);

  for (const entityId of watchlist.entities) {
    // Check for high-risk entities
    const score = influenceScores.find((s) => s.entityId === entityId);
    if (score && score.degree >= 4) {
      alerts.push({
        id: `alert-${watchlist.id}-${entityId}-influence`,
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        entityId,
        entityName: score.entityName,
        alertType: "new_relationship",
        severity: "watch",
        message: `${score.entityName} has ${score.degree} network connections — high centrality indicates systemic importance.`,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Check for supply chain vulnerabilities
    const vuln = supplyVulns.find((v) => v.inputEntity === entityId || v.outputEntity === entityId);
    if (vuln) {
      alerts.push({
        id: `alert-${watchlist.id}-${entityId}-supply`,
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        entityId,
        entityName: score?.entityName ?? entityId,
        alertType: "supply_disruption",
        severity: "critical",
        message: `Single-source dependency detected: ${vuln.commodity}. No alternative suppliers identified.`,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  // Check for pattern matches
  for (const pattern of patterns) {
    const matchingEntities = pattern.entities.filter((e) => watchlist.entities.includes(e));
    if (matchingEntities.length > 0) {
      alerts.push({
        id: `alert-${watchlist.id}-pattern-${pattern.id}`,
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        entityId: matchingEntities[0],
        entityName: pattern.pattern,
        alertType: "pattern_match",
        severity: pattern.confidence >= 0.9 ? "warning" : "watch",
        message: pattern.description,
        detectedAt: pattern.detectedAt,
        acknowledged: false,
      });
    }
  }

  return alerts;
}

/**
 * Get all active alerts across all watchlists
 */
export function getAllActiveAlerts(): WatchlistAlert[] {
  return defaultWatchlists.flatMap((wl) => generateWatchlistAlerts(wl));
}

/**
 * Generate a case file export package
 */
export function exportCaseFile(caseFile: CaseFile): string {
  const exportData = {
    case: {
      id: caseFile.id,
      title: caseFile.title,
      status: caseFile.status,
      priority: caseFile.priority,
      lead: caseFile.lead,
      createdAt: caseFile.createdAt,
      updatedAt: caseFile.updatedAt,
      summary: caseFile.summary,
      tags: caseFile.tags,
    },
    subjects: caseFile.subjects,
    evidence: caseFile.evidence,
    notes: caseFile.notes,
    exportedAt: new Date().toISOString(),
    format: caseFile.exportFormat ?? "json",
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export country comparison data as CSV
 */
export function exportCountryCsv(slugs: string[], indicatorIds: string[]): string {
  const header = ["country", "iso3", ...indicatorIds].join(",");
  const rows = slugs.map((slug) => {
    const country = countries.find((c) => c.slug === slug);
    if (!country) return null;
    const values = indicatorIds.map((indId) => {
      const obs = getObservation(slug, indId);
      return obs?.value?.toString() ?? "";
    });
    return [country.name, country.iso3, ...values].join(",");
  }).filter(Boolean);

  return [header, ...rows].join("\n");
}

/**
 * Generate analyst briefing summary
 */
export function generateAnalystBriefing(entityIds: string[]): {
  entities: string[];
  riskSummary: string[];
  networkInsights: string[];
  supplyChainRisks: string[];
  patternAlerts: string[];
} {
  const influenceScores = computeInfluenceScores();
  const supplyVulns = getSupplyChainVulnerabilities();
  const patterns = getHighConfidencePatterns(0.75);

  const riskSummary: string[] = [];
  const networkInsights: string[] = [];
  const supplyChainRisks: string[] = [];

  for (const entityId of entityIds) {
    const score = influenceScores.find((s) => s.entityId === entityId);
    if (score) {
      networkInsights.push(
        `${score.entityName}: ${score.degree} connections, ${score.clusterCount} industry clusters, pagerank ${(score.pagerank * 100).toFixed(0)}%`,
      );
    }
  }

  for (const vuln of supplyVulns) {
    if (entityIds.includes(vuln.inputEntity) || entityIds.includes(vuln.outputEntity)) {
      supplyChainRisks.push(
        `${vuln.inputEntity} → ${vuln.outputEntity}: ${vuln.commodity} (${vuln.riskLevel} risk, no alternative sources)`,
      );
    }
  }

  return {
    entities: entityIds,
    riskSummary,
    networkInsights,
    supplyChainRisks,
    patternAlerts: patterns.map((p) => `[${(p.confidence * 100).toFixed(0)}%] ${p.pattern}: ${p.description}`),
  };
}
