"use client";

import type {
  CommandCenterCityPanel,
  CommandCenterManifest,
  CommandCenterCityWorkspace,
  SourceMeta,
} from "@/domain/types";
import { buildCommandCenterCityAnalystNavigation } from "@/features/home/lib/analyst-sidebar-model";

import { EntityCard } from "./entity-card";
import {
  LayerEvidenceTable,
  type LayerEvidenceRow,
} from "./layer-evidence-table";
import { OsintDossierSection } from "./osint-dossier-section";
import { SourceBadge } from "./source-badge";

type CityWorkspaceProps = {
  commandCenterManifest: CommandCenterManifest;
  panel: CommandCenterCityPanel;
};

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const coverageLabels: Record<string, string> = {
  verified_exact: "Verified exact",
  verified_city_presence: "Verified city presence",
  partial_coverage: "Partial coverage",
  not_covered_yet: "Not covered yet",
  not_applicable: "Not applicable",
};

const dossierCoverageLabels: Partial<Record<keyof CommandCenterCityWorkspace["coverage"], string>> = {
  economicFactbook: "Economic Factbook",
  investorIntel: "Investor Intel",
  urbanIntel: "Urban Intel",
};

const analystStateLabels = {
  documented: "Documented",
  mapped: "Mapped",
  missing: "Missing",
  queued: "Queued",
} as const;

const entityCountLabels: Record<string, string> = {
  airport: "Airports",
  company: "Companies",
  factory: "Factories",
  industrial_park: "Industrial parks",
  logistics_hub: "Logistics hubs",
  port: "Ports",
  rail_hub: "Rail hubs",
  research: "Organizations",
  utility: "Utilities",
};

const indicatorLabels: Record<string, string> = {
  population: "Population",
  gdp: "GDP",
  gva: "GVA",
  "gdp-current-ppp": "GDP (PPP)",
  "gdp-per-capita": "GDP per Capita",
  employment: "Employment",
  unemployment: "Unemployment",
  "labour-force": "Labour Force",
  ports: "Ports",
  utilities: "Utilities",
  organizations: "Organizations",
  "company-presence": "Company Presence",
  "fixed-download-mbps": "Fixed Download",
  "mobile-download-mbps": "Mobile Download",
  pm25: "PM2.5",
};

