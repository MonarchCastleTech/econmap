import { StatusBadge } from "@/components/data/status-badge";
import { formatCompactNumber, formatCurrency, formatNumber, formatPercent } from "@/lib/format";

function formatMetric(value: number | null, unit: string) {
  if (unit === "usd") return formatCurrency(value, "USD", { compact: true });
  if (unit === "people") return formatCompactNumber(value);
  if (unit === "percent") return formatPercent(value);
  if (unit === "index" || unit === "score" || unit === "years") return formatNumber(value, 1);
  if (unit === "tons_co2e") return formatNumber(value, 1);
  if (unit === "births_per_woman") return formatNumber(value, 2);
  return formatNumber(value, 1);
}

export function MetricCard({
  label,
  value,
  unit,
  status,
  accent,
}: {
  label: string;
  value: number | null;
  unit: string;
  status: "actual" | "estimate" | "forecast";
  accent?: string;
}) {
  return (
    <div className="group rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] transition-colors hover:border-white/20 [border-left:2px_solid_color-mix(in_srgb,var(--signal)_42%,transparent)]">
      <div className="flex items-center justify-between gap-3">
        <p className="metric-label text-slate-400">{label}</p>
        <StatusBadge status={status} />
      </div>
      <p className="metric-value mt-3 text-2xl text-white">{formatMetric(value, unit)}</p>
      {accent ? <p className="mt-2 text-sm text-slate-400">{accent}</p> : null}
    </div>
  );
}
