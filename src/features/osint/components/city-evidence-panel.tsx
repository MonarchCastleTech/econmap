import { RadioTower, ShieldCheck, Signal, Wifi } from "lucide-react";

import type { CityIntelligenceBundle } from "@/domain/city-intelligence-schemas";

const TIER_COPY: Record<
  CityIntelligenceBundle["telecomEvidence"],
  { label: string; detail: string; tone: string }
> = {
  regulator_confirmed: {
    label: "Regulator-confirmed 5G",
    detail: "Technology-specific coverage is present in a regulator-published source.",
    tone: "text-emerald-300",
  },
  operator_claimed: {
    label: "Operator-reported 5G",
    detail: "Technology-specific coverage is reported by an operator source.",
    tone: "text-cyan-300",
  },
  measured_performance: {
    label: "Measured performance only",
    detail: "Mobile performance is measured, but it does not establish 5G coverage.",
    tone: "text-amber-300",
  },
  unknown: {
    label: "5G evidence unknown",
    detail: "No technology-specific regulator or operator observation is published.",
    tone: "text-slate-300",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  "ookla-open-data": "Ookla",
  "mlab-ndt": "M-Lab",
  "ripe-atlas": "RIPE Atlas",
  "fcc-bdc": "FCC BDC",
  "gsma-coverage": "GSMA",
};

function formatMetric(value: unknown, unit?: string): string {
  if (typeof value === "number") {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ""}`;
  }
  if (typeof value === "boolean") return value ? "Observed" : "Not observed";
  return value === null || value === undefined ? "Unknown" : `${value}${unit ? ` ${unit}` : ""}`;
}

export function CityEvidencePanel({
  intelligence,
}: {
  intelligence: CityIntelligenceBundle;
}) {
  const tier = TIER_COPY[intelligence.telecomEvidence];
  const network = intelligence.observations
    .filter(
      (observation) =>
        observation.topic === "connectivity" ||
        observation.topic === "network_quality",
    )
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, 6);
  const networkSources = intelligence.sourceStatuses.filter((source) =>
    Object.hasOwn(SOURCE_LABELS, source.sourceId),
  );

  return (
    <section
      aria-labelledby="city-evidence-heading"
      className="rounded-lg border border-white/10 bg-slate-950/70 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="city-evidence-heading" className="text-sm font-semibold text-white">
            Telecom and network evidence
          </h3>
          <p className={`mt-2 flex items-center gap-2 text-sm font-medium ${tier.tone}`}>
            <ShieldCheck aria-hidden className="size-4" />
            {tier.label}
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{tier.detail}</p>
        </div>
        <RadioTower aria-hidden className="size-5 shrink-0 text-slate-500" />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Wifi aria-hidden className="size-4" />
          Measured network observations
        </div>
        {network.length > 0 ? (
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {network.map((observation) => (
              <div key={observation.id} className="min-w-0">
                <dt className="truncate text-xs text-slate-500">
                  {observation.metric.replaceAll("-", " ")}
                </dt>
                <dd className="mt-0.5 flex items-center gap-2 text-sm text-white">
                  <Signal aria-hidden className="size-3.5 text-cyan-300" />
                  {formatMetric(observation.value, observation.unit)}
                </dd>
                <p className="mt-0.5 text-xs text-slate-500">
                  {SOURCE_LABELS[observation.sourceId] ?? observation.sourceId}
                  {observation.sampleCount !== undefined
                    ? ` / ${observation.sampleCount.toLocaleString("en-US")} samples`
                    : ""}
                </p>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            No city-level measured network snapshot is currently published.
          </p>
        )}
      </div>

      {networkSources.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Network source status">
          {networkSources.map((source) => (
            <li
              key={source.sourceId}
              title={source.detail}
              className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400"
            >
              {SOURCE_LABELS[source.sourceId]}: {source.status.replaceAll("_", " ")}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