function formatIndicatorLabel(indicatorId: string) {
  if (indicatorLabels[indicatorId]) {
    return indicatorLabels[indicatorId];
  }

  return indicatorId
    .split("-")
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === "GDP" || upper === "PPP" || upper === "PM25" || upper === "LEI") {
        return upper;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function formatMetricValue(value: number | null, unit: string) {
  if (value === null) {
    return "Not covered";
  }

  let formatted = "";

  if (Math.abs(value) >= 1_000_000_000) {
    formatted = `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1_000) {
    formatted = `${(value / 1_000).toFixed(1)}K`;
  } else if (Number.isInteger(value)) {
    formatted = value.toLocaleString("en-US");
  } else {
    formatted = value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }

  return `${formatted} ${unit}`.trim();
}

function formatCodeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === "OECD" || upper === "PPP" || upper === "PM25" || upper === "LEI") {
        return upper;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function formatCoverageDimensionLabel(key: keyof CommandCenterCityWorkspace["coverage"]) {
  return dossierCoverageLabels[key] ?? formatCodeLabel(key);
}

function getVisibleSourceLabels(panel: CommandCenterCityPanel, workspace: CommandCenterCityWorkspace) {
  const uniqueSources = new Map<string, SourceMeta>();

  [
    ...(workspace.sources ?? []),
    ...(panel.sources?.sources ?? []),
    ...(panel.entities?.sources ?? []),
    ...workspace.sourceCoverageSummary.flatMap((item) => item.sources),
  ].forEach((source) => {
    uniqueSources.set(source.id, source);
  });

  return Array.from(uniqueSources.values());
}

function buildMetricRows(
  metrics: CommandCenterCityWorkspace["economicIntel"],
): LayerEvidenceRow[] {
  return metrics.map((metric) => ({
    id: `${metric.indicatorId}:${metric.year ?? "na"}:${metric.source.id}`,
    label: formatIndicatorLabel(metric.indicatorId),
    value: formatMetricValue(metric.value, metric.unit),
    detail: [metric.year ? `Year ${metric.year}` : null, metric.status === "actual" ? "Observed" : "Estimate"]
      .filter(Boolean)
      .join(" / "),
    sources: [metric.source],
  }));
}

function buildSourceAuditRows(
  panel: CommandCenterCityPanel,
  workspace: CommandCenterCityWorkspace,
): LayerEvidenceRow[] {
  const sourceRows = getVisibleSourceLabels(panel, workspace).map((source) => ({
    id: `source:${source.id}`,
    label: source.name,
    value: coverageLabels[source.coverageState ?? ""] ?? formatCodeLabel(source.coverage),
    detail: source.methodology,
    sources: [source],
  }));

  const coverageRows = workspace.sourceCoverageSummary.map((summary, index) => ({
    id: `coverage:${summary.label}:${index}`,
    label: summary.label,
    value: coverageLabels[summary.value] ?? formatCodeLabel(summary.value),
    detail: summary.sources.length
      ? `${summary.sources.length} linked source${summary.sources.length === 1 ? "" : "s"}`
      : "No linked sources",
    sources: summary.sources,
  }));

  const layerRows =
    workspace.mapLayerSummary.availableLayers.length > 0
      ? [
          {
            id: "published-layers",
            label: "Published city layers",
            value: workspace.mapLayerSummary.availableLayers.join(", "),
            detail: `${workspace.mapLayerSummary.availableLayers.length} source-backed layer${
              workspace.mapLayerSummary.availableLayers.length === 1 ? "" : "s"
            }`,
            sources: [] as SourceMeta[],
          },
        ]
      : [];

  return [...coverageRows, ...layerRows, ...sourceRows];
}

function buildMissingCoverageRows(
  navigation: ReturnType<typeof buildCommandCenterCityAnalystNavigation>,
): LayerEvidenceRow[] {
  return navigation.missingCoverage.rows.map((row) => ({
    id: `gap:${row.id}`,
    label: row.label,
    value: analystStateLabels[row.state],
    detail:
      row.state === "queued"
        ? `${row.detail ?? "Dataset ingestion is in progress."} ${row.queuedDatasetCount} queued dataset${
            row.queuedDatasetCount === 1 ? "" : "s"
          } still need publishing or city matching.`
        : `${row.detail ?? "This evidence family is not integrated yet."} No public dataset is currently linked to this city dossier.`,
    sources: [],
    sourceLabels: row.sourceLabels,
  }));
}

function formatCoverageShellSummary(mappedCount: number, documentedCount: number, missingCount: number) {
  return `${mappedCount} mapped / ${documentedCount} documented / ${missingCount} missing`;
}

function findMetric(
  workspace: CommandCenterCityWorkspace,
  matcher: (indicatorId: string) => boolean,
) {
  return workspace.economicIntel.find((metric) => matcher(metric.indicatorId)) ?? null;
}

function sortEntities(entities: NonNullable<CommandCenterCityPanel["entities"]>["entities"]) {
  return [...entities].sort((left, right) => {
    if (left.exactSite !== right.exactSite) {
      return left.exactSite ? -1 : 1;
    }

    if (left.sources.length !== right.sources.length) {
      return right.sources.length - left.sources.length;
    }

    return left.entityName.localeCompare(right.entityName);
  });
}

export function CityWorkspace({ commandCenterManifest, panel }: CityWorkspaceProps) {
  const workspace = panel.workspace;

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-6">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          No source-backed dossier is available for this city yet.
        </div>
      </div>
    );
  }

  const sourceLabels = getVisibleSourceLabels(panel, workspace);
  const populationMetric = findMetric(workspace, (indicatorId) => indicatorId === "population");
  const gdpMetric = findMetric(
    workspace,
    (indicatorId) => /(^|-)gdp($|-)|gross-domestic|economic-output|gva/i.test(indicatorId),
  );
  const employmentMetric = findMetric(
    workspace,
    (indicatorId) => /employment|labour-force/i.test(indicatorId),
  );
  const analystNavigation = buildCommandCenterCityAnalystNavigation({
    panel,
    commandCenterManifest,
  });
  const missingCoverageRows = buildMissingCoverageRows(analystNavigation);
  const sourceAuditRows = buildSourceAuditRows(panel, workspace);
  const entityHighlights = sortEntities(panel.entities?.entities ?? workspace.entityHighlights).slice(0, 6);
  const entityCountChips = Object.entries(workspace.entityCounts)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1]);
  const coverageShell = panel.coverageShell;
  const coverageShellGeometry = coverageShell?.categories.find((category) => category.id === "geometry");

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="signal-dot" />
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                  City OSINT Dossier
                </p>
              </div>
              <h1 className="display-title mt-3 text-3xl font-bold sm:text-4xl">
                {panel.city.name}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {panel.city.admin1Name ? `${panel.city.admin1Name}, ` : ""}
                {panel.city.countryIso3}
              </p>
              {workspace.summary ? (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                  {workspace.summary}
                </p>
              ) : null}
              {workspace.roleTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {workspace.roleTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[22rem]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 [border-left:2px_solid_color-mix(in_srgb,var(--signal)_42%,transparent)]">
                <p className="metric-label text-slate-400">Population</p>
                <p className="metric-value mt-2 text-2xl text-white">
                  {populationMetric?.value !== null && populationMetric?.value !== undefined
                    ? compactNumber.format(populationMetric.value)
                    : panel.city.population
                      ? compactNumber.format(panel.city.population)
                      : "n/a"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 [border-left:2px_solid_color-mix(in_srgb,var(--signal)_42%,transparent)]">
                <p className="metric-label text-slate-400">GDP</p>
                <p className="metric-value mt-2 text-2xl text-white">
                  {gdpMetric ? formatMetricValue(gdpMetric.value, gdpMetric.unit) : "n/a"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 [border-left:2px_solid_color-mix(in_srgb,var(--signal)_42%,transparent)]">
                <p className="metric-label text-slate-400">Employment</p>
                <p className="metric-value mt-2 text-2xl text-white">
                  {employmentMetric ? formatMetricValue(employmentMetric.value, employmentMetric.unit) : "n/a"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 [border-left:2px_solid_color-mix(in_srgb,var(--signal)_42%,transparent)]">
                <p className="metric-label text-slate-400">Selection Surface</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  {formatCodeLabel(workspace.coverageBoundaryType)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(workspace.coverage).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {formatCoverageDimensionLabel(key as keyof CommandCenterCityWorkspace["coverage"])}:{" "}
                {coverageLabels[value] ?? formatCodeLabel(value)}
              </span>
            ))}
          </div>

          {coverageShell ? (
            <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Dossier Shell</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-50">
                    {formatCoverageShellSummary(
                      coverageShell.mappedCategoryCount,
                      coverageShell.documentedCategoryCount,
                      coverageShell.missingCategoryCount,
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {coverageShellGeometry?.detail ??
                      "Coverage-shell geometry state is tracked for this city dossier."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coverageShell.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                    >
                      {category.label}: {category.count.toLocaleString("en-US")} {analystStateLabels[category.state]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {sourceLabels.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Visible Source Labels
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sourceLabels.map((source) => (
                  <SourceBadge key={source.id} source={source} compact />
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <OsintDossierSection
          id="economic-factbook"
          title="Economic Factbook"
          description="Observed city-scale output, labor, and population coverage for the selected surface."
          countLabel={`${workspace.economicIntel.length} metric${workspace.economicIntel.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable rows={buildMetricRows(workspace.economicIntel)} />
        </OsintDossierSection>

        <OsintDossierSection
          id="logistics-transport"
          title="Logistics & Transport"
          description="Ports, airports, rail, freight, and logistics signals attached to the city footprint."
          countLabel={`${workspace.transportIntel.length} metric${workspace.transportIntel.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable rows={buildMetricRows(workspace.transportIntel)} />
        </OsintDossierSection>

        <OsintDossierSection
          id="utilities-energy"
          title="Utilities & Energy"
          description="Power and critical utility evidence linked to the city evidence bundle."
          countLabel={`${workspace.utilitiesIntel.length} metric${workspace.utilitiesIntel.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable rows={buildMetricRows(workspace.utilitiesIntel)} />
        </OsintDossierSection>

        <OsintDossierSection
          id="telecom-connectivity"
          title="Telecom & Connectivity"
          description="Published telecom and mobility observations tied to the city selection surface."
          countLabel={`${workspace.telecomIntel.length} metric${workspace.telecomIntel.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable rows={buildMetricRows(workspace.telecomIntel)} />
        </OsintDossierSection>

        <OsintDossierSection
          id="environment-hazards"
          title="Environment & Hazards"
          description="Air, water, and emissions evidence visible at the city scale."
          countLabel={`${workspace.environmentIntel.length} metric${workspace.environmentIntel.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable rows={buildMetricRows(workspace.environmentIntel)} />
        </OsintDossierSection>

        <OsintDossierSection
          id="institutions-public-services"
          title="Institutions & Public Services"
          description="Institutional presence, research anchors, company signals, and exact-site assets for this city."
          countLabel={`${entityHighlights.length} highlighted asset${entityHighlights.length === 1 ? "" : "s"}`}
        >
          <div className="space-y-5">
            <LayerEvidenceTable rows={buildMetricRows(workspace.organizationIntel)} />
            {entityCountChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entityCountChips.map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                  >
                    {entityCountLabels[key] ?? formatCodeLabel(key)}: {value.toLocaleString("en-US")}
                  </span>
                ))}
              </div>
            ) : null}
            {entityHighlights.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {entityHighlights.map((entity) => (
                  <EntityCard key={entity.entityId} entity={entity} showSource />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No highlighted organization or asset evidence is published for this city yet.
              </div>
            )}
          </div>
        </OsintDossierSection>

        <OsintDossierSection
          id="source-coverage-data-quality"
          title="Source Coverage & Data Quality"
          description="Direct source lineage for the current dossier, including coverage surface summaries and published layer evidence."
          countLabel={`${sourceAuditRows.length} audit row${sourceAuditRows.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable
            rows={sourceAuditRows}
            emptyMessage="No source audit rows are available for this city yet."
          />
        </OsintDossierSection>

        <OsintDossierSection
          id="missing-coverage-gaps"
          title="Missing Coverage & Gaps"
          description="Queued datasets and explicit city-level evidence gaps that still need parser, matching, or publication work."
          countLabel={`${missingCoverageRows.length} tracked gap${missingCoverageRows.length === 1 ? "" : "s"}`}
        >
          <LayerEvidenceTable
            rows={missingCoverageRows}
            emptyMessage="No queued or missing evidence gaps are currently tracked for this city."
          />
        </OsintDossierSection>
      </div>
    </div>
  );
}
