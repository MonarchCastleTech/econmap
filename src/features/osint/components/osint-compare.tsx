"use client";

/**
 * Multi-city OSINT compare (/osint/compare): pick up to 3 cities and read their source-backed
 * coverage + entity profiles side by side, with a per-entity-type differential strip so gaps
 * read at a glance. Reuses the slim search index + the useCityDossier hook (Range dossier bundle)
 * — zero new data pipeline. Deep-linkable via ?cities=geo-1,geo-2 (read in a Suspense boundary
 * at the page level, required under output:'export').
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Crosshair, Plus, X } from "lucide-react";

import {
  loadCitySearchIndex,
  loadEnrichmentIndex,
  type CityEnrichment,
  type CitySearchIndexEntry,
} from "@/lib/city-data-client";
import { useCityDossier } from "@/features/osint/lib/use-city-dossier";
import { entityLabel, fmtPop } from "@/features/osint/lib/entity-display";

const MAX = 3;

export function OsintCompare() {
  const params = useSearchParams();
  const [index, setIndex] = useState<CitySearchIndexEntry[] | null>(null);
  const [cities, setCities] = useState<CitySearchIndexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [enrichment, setEnrichment] = useState<Record<string, CityEnrichment>>({});
  const seeded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadEnrichmentIndex().then((e) => {
      if (!cancelled) setEnrichment(e);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the index and, one-shot, seed selection from ?cities=geo-1,geo-2 — both writes happen in
  // the async .then so there's no synchronous setState in the effect body.
  useEffect(() => {
    let cancelled = false;
    loadCitySearchIndex().then((idx) => {
      if (cancelled) return;
      setIndex(idx);
      if (seeded.current) return;
      seeded.current = true;
      const ids = (params.get("cities") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX);
      if (ids.length === 0) return;
      const byId = new Map(idx.map((e) => [e.cityId, e]));
      setCities(ids.map((id) => byId.get(id)).filter((c): c is CitySearchIndexEntry => Boolean(c)));
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  // Fixed-count hook calls (max 3) so rules-of-hooks hold while the parent owns all the data.
  const d0 = useCityDossier(cities[0]?.cityId ?? null);
  const d1 = useCityDossier(cities[1]?.cityId ?? null);
  const d2 = useCityDossier(cities[2]?.cityId ?? null);
  const dossiers = useMemo(() => [d0, d1, d2], [d0, d1, d2]);

  const results = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(cities.map((c) => c.cityId));
    return index
      .filter(
        (c) =>
          !taken.has(c.cityId) &&
          (c.name.toLowerCase().includes(q) ||
            c.countryIso3.toLowerCase().includes(q) ||
            (c.admin1Name?.toLowerCase().includes(q) ?? false)),
      )
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
      .slice(0, 8);
  }, [index, query, cities]);

  function addCity(c: CitySearchIndexEntry) {
    setCities((prev) => (prev.length < MAX && !prev.some((x) => x.cityId === c.cityId) ? [...prev, c] : prev));
    setQuery("");
  }
  function removeCity(id: string) {
    setCities((prev) => prev.filter((x) => x.cityId !== id));
  }

  // Per-entity-type counts across the selected cities (the differential strip).
  const typeRows = useMemo(() => {
    const types = new Set<string>();
    cities.forEach((_, i) => dossiers[i].entities.forEach((e) => types.add(e.entityType)));
    return [...types]
      .map((type) => ({
        type,
        counts: cities.map((_, i) => dossiers[i].entities.filter((e) => e.entityType === type).length),
      }))
      .sort((a, b) => b.counts.reduce((s, x) => s + x, 0) - a.counts.reduce((s, x) => s + x, 0));
  }, [cities, dossiers]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur">
        <Link href="/osint" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
          {"<- OSINT"}
        </Link>
        <span className="text-sm text-slate-600">/</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Crosshair aria-hidden className="size-4 text-cyan-300" />
          Compare
        </span>
      </nav>
      <h1 className="sr-only">OSINT city comparison</h1>

      <div className="mx-auto w-full max-w-6xl space-y-5 p-5 sm:p-8">
        {/* Add-city picker */}
        {cities.length < MAX ? (
          <div className="relative max-w-md">
            <Plus aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Add a city to compare (${cities.length}/${MAX})…`}
              aria-label="Add a city to compare"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/30"
            />
            {results.length > 0 ? (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
                {results.map((c) => (
                  <li key={c.cityId}>
                    <button
                      type="button"
                      onClick={() => addCity(c)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {[c.admin1Name, c.countryIso3].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {cities.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
            Add up to {MAX} cities to compare their source-backed coverage and entity profiles.
          </div>
        ) : (
          <>
            {/* Per-city columns */}
            <div
              className={`grid grid-cols-1 gap-4 ${cities.length >= 3 ? "xl:grid-cols-3" : "md:grid-cols-2"}`}
            >
              {cities.map((c, i) => {
                const d = dossiers[i];
                const cov = d.coverage;
                return (
                  <div key={c.cityId} className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] p-4">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-white">{c.name}</div>
                        <div className="truncate text-xs text-slate-500">
                          {[c.admin1Name, c.countryIso3].filter(Boolean).join(" · ")} · {fmtPop(c.population)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCity(c.cityId)}
                        aria-label={`Remove ${c.name}`}
                        className="shrink-0 rounded-md border border-white/10 p-1 text-slate-500 transition-colors hover:text-white"
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    </div>

                    {d.loading ? (
                      <p className="py-4 text-sm text-slate-500">Loading dossier…</p>
                    ) : d.hasDossier === false ? (
                      <p className="py-4 text-sm text-amber-200/80">Identity-only — no source-backed dossier yet.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-emerald-200">
                            {cov?.mappedCategoryCount ?? 0} covered
                          </span>
                          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-amber-200">
                            {cov?.documentedCategoryCount ?? 0} partial
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-400">
                            {cov?.missingCategoryCount ?? 0} gaps
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-cyan-50">
                            {d.entities.length.toLocaleString("en-US")} entities
                          </span>
                        </div>
                        {(() => {
                          const m = enrichment[c.cityId];
                          if (!m || (m.fixedMbps == null && m.mobileMbps == null && m.pm25 == null)) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                              {m.fixedMbps != null ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Fixed {Math.round(m.fixedMbps)} Mbps</span>
                              ) : null}
                              {m.mobileMbps != null ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Mobile {Math.round(m.mobileMbps)} Mbps</span>
                              ) : null}
                              {m.pm25 != null ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">PM2.5 {m.pm25} µg/m³</span>
                              ) : null}
                            </div>
                          );
                        })()}
                        <div className="flex flex-wrap gap-2 pt-1 text-xs">
                          <Link href={`/city/${c.slug}`} className="text-cyan-300 hover:text-cyan-200">
                            Full dossier
                          </Link>
                          <Link href="/osint" className="text-slate-400 hover:text-slate-200">
                            Open in OSINT
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Entity-type differential */}
            {typeRows.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="border-b border-white/10 px-4 py-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entities by type</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-2 font-medium">Type</th>
                      {cities.map((c) => (
                        <th key={c.cityId} className="px-4 py-2 text-right font-medium">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {typeRows.map((row) => {
                      const max = Math.max(...row.counts);
                      return (
                        <tr key={row.type} className="border-t border-white/5">
                          <td className="px-4 py-2 text-slate-300">{entityLabel(row.type)}</td>
                          {row.counts.map((n, i) => (
                            <td
                              key={cities[i].cityId}
                              className={`px-4 py-2 text-right tabular-nums ${
                                n === max && max > 0 ? "font-semibold text-cyan-200" : "text-slate-400"
                              }`}
                            >
                              {n.toLocaleString("en-US")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Connectivity & environment differential (from the slim enrichment index) */}
            {cities.some((c) => enrichment[c.cityId]) ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="border-b border-white/10 px-4 py-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Connectivity &amp; environment</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-2 font-medium">Metric</th>
                      {cities.map((c) => (
                        <th key={c.cityId} className="px-4 py-2 text-right font-medium">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { key: "fixedMbps", label: "Fixed broadband (Mbps)", higherIsBetter: true, round: true },
                        { key: "mobileMbps", label: "Mobile broadband (Mbps)", higherIsBetter: true, round: true },
                        { key: "pm25", label: "PM2.5 (µg/m³ — lower better)", higherIsBetter: false, round: false },
                      ] as const
                    ).map((row) => {
                      const vals = cities.map((c) => enrichment[c.cityId]?.[row.key]);
                      const present = vals.filter((v): v is number => v != null);
                      if (present.length === 0) return null;
                      const best = row.higherIsBetter ? Math.max(...present) : Math.min(...present);
                      return (
                        <tr key={row.key} className="border-t border-white/5">
                          <td className="px-4 py-2 text-slate-300">{row.label}</td>
                          {vals.map((v, i) => (
                            <td
                              key={cities[i].cityId}
                              className={`px-4 py-2 text-right tabular-nums ${
                                v != null && v === best && present.length > 1 ? "font-semibold text-cyan-200" : "text-slate-400"
                              }`}
                            >
                              {v == null ? "—" : row.round ? Math.round(v).toLocaleString("en-US") : v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
