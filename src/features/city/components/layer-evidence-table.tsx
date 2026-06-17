import type { SourceMeta } from "@/domain/types";

import { SourceBadge } from "./source-badge";

export type LayerEvidenceRow = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  sources: SourceMeta[];
  sourceLabels?: string[];
};

// Confidence/coverage tier derived from the strongest coverageState across a row's sources, so the
// dossier honestly distinguishes exact-site evidence from city-presence (nearby) attribution.
const COVERAGE_TIERS: Record<string, { label: string; className: string }> = {
  verified_exact: { label: "Exact site", className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" },
  verified_city_presence: { label: "City presence", className: "border-sky-300/30 bg-sky-300/10 text-sky-100" },
  partial_coverage: { label: "Partial", className: "border-amber-300/30 bg-amber-300/10 text-amber-100" },
  not_covered_yet: { label: "Not covered", className: "border-white/15 bg-white/5 text-slate-400" },
  not_applicable: { label: "N/A", className: "border-white/15 bg-white/5 text-slate-400" },
};
const TIER_RANK = [
  "verified_exact",
  "verified_city_presence",
  "partial_coverage",
  "not_covered_yet",
  "not_applicable",
];

function coverageTierForRow(sources: SourceMeta[]) {
  let best: string | undefined;
  let bestRank = Infinity;
  for (const source of sources) {
    const state = source.coverageState;
    if (!state) continue;
    const rank = TIER_RANK.indexOf(state);
    if (rank >= 0 && rank < bestRank) {
      bestRank = rank;
      best = state;
    }
  }
  return best ? COVERAGE_TIERS[best] : undefined;
}

type LayerEvidenceTableProps = {
  rows: LayerEvidenceRow[];
  emptyMessage?: string;
};

export function LayerEvidenceTable({
  rows,
  emptyMessage = "No source-backed evidence is published for this section yet.",
}: LayerEvidenceTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
      <div className="hidden bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(11rem,0.8fr)_minmax(0,1.3fr)] md:gap-4">
        <span>Evidence</span>
        <span>Value</span>
        <span>Sources</span>
      </div>
      <div className="divide-y divide-white/10">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(11rem,0.8fr)_minmax(0,1.3fr)] md:gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-white">{row.label}</p>
              {row.detail ? (
                <p className="mt-1 text-xs leading-5 text-slate-400">{row.detail}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-200">{row.value}</span>
              {(() => {
                const tier = coverageTierForRow(row.sources);
                return tier ? (
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${tier.className}`}
                  >
                    {tier.label}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="flex flex-wrap gap-2">
              {row.sources.length > 0 ? (
                row.sources.map((source) => <SourceBadge key={`${row.id}:${source.id}`} source={source} compact />)
              ) : row.sourceLabels?.length ? (
                row.sourceLabels.map((label) => (
                  <span
                    key={`${row.id}:${label}`}
                    className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[11px] font-medium text-amber-100"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No linked source label</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
