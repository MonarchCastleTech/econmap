"use client";

import Link from "next/link";

import type { CommandCenterAnalystRowState } from "@/domain/types";
import { CityBriefSection } from "@/features/home/components/layout/city-brief-section";

export type TacticalSidebarSearchResult = {
  href: string;
  meta: string;
  name: string;
  populationLabel: string;
  selected: boolean;
};

export type TacticalSidebarAnalystRow = {
  active?: boolean;
  detail?: string;
  href?: string;
  id: string;
  label: string;
  sourceLabels: string[];
  state: CommandCenterAnalystRowState;
  mappedCount: number;
  documentedCount: number;
  queuedDatasetCount: number;
};

export type TacticalSidebarAnalystSection = {
  description: string;
  id: string;
  rows: TacticalSidebarAnalystRow[];
  title: string;
};

export type TacticalSidebarMetricRow = {
  label: string;
  sourceLabel?: string;
  value: string;
};

export type TacticalSidebarInfrastructureRow = {
  label: string;
  value: string;
};

export type TacticalSidebarEntityRow = {
  entityName: string;
  entityTypeLabel: string;
  exactSite: boolean;
  presenceLabel: string;
};

export type TacticalSidebarWatchlist = {
  cityCount: number;
  cityLabels: string[];
  description: string;
  href?: string;
  id: string;
  label: string;
  sourceLabels: string[];
};

export type TacticalSidebarSelectedCityIntel =
  | {
      cityMeta: string;
      cityName: string;
      clearHref: string;
      coverageBadges: string[];
      entityRows: TacticalSidebarEntityRow[];
      infrastructureRows: TacticalSidebarInfrastructureRow[];
      kind: "selected-city";
      metricRows: TacticalSidebarMetricRow[];
      sourceLabels: string[];
      summary?: string;
      workspaceHref: string;
    }
  | {
      body: string;
      kind: "selection-prompt";
      sourceLabels: string[];
      title: string;
    };

type TacticalSidebarProps = {
  activeBaseImageryLayerId: string;
  activeDate?: string;
  activeLayerIdsValue: string;
  analystSections: TacticalSidebarAnalystSection[];
  datasetWorkspaceSummary: {
    href: string;
    label: string;
    meta: string;
  };
  featuredCities: TacticalSidebarSearchResult[];
  recentCities: TacticalSidebarSearchResult[];
  searchQuery: string;
  searchResults: TacticalSidebarSearchResult[];
  searchResultsLoading?: boolean;
  selectedCityIntel: TacticalSidebarSelectedCityIntel;
  selectedViewId: string;
  selectedViewLabel: string;
  watchlists: TacticalSidebarWatchlist[];
};

