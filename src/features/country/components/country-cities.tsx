"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { assetUrl } from "@/lib/asset-url";
import { loadEnrichmentIndex, type CityEnrichment } from "@/lib/city-data-client";

type CityListing = {
  cityId: string;
  slug: string;
  name: string;
  admin1Name?: string;
  latitude: number;
  longitude: number;
  population?: number;
  isMajorCity?: boolean;
};

export function CountryCities({ countryIso3 }: { countryIso3: string }) {
  const [cities, setCities] = useState<CityListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [enrichment, setEnrichment] = useState<Record<string, CityEnrichment>>({});
  const pageSize = 100;

  useEffect(() => {
    let cancelled = false;
    fetch(assetUrl(`/data/countries/${countryIso3.toLowerCase()}_cities.json`))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        setCities(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load cities", err);
        setCities([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  // Slim connectivity/PM2.5 index (keyed by cityId) so the directory can surface the new
  // source-backed enrichment alongside each city. Degrades to {} when absent.
  useEffect(() => {
    let cancelled = false;
    loadEnrichmentIndex().then((e) => {
      if (!cancelled) setEnrichment(e);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState label="Indexing cities..." />;
  if (cities.length === 0) {
    return (
      <EmptyState
        title="No cities mapped"
        description="No city entries were found in the global registry for this country."
      />
    );
  }

  const query = search.toLowerCase().trim();
  const filteredCities = query
    ? cities.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.admin1Name?.toLowerCase().includes(query)
      )
    : cities;

  const totalPages = Math.ceil(filteredCities.length / pageSize);
  const paginatedCities = filteredCities.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">City Intelligence Directory</h2>
          <p className="text-sm text-slate-400 mt-1">
            Showing {filteredCities.length.toLocaleString()} out of {cities.length.toLocaleString()} total indexed cities and regional hubs.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by city or region..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 font-medium text-slate-300">City Name</th>
              <th className="px-4 py-3 font-medium text-slate-300 hidden md:table-cell">Region / ADM1</th>
              <th className="px-4 py-3 font-medium text-slate-300 hidden sm:table-cell text-right">Population</th>
              <th className="px-4 py-3 font-medium text-slate-300 hidden lg:table-cell text-right">Fixed broadband</th>
              <th className="px-4 py-3 font-medium text-slate-300 text-right">Coordinates</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedCities.map((city) => (
              <tr key={city.cityId} className="hover:bg-white/5 group transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white group-hover:text-cyan-300 transition">
                      {city.name}
                    </span>
                    {city.isMajorCity && (
                      <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-cyan-300 border border-cyan-500/20">
                        Major Hub
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5">
                    {city.cityId}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                  {city.admin1Name || "—"}
                </td>
                <td className="px-4 py-3 text-slate-300 hidden sm:table-cell text-right font-mono">
                  {city.population ? city.population.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-slate-300 hidden lg:table-cell text-right font-mono text-[11px]">
                  {enrichment[city.cityId]?.fixedMbps != null
                    ? `${Math.round(enrichment[city.cityId]!.fixedMbps!)} Mbps`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-right font-mono text-[11px]">
                  {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/?city=${city.slug}&view=global-ops`}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Open Map
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
