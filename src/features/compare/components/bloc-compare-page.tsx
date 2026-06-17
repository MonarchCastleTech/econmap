"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { fetchAssetManifest } from "@/lib/asset-client";
import { CountryAssetAggregation } from "@/domain/types";
import { blocs } from "@/data/normalized/blocs";
import { countries } from "@/data/normalized/countries";
import { MetricCard } from "@/components/data/metric-card";
import { LoadingState } from "@/components/states/loading-state";

export function BlocComparePage() {
  const [manifest, setManifest] = useState<Record<string, CountryAssetAggregation> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssetManifest().then((data) => {
      setManifest(data);
      setLoading(false);
    });
  }, []);

  if (loading || !manifest) return <LoadingState label="Aggregating geopolitical blocs..." />;

  // Pre-compute lookup
  const isoToSlug = new Map<string, string>();
  countries.forEach(c => isoToSlug.set(c.slug, c.iso3));

  // Compute stats per bloc
  const blocStats = blocs.map((bloc) => {
    let totalAssets = 0;
    let energyCount = 0;
    let transportCount = 0;
    let publicServicesCount = 0;
    let industrialCount = 0;
    let telecomCount = 0;
    let membersWithData = 0;

    bloc.memberSlugs.forEach((slug) => {
      const iso3 = isoToSlug.get(slug)?.toUpperCase();
      if (iso3 && manifest[iso3]) {
        const aggr = manifest[iso3];
        totalAssets += aggr.totalAssets;
        energyCount += aggr.categoryCounts.energy || 0;
        transportCount += aggr.categoryCounts.transport || 0;
        publicServicesCount += aggr.categoryCounts.public_services || 0;
        industrialCount += aggr.categoryCounts.industrial || 0;
        telecomCount += aggr.categoryCounts.telecom || 0;
        membersWithData++;
      }
    });

    return {
      ...bloc,
      totalAssets,
      energyCount,
      transportCount,
      publicServicesCount,
      industrialCount,
      telecomCount,
      membersWithData,
    };
  }).sort((a, b) => b.totalAssets - a.totalAssets);

  return (
    <PageFrame
      eyebrow="Compare"
      title="Geopolitical Bloc Asset Comparison"
      description="Compare total indexed infrastructure capacity across major strategic and economic alliances."
    >
      <div className="grid gap-6">
        {blocStats.map((bloc) => (
          <section key={bloc.id} className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{bloc.name} ({bloc.shortName})</h2>
                <p className="mt-1 text-sm text-slate-400">{bloc.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-300">{bloc.totalAssets.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-widest text-slate-500">Total Indexed Assets</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Energy" value={bloc.energyCount} unit="sites" status="actual" />
              <MetricCard label="Transport & Logistics" value={bloc.transportCount} unit="sites" status="actual" />
              <MetricCard label="R&D / Gov" value={bloc.publicServicesCount} unit="sites" status="actual" />
              <MetricCard label="Industrial" value={bloc.industrialCount} unit="sites" status="actual" />
              <MetricCard label="Telecom" value={bloc.telecomCount} unit="sites" status="actual" />
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Members ({bloc.membersWithData} / {bloc.memberSlugs.length} Indexed)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bloc.memberSlugs.map(slug => {
                  const country = countries.find(c => c.slug === slug);
                  return (
                    <Link
                      key={slug}
                      href={`/country/${slug}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition"
                    >
                      {country?.flag} {country?.name || slug}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