function renderSearchResult(result: TacticalSidebarSearchResult) {
  return (
    <Link
      key={result.href}
      href={result.href}
      className={`block border px-2.5 py-2 transition ${
        result.selected
          ? "border-[#9cab7a]/55 bg-[#23291f]/90"
          : "border-[#272c29] bg-[#0f1112]/88 hover:border-[#3b4334]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{result.name}</p>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {result.meta}
          </p>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-400">
          {result.populationLabel}
        </span>
      </div>
    </Link>
  );
}

function getAnalystStateClassName(state: CommandCenterAnalystRowState) {
  switch (state) {
    case "mapped":
      return "border-[#9cab7a]/45 bg-[#242a20] text-[#d7dfc1]";
    case "documented":
      return "border-sky-300/30 bg-sky-400/10 text-sky-100";
    case "queued":
      return "border-amber-300/30 bg-amber-300/10 text-amber-100";
    default:
      return "border-[#3a4037] bg-[#121515] text-slate-400";
  }
}

function buildAnalystCountLabels(row: TacticalSidebarAnalystRow) {
  const labels: string[] = [];

  if (row.mappedCount > 0) {
    labels.push(`${row.mappedCount} mapped`);
  }

  if (row.documentedCount > 0) {
    labels.push(`${row.documentedCount} documented`);
  }

  if (row.queuedDatasetCount > 0) {
    labels.push(`${row.queuedDatasetCount} queued`);
  }

  return labels;
}

function AnalystRowBody({
  active,
  detail,
  documentedCount,
  label,
  mappedCount,
  queuedDatasetCount,
  sourceLabels,
  state,
}: Omit<TacticalSidebarAnalystRow, "href" | "id">) {
  const visibleSourceLabels = sourceLabels.slice(0, 3);
  const remainingSourceCount = Math.max(sourceLabels.length - visibleSourceLabels.length, 0);
  const countLabels = buildAnalystCountLabels({
    active,
    detail,
    documentedCount,
    href: undefined,
    id: label,
    label,
    mappedCount,
    queuedDatasetCount,
    sourceLabels,
    state,
  });

  return (
    <div
      className={`tactical-panel border px-2.5 py-2 transition ${
        active
          ? "border-[#8f9c6e]/55 bg-[#1a1f1b]"
          : "border-[#272c29] bg-[#0f1112]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{label}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
            {detail ?? "No source-backed detail published for this row yet."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {active !== undefined ? (
            <span
              className={`tactical-chip px-1.5 py-0.5 text-[9px] tracking-[0.18em] ${
                active
                  ? "border-[#9cab7a]/45 bg-[#242a20] text-[#d7dfc1]"
                  : "border-[#3a4037] bg-[#121515] text-slate-400"
              }`}
            >
              {active ? "on" : "off"}
            </span>
          ) : null}
          <span
            className={`tactical-chip shrink-0 px-1.5 py-0.5 text-[9px] tracking-[0.18em] ${getAnalystStateClassName(
              state,
            )}`}
          >
            {state}
          </span>
        </div>
      </div>

      {countLabels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {countLabels.map((countLabel) => (
            <span
              key={`${label}-${countLabel}`}
              className="tactical-chip px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-slate-300"
            >
              {countLabel}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1">
        {visibleSourceLabels.length > 0 ? (
          visibleSourceLabels.map((sourceLabel) => (
            <span
              key={`${label}-${sourceLabel}`}
              className="tactical-chip tactical-chip-active px-1.5 py-0.5 text-[9px] tracking-[0.18em]"
            >
              {sourceLabel}
            </span>
          ))
        ) : (
          <span className="tactical-chip px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-slate-500">
            No source label
          </span>
        )}
        {remainingSourceCount > 0 ? (
          <span className="tactical-chip px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-slate-400">
            +{remainingSourceCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function renderAnalystRow(row: TacticalSidebarAnalystRow) {
  if (!row.href) {
    return <AnalystRowBody key={row.id} {...row} />;
  }

  return (
    <Link key={row.id} href={row.href} className="block">
      <AnalystRowBody {...row} />
    </Link>
  );
}

function renderSelectedCityIntel({
  analystSections,
  selectedCityIntel,
}: {
  analystSections: TacticalSidebarAnalystSection[];
  selectedCityIntel: TacticalSidebarSelectedCityIntel;
}) {
  const analystRows = analystSections.flatMap((section) => section.rows);
  const mappedCount = analystRows.filter((row) => row.state === "mapped").length;
  const documentedCount = analystRows.filter((row) => row.state === "documented").length;
  const gapCount = analystRows.filter((row) => row.state === "queued" || row.state === "missing").length;

  if (selectedCityIntel.kind === "selection-prompt") {
    return (
      <div className="border border-[#272c29] bg-[#0f1112] px-3 py-3">
        <p className="text-sm font-semibold text-white">{selectedCityIntel.title}</p>
        <p className="mt-2 text-[12px] leading-5 text-slate-400">{selectedCityIntel.body}</p>
        {selectedCityIntel.sourceLabels.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {selectedCityIntel.sourceLabels.map((sourceLabel) => (
              <span key={`prompt-${sourceLabel}`} className="tactical-chip px-1.5 py-0.5 text-[9px]">
                {sourceLabel}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 border border-[#272c29] bg-[#0f1112] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-none text-white">{selectedCityIntel.cityName}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            {selectedCityIntel.cityMeta}
          </p>
        </div>
        <Link href={selectedCityIntel.clearHref} className="tactical-chip px-2 py-1 text-[10px]">
          Clear
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
          {mappedCount} mapped
        </span>
        <span className="tactical-chip px-2 py-1 text-[10px]">{documentedCount} documented</span>
        <span className="tactical-chip px-2 py-1 text-[10px]">{gapCount} gaps</span>
        {selectedCityIntel.coverageBadges.map((badge) => (
          <span
            key={`coverage-${badge}`}
            className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]"
          >
            {badge}
          </span>
        ))}
      </div>

      {selectedCityIntel.summary ? (
        <p className="text-[12px] leading-5 text-slate-300">{selectedCityIntel.summary}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Link
          href={selectedCityIntel.workspaceHref}
          className="tactical-chip tactical-chip-active flex-1 justify-center px-3 py-2 text-[11px]"
        >
          Open full city dossier
        </Link>
        <span className="tactical-chip px-2 py-1 text-[9px]">
          {selectedCityIntel.sourceLabels.length} sources
        </span>
      </div>

      <CityBriefSection rows={selectedCityIntel.metricRows} title="Snapshot" />
      <CityBriefSection rows={selectedCityIntel.infrastructureRows} title="Infrastructure" />

      {selectedCityIntel.entityRows.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Entity cues</p>
          <div className="space-y-1.5">
            {selectedCityIntel.entityRows.map((entity) => (
              <div
                key={`${entity.entityTypeLabel}-${entity.entityName}`}
                className="border border-[#272c29] bg-[#121515] px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-white">{entity.entityName}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {entity.entityTypeLabel} / {entity.presenceLabel}
                    </p>
                  </div>
                  <span className="tactical-chip px-1.5 py-0.5 text-[9px]">
                    {entity.exactSite ? "exact" : "city"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {selectedCityIntel.sourceLabels.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Visible source labels</p>
          <div className="flex flex-wrap gap-1">
            {selectedCityIntel.sourceLabels.map((sourceLabel) => (
              <span
                key={`selected-city-${sourceLabel}`}
                className="tactical-chip tactical-chip-active px-1.5 py-0.5 text-[9px]"
              >
                {sourceLabel}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderWatchlist(watchlist: TacticalSidebarWatchlist) {
  const visibleSourceLabels = watchlist.sourceLabels.slice(0, 3);
  const content = (
    <div className="border border-[#272c29] bg-[#0f1112] px-2.5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{watchlist.label}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{watchlist.description}</p>
        </div>
        <span className="tactical-chip px-2 py-1 text-[9px]">{watchlist.cityCount} cities</span>
      </div>
      {watchlist.cityLabels.length > 0 ? (
        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {watchlist.cityLabels.join(" / ")}
        </p>
      ) : null}
      {visibleSourceLabels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleSourceLabels.map((sourceLabel) => (
            <span
              key={`${watchlist.id}-${sourceLabel}`}
              className="tactical-chip tactical-chip-active px-1.5 py-0.5 text-[9px]"
            >
              {sourceLabel}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!watchlist.href) {
    return <div key={watchlist.id}>{content}</div>;
  }

  return (
    <Link key={watchlist.id} href={watchlist.href} className="block">
      {content}
    </Link>
  );
}

function renderCityListSection({
  emptyMessage,
  results,
  title,
}: {
  emptyMessage: string;
  results: TacticalSidebarSearchResult[];
  title: string;
}) {
  return (
    <section className="space-y-2 border-b border-[#232825] pb-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a7b47f]">{title}</p>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">{results.length}</span>
      </div>
      {results.length > 0 ? (
        <div className="space-y-1.5">{results.map(renderSearchResult)}</div>
      ) : (
        <div className="border border-[#272c29] bg-[#0f1112] px-3 py-3">
          <p className="text-[12px] leading-5 text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

export function TacticalSidebar({
  activeBaseImageryLayerId,
  activeDate,
  activeLayerIdsValue,
  analystSections,
  datasetWorkspaceSummary,
  featuredCities,
  recentCities,
  searchQuery,
  searchResults,
  searchResultsLoading = false,
  selectedCityIntel,
  selectedViewId,
  selectedViewLabel,
  watchlists,
}: TacticalSidebarProps) {
  const visibleSections = analystSections;

  return (
    <aside
      data-testid="tactical-command-rail"
      data-density="operator-console"
      data-geometry="hard-edge"
      data-layout="mission-console"
      className="flex h-full flex-col gap-3 border border-[#31362f] bg-[#101313]/97 px-3 py-3 font-sans"
    >
      <div className="border-b border-[#232825] pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="signal-dot" />
              <p className="eyebrow">Analyst rail · live</p>
            </div>
            <h1 className="display-title mt-1.5 text-[19px] font-bold leading-none">City-first OSINT atlas</h1>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-slate-500">{selectedViewLabel}</p>
          </div>
          <div className="grid gap-1.5">
            <span className="tactical-chip justify-center px-2 py-1 text-[10px]">
              {visibleSections.length} sections
            </span>
          </div>
        </div>
      </div>

      <div className="tactical-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <section className="space-y-2 border-b border-[#232825] pb-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a7b47f]">City jump</p>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">{selectedViewLabel}</span>
          </div>

          <form action="/" className="space-y-2">
            <input type="hidden" name="view" value={selectedViewId} />
            <input type="hidden" name="layers" value={activeLayerIdsValue} />
            <input type="hidden" name="base" value={activeBaseImageryLayerId} />
            {activeDate ? <input type="hidden" name="date" value={activeDate} /> : null}
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.24em] text-slate-500">Search</span>
              <input
                name="q"
                type="search"
                defaultValue={searchQuery}
                placeholder="Search cities, coordinates, aliases"
                className="tactical-input px-3 py-2.5 text-sm"
              />
            </label>
            <button type="submit" className="tactical-chip tactical-chip-active px-3 py-2 text-[11px]">
              Open city brief
            </button>
          </form>

          {renderSelectedCityIntel({
            analystSections,
            selectedCityIntel,
          })}

          {searchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Search results</p>
              <div className="space-y-1.5">{searchResults.slice(0, 8).map(renderSearchResult)}</div>
            </div>
          ) : searchResultsLoading ? (
            <div className="border border-[#272c29] bg-[#0f1112] px-3 py-3">
              <p className="text-[12px] leading-5 text-slate-400">
                Searching the source-backed city index for matching briefs.
              </p>
            </div>
          ) : featuredCities.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Jump set</p>
              <div className="space-y-1.5">{featuredCities.slice(0, 6).map(renderSearchResult)}</div>
            </div>
          ) : null}
        </section>

        {visibleSections.map((section) => (
          <section key={section.id} className="space-y-2 border-b border-[#232825] pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">{section.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{section.description}</p>
              </div>
              <span className="tactical-chip px-2 py-1 text-[9px]">{section.rows.length}</span>
            </div>

            {section.rows.length > 0 ? (
              <div className="space-y-1.5">{section.rows.map(renderAnalystRow)}</div>
            ) : (
              <div className="border border-[#272c29] bg-[#0f1112] px-3 py-3">
                <p className="text-[12px] leading-5 text-slate-400">
                  No source-backed rows are published for this section yet.
                </p>
              </div>
            )}
          </section>
        ))}

        <section className="space-y-2 border-b border-[#232825] pb-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a7b47f]">
              Saved watchlists / compare sets
            </p>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">{watchlists.length}</span>
          </div>
          {watchlists.length > 0 ? (
            <div className="space-y-1.5">{watchlists.map(renderWatchlist)}</div>
          ) : (
            <div className="border border-[#272c29] bg-[#0f1112] px-3 py-3">
              <p className="text-[12px] leading-5 text-slate-400">
                No saved compare sets are published for this build yet.
              </p>
            </div>
          )}
        </section>

        {renderCityListSection({
          emptyMessage: "No recently viewed cities have been recorded in this browser yet.",
          results: recentCities,
          title: "Recently viewed cities",
        })}
      </div>

      <div className="border-t border-[#232825] pt-3">
        <Link href={datasetWorkspaceSummary.href} className="block border border-[#272c29] bg-[#0f1112] px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{datasetWorkspaceSummary.label}</p>
          <p className="mt-1 text-[11px] text-slate-300">{datasetWorkspaceSummary.meta}</p>
        </Link>
      </div>
    </aside>
  );
}
