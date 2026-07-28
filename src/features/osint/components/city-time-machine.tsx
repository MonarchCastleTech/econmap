"use client";

import { useState } from "react";
import { Activity, Building2, Clock3, TriangleAlert } from "lucide-react";

import type { CityIntelligenceBundle } from "@/domain/city-intelligence-schemas";

type Tab = "history" | "geography" | "hazards";

const TAB_LABELS: Record<Tab, string> = {
  history: "History",
  geography: "Geography",
  hazards: "Hazards",
};

const SOURCE_LABELS: Record<string, string> = {
  "usgs-earthquakes": "USGS earthquakes",
  "nasa-firms": "NASA FIRMS",
  "ghsl-urban-centres": "GHSL urban centres",
  "ookla-open-data": "Ookla",
  "mlab-ndt": "M-Lab",
  "ripe-atlas": "RIPE Atlas",
  "fcc-bdc": "FCC BDC",
  "gsma-coverage": "GSMA",
  openaq: "OpenAQ",
};

function sourceLabel(sourceId: string): string {
  return SOURCE_LABELS[sourceId] ?? sourceId;
}

function readableDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function CityTimeMachine({
  intelligence,
}: {
  intelligence: CityIntelligenceBundle;
}) {
  const [tab, setTab] = useState<Tab>("history");

  return (
    <section
      aria-labelledby="city-time-machine-heading"
      className="rounded-lg border border-white/10 bg-slate-950/70"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="city-time-machine-heading" className="text-sm font-semibold text-white">
            City time machine
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Snapshot {readableDate(intelligence.generatedAt)}
          </p>
        </div>
        <div
          className="grid grid-cols-3 rounded border border-white/10 bg-black/20 p-0.5"
          aria-label="Time machine view"
        >
          {(["history", "geography", "hazards"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`min-w-20 rounded px-3 py-1.5 text-xs transition-colors ${
                tab === value
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {TAB_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === "history" ? <HistoryView intelligence={intelligence} /> : null}
        {tab === "geography" ? <GeographyView intelligence={intelligence} /> : null}
        {tab === "hazards" ? <HazardsView intelligence={intelligence} /> : null}
      </div>
    </section>
  );
}

function HistoryView({
  intelligence,
}: {
  intelligence: CityIntelligenceBundle;
}) {
  if (intelligence.deltas.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No recorded changes yet. The next source snapshot will be compared with this baseline.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {intelligence.deltas.slice(0, 12).map((delta) => (
        <li key={delta.id} className="grid grid-cols-[20px_1fr] gap-3">
          <Clock3 aria-hidden className="mt-0.5 size-4 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">
              {delta.metric.replaceAll("-", " ")} {delta.kind}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              <span>{sourceLabel(delta.sourceId)}</span> /{" "}
              {readableDate(delta.detectedAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function GeographyView({
  intelligence,
}: {
  intelligence: CityIntelligenceBundle;
}) {
  const ghsl = intelligence.sourceStatuses.find(
    (source) => source.sourceId === "ghsl-urban-centres",
  );
  const hasUrbanCentre = intelligence.geographies.some(
    (geography) =>
      geography.kind === "urban_centre" && geography.state === "observed",
  );

  return (
    <div>
      {!hasUrbanCentre ? (
        <div className="flex items-start gap-3">
          <Building2 aria-hidden className="mt-0.5 size-4 text-amber-300" />
          <div>
            <p className="text-sm font-medium text-slate-200">
              Urban-centre boundary unavailable
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {ghsl?.detail ??
                "No harmonized urban-centre geometry is published for this city."}
            </p>
          </div>
        </div>
      ) : null}
      {intelligence.geographies.map((geography) => (
        <div key={geography.id} className="mt-4 border-t border-white/10 pt-4">
          <p className="text-sm text-white">{geography.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {geography.kind.replaceAll("_", " ")} / {sourceLabel(geography.sourceId)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {geography.methodology}
          </p>
        </div>
      ))}
    </div>
  );
}

function HazardsView({
  intelligence,
}: {
  intelligence: CityIntelligenceBundle;
}) {
  const hazards = intelligence.observations.filter(
    (observation) => observation.topic === "hazard",
  );

  if (hazards.length === 0 && intelligence.alerts.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No active source-backed operational hazard is matched to this city.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {intelligence.alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3">
          <TriangleAlert
            aria-hidden
            className={`mt-0.5 size-4 ${
              alert.severity === "critical" ? "text-rose-300" : "text-amber-300"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-slate-100">{alert.title}</p>
            <p className="mt-1 text-xs text-slate-500">{alert.summary}</p>
          </div>
        </div>
      ))}
      {hazards.map((hazard) => (
        <div key={hazard.id} className="border-t border-white/10 pt-4">
          <p className="flex items-center gap-2 text-sm text-slate-200">
            <Activity aria-hidden className="size-4 text-cyan-300" />
            {hazard.metric === "earthquake" && typeof hazard.value === "number"
              ? `Magnitude ${hazard.value.toLocaleString("en-US", { maximumFractionDigits: 1 })}`
              : hazard.metric.replaceAll("-", " ")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {sourceLabel(hazard.sourceId)} / {readableDate(hazard.observedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
