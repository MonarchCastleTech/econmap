import Link from "next/link";

import type { CommandCenterDatasetWorkspace } from "@/domain/types";
import type { CommandCenterDatasetAnalytics } from "@/lib/command-center-data";

type DatasetWorkspacePageProps = {
  workspace: CommandCenterDatasetWorkspace;
  analytics?: CommandCenterDatasetAnalytics;
};

const numberFormatter = new Intl.NumberFormat("en-US");

const surfaceDescriptions: Record<string, string> = {
  "base imagery": "Published basemap or orbital raster visible in Global Ops.",
  "city bundles": "City-level dossiers, audits, and search surfaces fed by this dataset.",
  "dataset workspace": "Analytical dataset dossier with source pack and product lineage.",
  "globe layer": "Operator-facing tactical layer visible in the published map surface.",
  "tactical base": "Selection or reference surface used to orient city-first analysis.",
};

function formatBytes(value: number) {
  if (value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatStatusLabel(status: CommandCenterDatasetWorkspace["dataset"]["status"]) {
  return status.replace(/_/g, " ");
}

function sectionCardClassName() {
  return "tactical-panel border-[#42483a] p-4";
}

function emptyState(message: string) {
  return (
    <div className="border border-dashed border-[#2f352d] bg-black/20 px-4 py-4 text-sm text-slate-400">
      {message}
    </div>
  );
}

export function DatasetWorkspacePage({
  workspace,
  analytics = {
    layerAvailability: [],
    relatedCities: [],
    coverageCountries: [],
  },
}: DatasetWorkspacePageProps) {
  const { dataset, notes, processedIndex, sourcePack } = workspace;
  const bundleCarryThrough = workspace.cityBundleCount + workspace.imageryDateCount;
  const primaryStats = [
    { label: "Website surfaces", value: dataset.websiteSurfaces.length.toString() },
    { label: "Accepted rows", value: numberFormatter.format(processedIndex.rowCount) },
    { label: "City bundles", value: numberFormatter.format(workspace.cityBundleCount) },
    { label: "Layer links", value: numberFormatter.format(analytics.layerAvailability.length) },
  ];

  return (
    <main className="min-h-screen bg-[#090a0a] px-4 py-4 text-slate-100 lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#a7b47f]">
              Dataset workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{dataset.label}</h1>
            <p className="max-w-4xl text-sm leading-6 text-slate-300">{dataset.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="tactical-chip">
              Global Ops
            </Link>
            <Link href="/datasets" className="tactical-chip tactical-chip-active">
              All datasets
            </Link>
          </div>
        </div>

        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="tactical-panel space-y-3 border-[#42483a] p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Data state</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
                  {formatStatusLabel(dataset.status)}
                </span>
                {dataset.sourceLabels.map((sourceLabel) => (
                  <span key={sourceLabel} className="tactical-chip px-2 py-1 text-[10px]">
                    {sourceLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {primaryStats.map((stat) => (
                <div key={stat.label} className="border border-[#252a24] bg-black/20 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                  <p className="mt-1.5 text-sm font-medium text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="border border-[#252a24] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Visible source labels
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dataset.sourceLabels.map((sourceLabel) => (
                  <span key={sourceLabel} className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
                    {sourceLabel}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={sectionCardClassName()}>
              <h2 className="text-lg font-semibold text-white">Website surfaces</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Where this dataset shows up in the product right now.
              </p>
              <div className="mt-4 grid gap-3">
                {dataset.websiteSurfaces.map((surface) => (
                  <div key={surface} className="border border-[#252a24] bg-black/20 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{surface}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {surfaceDescriptions[surface] ?? "Published product surface."}
                        </p>
                      </div>
                      <span className="tactical-chip px-2 py-1 text-[10px]">Live</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={sectionCardClassName()}>
              <h2 className="text-lg font-semibold text-white">Processed evidence</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Accepted output and carry-through counts emitted by the offline pipeline.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Processed index file</p>
                  <p className="mt-1.5 text-sm text-white">{processedIndex.fileName ?? "Not published"}</p>
                </div>
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Accepted rows</p>
                  <p className="mt-1.5 text-sm text-white">{numberFormatter.format(processedIndex.rowCount)}</p>
                </div>
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Bundle carry-through</p>
                  <p className="mt-1.5 text-sm text-white">{numberFormatter.format(bundleCarryThrough)}</p>
                </div>
              </div>
              {notes.length > 0 ? (
                <div className="mt-4 border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Pipeline notes</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={sectionCardClassName()}>
              <h2 className="text-lg font-semibold text-white">City coverage</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                City-level carry-through plus featured-city evidence visible in the current build.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">City bundles</p>
                  <p className="mt-1.5 text-sm text-white">{numberFormatter.format(workspace.cityBundleCount)}</p>
                </div>
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Related featured cities</p>
                  <p className="mt-1.5 text-sm text-white">{numberFormatter.format(analytics.relatedCities.length)}</p>
                </div>
                <div className="border border-[#252a24] bg-black/20 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Observed countries</p>
                  <p className="mt-1.5 text-sm text-white">
                    {analytics.coverageCountries.length > 0 ? analytics.coverageCountries.join(", ") : "n/a"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Related-city links are limited to featured cities that currently expose this dataset through visible
                source labels or source audits.
              </p>
            </section>

            <section className={sectionCardClassName()}>
              <h2 className="text-lg font-semibold text-white">Layer availability</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Published globe or imagery surfaces that currently cite this dataset.
              </p>
              <div className="mt-4 space-y-3">
                {analytics.layerAvailability.length > 0 ? (
                  analytics.layerAvailability.map((layer) => (
                    <Link
                      key={`${layer.surfaceType}:${layer.id}`}
                      href={layer.href}
                      className="block border border-[#252a24] bg-black/20 px-3 py-3 transition hover:border-[#9cab7a]/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{layer.label}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {layer.surfaceType} / {layer.sourceLabels.join(", ")}
                          </p>
                        </div>
                        <span className="tactical-chip px-2 py-1 text-[10px]">Open</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  emptyState("No published globe or imagery surface currently cites this dataset.")
                )}
              </div>
            </section>

            <section className={`${sectionCardClassName()} xl:col-span-2`}>
              <h2 className="text-lg font-semibold text-white">Source registry</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Downloaded local source files when present, plus tracked public source endpoints when a real source is
                identified but not yet ingested.
              </p>

              <div className="mt-4 overflow-hidden border border-[#252a24]">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#111313] text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Entry</th>
                      <th className="px-3 py-2 font-medium">Purpose</th>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcePack.files.length > 0 ? (
                      sourcePack.files.map((file) => (
                        <tr key={file.relativePath} className="border-t border-[#252a24] align-top">
                          <td className="px-3 py-3 text-white">{file.relativePath}</td>
                          <td className="px-3 py-3 text-slate-300">{file.purpose}</td>
                          <td className="px-3 py-3 text-slate-400">
                            {file.sizeBytes === null ? "n/a" : formatBytes(file.sizeBytes)}
                          </td>
                          <td className="px-3 py-3">
                            <a
                              href={file.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#c7d59f] hover:text-white"
                            >
                              {formatDomain(file.sourceUrl)}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-[#252a24]">
                        <td colSpan={4} className="px-3 py-4 text-slate-500">
                          No local files or tracked public source endpoints are available for this dataset in the
                          current build.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={`${sectionCardClassName()} xl:col-span-2`}>
              <h2 className="text-lg font-semibold text-white">Open related cities</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Featured cities in the current build whose city dossier visibly cites this dataset.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {analytics.relatedCities.length > 0 ? (
                  analytics.relatedCities.map((city) => (
                    <Link
                      key={city.cityId}
                      href={`/city/${city.slug}`}
                      className="block border border-[#252a24] bg-black/20 px-3 py-3 transition hover:border-[#9cab7a]/40"
                    >
                      <p className="text-sm font-medium text-white">{city.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {city.admin1Name ? `${city.admin1Name}, ` : ""}
                        {city.countryIso3}
                      </p>
                      <span className="mt-3 inline-flex tactical-chip px-2 py-1 text-[10px]">Open city dossier</span>
                    </Link>
                  ))
                ) : (
                  <div className="md:col-span-2 xl:col-span-4">
                    {emptyState("No featured city currently exposes this dataset through a visible city dossier source label.")}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
