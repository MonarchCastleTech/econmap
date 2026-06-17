"use client";

import Link from "next/link";

import { MetricCard } from "@/components/data/metric-card";
import { EmptyState } from "@/components/states/empty-state";
import { useWatchlistStore } from "@/store/watchlist-store";

type CountryOverview = {
  slug: string;
  name: string;
  flag: string;
  capital: string;
  region: string;
  creditRating: string;
  latestYear: number;
  metrics: Array<{
    label: string;
    value: number | null;
    unit: string;
    status: "actual" | "estimate" | "forecast";
  }>;
  highlights: string[];
};

export function CountryDrawer({
  overview,
}: {
  overview?: CountryOverview;
}) {
  const items = useWatchlistStore((state) => state.items);
  const toggle = useWatchlistStore((state) => state.toggle);

  if (!overview) {
    return (
      <EmptyState
        title="Country brief"
        description="Select a country on the map or from search to open the factbook drawer."
        className="h-full"
      />
    );
  }

  const watchlisted = items.includes(overview.slug);

  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Country brief</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {overview.flag} {overview.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {overview.capital} · {overview.region} · Credit {overview.creditRating}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggle(overview.slug)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
        >
          {watchlisted ? "Saved" : "Save"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {overview.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Analyst notes</p>
        {overview.highlights.map((highlight) => (
          <p key={highlight} className="text-sm leading-6 text-slate-300">
            {highlight}
          </p>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        <span>Loaded year: {overview.latestYear}</span>
        <Link className="font-medium text-cyan-300" href={`/country/${overview.slug}`}>
          Open factbook
        </Link>
      </div>
    </aside>
  );
}
