import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { subnationalUnits } from "@/data/normalized/regions";
import { getCountryBySlug } from "@/lib/factbook";

export const metadata = {
  title: "Regions — EconMap",
  description: "Subnational names are retained while numeric profiles are withheld for source review.",
};

export default function RegionsPage() {
  return (
    <PageFrame
      eyebrow="Regional intelligence"
      title="Subnational profiles"
      description="The former ADM1 numeric profiles lack row-level source records and dates. Values are withheld until a verifiable regional data feed is available."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subnationalUnits.map((region) => {
          const country = getCountryBySlug(region.countrySlug);

          return (
            <Link
              key={region.slug}
              href={`/regions/${region.slug}`}
              prefetch={false}
              className="rounded-2xl border border-white/10 bg-slate-950/75 p-5 transition hover:border-cyan-300/40 hover:bg-white/[0.04]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                {country?.name ?? region.countrySlug}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">{region.name}</h2>
              <p className="mt-3 text-sm text-slate-400">Numeric profile withheld pending source verification.</p>
            </Link>
          );
        })}
      </div>
    </PageFrame>
  );
}
