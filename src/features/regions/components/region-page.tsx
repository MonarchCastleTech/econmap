import Link from "next/link";

import { MetricCard } from "@/components/data/metric-card";
import { PageFrame } from "@/components/layout/page-frame";
import { subnationalUnits } from "@/data/normalized/regions";
import { getCountryBySlug } from "@/lib/factbook";

export function RegionPage({ slug }: { slug: string }) {
  const region = subnationalUnits.find((entry) => entry.slug === slug);
  const country = region ? getCountryBySlug(region.countrySlug) : undefined;

  return (
    <PageFrame
      eyebrow="Region profile"
      title={region?.name ?? "Region unavailable"}
      description={
        region && country
          ? `${country.name} ADM1 drill-down with showcase GDP, labor, income, urbanization, and sector composition coverage.`
          : "Region coverage is currently limited to the showcase countries."
      }
    >
      {region && country ? (
        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
            <p className="text-sm text-slate-300">
              Part of <Link href={`/country/${country.slug}`} className="text-cyan-300">{country.name}</Link>
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Population" value={region.population} unit="people" status="actual" />
            <MetricCard label="GDP" value={region.gdpCurrentUsd} unit="usd" status="estimate" />
            <MetricCard label="Unemployment" value={region.unemployment} unit="percent" status="actual" />
            <MetricCard label="Median income" value={region.medianIncome} unit="usd" status="estimate" />
            <MetricCard label="Urbanization" value={region.urbanization} unit="percent" status="actual" />
            <MetricCard label="Infrastructure" value={region.infrastructureScore} unit="score" status="estimate" />
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
            <p className="text-sm font-medium text-white">Leading sectors</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {region.topSectors.map((sector) => (
                <div key={sector.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">{sector.name}</p>
                  <p className="mt-2">{sector.share}% share</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}
