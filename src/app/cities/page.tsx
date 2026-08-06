"use client";

import { useMemo, useState } from "react";

import {
  getAllCapitals,
  getCityKnowledgeStats,
  searchCities,
  TOTAL_GLOBAL_CITIES,
} from "@/data/mock/global-city-runtime";

export const metadata = {
  title: "Global Cities — EconMap",
  description: "Every city knowledge base. Browse, search, and explore cities worldwide.",
};

export default function CitiesPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "capitals" | "search">("all");

  const stats = useMemo(() => getCityKnowledgeStats(), []);
  const capitals = useMemo(() => getAllCapitals(), []);

  const displayedCities = useMemo(() => {
    if (view === "capitals") return capitals;
    if (query.trim()) return searchCities(query);
    return capitals.slice(0, 50);
  }, [view, query, capitals]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Global City Knowledge</h1>
          <p className="mt-1 text-sm text-slate-400">
            No city without knowledge. Every city has a record — from capitals to towns.
          </p>
        </header>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Seed Cities</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.seedCities}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <p className="text-xs uppercase tracking-wider text-cyan-300">Countries</p>
              <p className="mt-2 text-3xl font-bold text-cyan-200">{stats.countries}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
              <p className="text-xs uppercase tracking-wider text-emerald-300">Capitals</p>
              <p className="mt-2 text-3xl font-bold text-emerald-200">{stats.capitals}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-wider text-amber-300">Megacities</p>
              <p className="mt-2 text-3xl font-bold text-amber-200">{stats.megacities}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-white">City Records</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setView("search"); }}
                  placeholder="Search cities or countries..."
                  className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  onClick={() => { setView("all"); setQuery(""); }}
                  className={`rounded-lg px-3 py-2 text-sm ${view === "all" ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-400"}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setView("capitals"); setQuery(""); }}
                  className={`rounded-lg px-3 py-2 text-sm ${view === "capitals" ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-400"}`}
                >
                  Capitals
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Coverage</th>
                    <th className="px-4 py-3">Population</th>
                    <th className="px-4 py-3">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedCities.map((city) => (
                    <tr key={city.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{city.name}</td>
                      <td className="px-4 py-3 text-slate-300">{city.countryName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          city.coverage === "capital"
                            ? "bg-cyan-400/20 text-cyan-200"
                            : city.coverage === "major_city"
                              ? "bg-emerald-400/20 text-emerald-200"
                              : city.coverage === "admin_center"
                                ? "bg-blue-400/20 text-blue-200"
                                : "bg-slate-400/20 text-slate-200"
                        }`}>
                          {city.coverage.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {city.population >= 1_000_000
                          ? `${(city.population / 1_000_000).toFixed(1)}M`
                          : `${(city.population / 1_000).toFixed(0)}K`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {city.roleTags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Showing {displayedCities.length} of {TOTAL_GLOBAL_CITIES} seed cities.
              Full dataset: ~120,000 cities via GeoNames pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
