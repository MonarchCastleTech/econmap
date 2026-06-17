import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { loadLegacyOsintSurfaceModel } from "@/lib/command-center-data";

export async function ComparePage() {
  const model = await loadLegacyOsintSurfaceModel();
  const compareSet = model.watchlists.find((watchlist) => watchlist.id === "osint-compare-set");

  return (
    <PageFrame
      eyebrow="Compare"
      title="City and country intelligence comparison"
      description="Compare the current city operating picture through one shared OSINT spine: selected cities, visible source labels, infrastructure counts, and institutional signals."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
          <h2 className="text-lg font-semibold text-white">Selected cities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            These featured cities anchor the same compare, dashboard, rankings, and report surfaces.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {model.selectedCities.map((city) => (
              <Link
                key={city.cityId}
                href={`/city/${city.slug}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{city.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {city.admin1Name ? `${city.admin1Name}, ` : ""}
                      {city.countryIso3}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    Open dossier
                  </span>
                </div>
                {city.summary ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">{city.summary}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {city.coverageBadges.map((badge) => (
                    <span key={`${city.cityId}:${badge}`} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50">
                      {badge}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
          <h2 className="text-lg font-semibold text-white">OSINT compare set</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {compareSet?.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {compareSet?.sourceLabels.map((sourceLabel) => (
              <span key={sourceLabel} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                {sourceLabel}
              </span>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3 pr-4">Country</th>
                  <th className="pb-3 pr-4">Infrastructure</th>
                  <th className="pb-3 pr-4">Institutions</th>
                  <th className="pb-3 pr-4">Visible sources</th>
                </tr>
              </thead>
              <tbody>
                {model.selectedCities.map((city) => (
                  <tr key={city.cityId} className="border-b border-white/5 align-top">
                    <td className="py-3 pr-4 text-white">{city.name}</td>
                    <td className="py-3 pr-4">{city.countryIso3}</td>
                    <td className="py-3 pr-4">{city.infrastructureCount.toLocaleString("en-US")}</td>
                    <td className="py-3 pr-4">{city.institutionCount.toLocaleString("en-US")}</td>
                    <td className="py-3 pr-4">{city.sourceLabels.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 flex flex-col justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-white">Geopolitical Blocs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Compare aggregate infrastructure and economic power across major strategic alliances (NATO, BRICS, EU, etc.).
            </p>
          </div>
          <Link
            href="/compare/blocs"
            className="mt-4 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-300/20"
          >
            View Bloc Analysis
          </Link>
        </section>
      </div>
    </PageFrame>
  );
}
