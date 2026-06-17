import { PageFrame } from "@/components/layout/page-frame";
import { indicatorDefinitions } from "@/data/normalized/indicators";
import { getIndicatorCategories } from "@/lib/factbook";

export function IndicatorLibraryPage() {
  const categories = getIndicatorCategories();

  return (
    <PageFrame
      eyebrow="Indicator library"
      title="Analyst-ready indicator metadata"
      description="Browse definitions, units, source references, and coverage notes across the current economic intelligence model."
    >
      <div className="grid gap-6">
        {categories.map((category) => (
          <section key={category} className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
            <h2 className="text-xl font-semibold text-white">{category}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {indicatorDefinitions
                .filter((indicator) => indicator.category === category)
                .map((indicator) => (
                  <div key={indicator.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{indicator.name}</p>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {indicator.unit}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{indicator.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {indicator.sourceId} · latest {indicator.latestYear}
                    </p>
                    {indicator.coverageNote ? (
                      <p className="mt-2 text-sm text-amber-200/80">{indicator.coverageNote}</p>
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
