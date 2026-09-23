import Link from "next/link";

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
          ? `${country.name} ADM1 location. Numeric indicators are withheld pending row-level source verification.`
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
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
            <p className="text-sm font-medium text-white">Numeric profile withheld</p>
            <p className="mt-3 text-sm text-slate-300">The previous population, output, labor, income, infrastructure, and sector values lack row-level source records and observation dates. They are unavailable pending verification.</p>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}
