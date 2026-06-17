import { PageFrame } from "@/components/layout/page-frame";
import { loadLegacyOsintSurfaceModel } from "@/lib/command-center-data";

export async function ReportsPage() {
  const model = await loadLegacyOsintSurfaceModel();

  return (
    <PageFrame
      eyebrow="Reports"
      title="Analyst outputs from the city OSINT spine"
      description="Reports now assemble from the same selected cities and saved watchlists used across compare, dashboard, rankings, and dataset surfaces."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {model.watchlists.map((watchlist) => (
          <div key={watchlist.id} className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6">
            <p className="text-lg font-semibold text-white">{watchlist.label}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{watchlist.description}</p>
            <p className="mt-4 text-sm text-slate-400">
              Selected cities:{" "}
              {model.selectedCities
                .filter((city) => watchlist.citySlugs.includes(city.slug))
                .map((city) => city.name)
                .join(", ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {watchlist.sourceLabels.map((sourceLabel) => (
                <span key={`${watchlist.id}:${sourceLabel}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {sourceLabel}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
