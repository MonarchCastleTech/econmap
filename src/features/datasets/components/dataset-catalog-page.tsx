import Link from "next/link";

import type { CommandCenterManifest } from "@/domain/types";

type DatasetCatalogPageProps = {
  manifest: CommandCenterManifest;
};

function getGroupTitle(status: string) {
  switch (status) {
    case "published_to_website":
      return "Operational datasets";
    case "processed_with_data":
      return "Processed local datasets";
    case "processed_without_data":
      return "Empty processed pipelines";
    case "identified_public_source":
      return "Identified public sources";
    default:
      return "Downloaded source packs";
  }
}

function countDatasetsBySurface(
  items: CommandCenterManifest["datasetInventory"],
  surface: string,
) {
  return items.filter((item) => item.websiteSurfaces.includes(surface)).length;
}

export function DatasetCatalogPage({ manifest }: DatasetCatalogPageProps) {
  const groups = new Map<string, typeof manifest.datasetInventory>();

  for (const item of manifest.datasetInventory) {
    const existing = groups.get(item.status) ?? [];
    existing.push(item);
    groups.set(item.status, existing);
  }

  const surfaceSummary = [
    { label: "Globe layers", value: countDatasetsBySurface(manifest.datasetInventory, "globe layer") },
    { label: "Base imagery", value: countDatasetsBySurface(manifest.datasetInventory, "base imagery") },
    { label: "City bundles", value: countDatasetsBySurface(manifest.datasetInventory, "city bundles") },
    { label: "Dataset workspaces", value: countDatasetsBySurface(manifest.datasetInventory, "dataset workspace") },
  ];

  return (
    <main className="min-h-screen bg-[#090a0a] px-4 py-4 text-slate-100 lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#a7b47f]">Datasets</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Analytical dataset explorer</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Browse datasets by the product surfaces they feed: city dossiers, globe layers, base imagery, and
              source-backed workspace audits.
            </p>
          </div>
          <Link href="/" className="tactical-chip tactical-chip-active">
            Return to Global Ops
          </Link>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          {surfaceSummary.map((item) => (
            <div key={item.label} className="tactical-panel border-[#42483a] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from(groups.entries()).map(([status, items]) => (
            <section key={status} className="tactical-panel border-[#42483a] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">{getGroupTitle(status)}</p>
                  <p className="mt-1 text-sm text-slate-300">{items.length} datasets</p>
                </div>
                <span className="tactical-chip px-2 py-1 text-[10px]">{status.replace(/_/g, " ")}</span>
              </div>

              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.workspacePath ?? `/datasets/${item.id}`}
                    className="tactical-panel block border border-[#272c29] bg-[#0f1112] px-3 py-3 transition hover:border-[#9cab7a]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.websiteSurfaces.map((surface) => (
                            <span key={surface} className="tactical-chip px-2 py-1 text-[10px]">
                              {surface}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.sourceLabels.map((sourceLabel) => (
                            <span key={sourceLabel} className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
                              {sourceLabel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="tactical-chip px-2 py-1 text-[10px]">Open</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
