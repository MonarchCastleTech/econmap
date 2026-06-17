"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MetricLineChart({
  data,
  dataKey,
  label,
}: {
  data: Array<Record<string, number | string | null>>;
  dataKey: string;
  label: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="h-72 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <p className="mb-4 text-sm font-medium text-slate-200">{label}</p>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis dataKey="year" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.96)",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "18px",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#67e8f9"
              strokeWidth={3}
              dot={{ r: 3, fill: "#67e8f9" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] rounded-2xl border border-white/10 bg-white/[0.03]" />
      )}
    </div>
  );
}
