"use client";

import { useState } from "react";

import {
  getHighRiskCorridors,
  getTopCorridorsByVolume,
  logisticsHubs,
  tradeCorridors,
} from "@/data/mock/trade-corridors";
import { supplyChainLinks, type SupplyChainLink } from "@/data/mock/entity-network";

export function SupplyChainPanel() {
  const [selectedRisk, setSelectedRisk] = useState<"all" | "critical" | "high" | "medium" | "low">("all");

  const corridors = selectedRisk === "all"
    ? tradeCorridors
    : tradeCorridors.filter((c) => c.riskLevel === selectedRisk);

  const topCorridors = getTopCorridorsByVolume(5);
  const highRisk = getHighRiskCorridors();
  const vulnerabilities = supplyChainLinks.filter(
    (l) => !l.alternativeSources || l.alternativeSources.length === 0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">Active Corridors</p>
          <p className="mt-2 text-3xl font-bold text-white">{tradeCorridors.length}</p>
        </div>
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
          <p className="text-xs uppercase tracking-wider text-red-300">High/Critical Risk</p>
          <p className="mt-2 text-3xl font-bold text-red-200">{highRisk.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p className="text-xs uppercase tracking-wider text-amber-300">Single-Source Links</p>
          <p className="mt-2 text-3xl font-bold text-amber-200">{vulnerabilities.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Top Corridors by Trade Volume</h3>
        <div className="mt-4 space-y-3">
          {topCorridors.map((corridor) => (
            <div key={corridor.id} className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{corridor.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {corridor.originCity} → {corridor.destinationCity}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">
                  ${(corridor.annualVolumeUsd ?? 0 / 1e12).toFixed(1)}T/yr
                </span>
              </div>
              {corridor.chokepoints && corridor.chokepoints.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {corridor.chokepoints.map((cp) => (
                    <span key={cp} className="rounded-full bg-red-400/10 px-2 py-0.5 text-xs text-red-300">
                      {cp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Trade Corridors</h3>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value as typeof selectedRisk)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-xs text-white"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="mt-4 space-y-2">
          {corridors.map((corridor) => (
            <div key={corridor.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 px-4 py-3">
              <div>
                <p className="text-sm text-white">{corridor.name}</p>
                <p className="text-xs text-slate-400">
                  {corridor.primaryCommodities.slice(0, 3).join(", ")}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${
                corridor.riskLevel === "critical"
                  ? "bg-red-400/20 text-red-200"
                  : corridor.riskLevel === "high"
                    ? "bg-orange-400/20 text-orange-200"
                    : corridor.riskLevel === "medium"
                      ? "bg-yellow-400/20 text-yellow-200"
                      : "bg-green-400/20 text-green-200"
              }`}>
                {corridor.riskLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
        <h3 className="text-lg font-semibold text-red-200">Supply Chain Vulnerabilities</h3>
        <p className="mt-1 text-sm text-red-300/70">
          Links with no alternative sources (single points of failure)
        </p>
        <div className="mt-4 space-y-3">
          {vulnerabilities.map((link) => {
            const input = link.inputEntity.replace("ent-", "").replace(/-/g, " ");
            const output = link.outputEntity.replace("ent-", "").replace(/-/g, " ");
            return (
              <div key={link.id} className="rounded-xl border border-red-400/10 bg-red-900/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {input} → {output}
                  </p>
                  <span className="rounded-full bg-red-400/20 px-2 py-1 text-xs text-red-200">
                    {link.riskLevel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-red-300/70">
                  {link.commodity} • {link.route} • ${((link.volumeUsd ?? 0) / 1e9).toFixed(1)}B/yr
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Global Logistics Hubs</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logisticsHubs.slice(0, 12).map((hub) => (
            <div key={hub.id} className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
              <p className="text-sm font-medium text-white">{hub.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {hub.type} • {hub.countryIso3}
              </p>
              {hub.worldRanking && (
                <p className="mt-1 text-xs text-cyan-300">World ranking: #{hub.worldRanking}</p>
              )}
              {hub.throughput && (
                <p className="mt-1 text-xs text-slate-500">
                  {hub.throughput.toLocaleString()} {hub.throughputUnit}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
