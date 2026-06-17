"use client";

import { useSyncExternalStore } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function RadarCompareChart({
  data,
}: {
  data: Array<Record<string, number | string>>;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const seriesKeys = Object.keys(data[0] ?? {}).filter((key) => key !== "metric");

  return (
    <div className="h-80 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <p className="mb-4 text-sm font-medium text-slate-200">Normalized profile</p>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(148,163,184,0.18)" />
            <PolarAngleAxis dataKey="metric" stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.96)",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "18px",
              }}
            />
            {seriesKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={["#67e8f9", "#22c55e", "#f59e0b", "#a855f7"][index % 4]}
                fill={["#67e8f9", "#22c55e", "#f59e0b", "#a855f7"][index % 4]}
                fillOpacity={0.18}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] rounded-2xl border border-white/10 bg-white/[0.03]" />
      )}
    </div>
  );
}
