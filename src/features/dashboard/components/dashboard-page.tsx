import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { loadLegacyOsintSurfaceModel } from "@/lib/command-center-data";

export async function DashboardPage() {
  const model = await loadLegacyOsintSurfaceModel();
  const infrastructureWatchlist = model.watchlists.find(
    (watchlist) => watchlist.id === "infrastructure-watchlist",
  );

  return (
    <PageFrame
      eyebrow="Dashboard"
      title="Saved OSINT watchlists"
      description="Pinned dashboards now track selected cities, layer-linked sources, and reusable watchlists built from the same operating model as city dossiers."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
          <h2 className="text-lg font-semibold text-white">Infrastructure watchlist</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {infrastructureWatchlist?.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {infrastructureWatchlist?.sourceLabels.map((sourceLabel) => (
              <span key={sourceLabel} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50">
                {sourceLabel}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {model.selectedCities.map((city) => (
              <Link
                key={city.cityId}
                href={`/city/${city.slug}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/30"
              >
                <p className="text-lg font-semibold text-white">{city.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {city.admin1Name ? `${city.admin1Name}, ` : ""}
                  {city.countryIso3}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    Infrastructure: {city.infrastructureCount.toLocaleString("en-US")}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    Institutions: {city.institutionCount.toLocaleString("en-US")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
          <h2 className="text-lg font-semibold text-white">Saved watchlists</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Shared monitoring sets stay aligned with the same featured city selection.
          </p>
          <div className="mt-4 space-y-3">
            {model.watchlists
              .filter((watchlist) => watchlist.id !== "infrastructure-watchlist")
              .map((watchlist) => (
              <div key={watchlist.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{watchlist.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{watchlist.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {watchlist.sourceLabels.map((sourceLabel) => (
                    <span key={`${watchlist.id}:${sourceLabel}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {sourceLabel}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
