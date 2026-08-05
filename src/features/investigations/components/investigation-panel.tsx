"use client";

import { useState } from "react";

import {
  countryTimelineEvents,
  getActiveInvestigations,
  getHighConfidencePatterns,
  investigations,
  patternAlerts,
} from "@/data/mock/osint-timeline";

export function InvestigationPanel() {
  const [selectedTab, setSelectedTab] = useState<"investigations" | "timeline" | "patterns">("investigations");
  const [selectedInvestigation, setSelectedInvestigation] = useState<string | null>(null);

  const activeInvestigations = getActiveInvestigations();
  const highConfidencePatterns = getHighConfidencePatterns(0.8);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["investigations", "timeline", "patterns"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === tab
                ? "bg-cyan-400/20 text-cyan-200"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {selectedTab === "investigations" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Total Investigations</p>
              <p className="mt-2 text-3xl font-bold text-white">{investigations.length}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <p className="text-xs uppercase tracking-wider text-cyan-300">Active</p>
              <p className="mt-2 text-3xl font-bold text-cyan-200">{activeInvestigations.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-wider text-amber-300">Pattern Alerts</p>
              <p className="mt-2 text-3xl font-bold text-amber-200">{patternAlerts.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvestigation(inv.id === selectedInvestigation ? null : inv.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedInvestigation === inv.id
                    ? "border-cyan-400/30 bg-cyan-400/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{inv.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{inv.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      inv.priority === "critical"
                        ? "bg-red-400/20 text-red-200"
                        : inv.priority === "high"
                          ? "bg-orange-400/20 text-orange-200"
                          : "bg-slate-400/20 text-slate-200"
                    }`}>
                      {inv.priority}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {inv.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
                {selectedInvestigation === inv.id && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">Findings</p>
                      <ul className="mt-2 space-y-1">
                        {inv.findings.map((finding, i) => (
                          <li key={i} className="text-sm text-slate-300">• {finding}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">Subjects</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {inv.subjects.map((s) => (
                          <span key={s} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTab === "timeline" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Historical events, crises, and policy shifts shaping the current economic landscape.
          </p>
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-2 top-0 h-full w-px bg-white/10" />
            {countryTimelineEvents
              .sort((a, b) => b.year - a.year)
              .map((event) => (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-6 top-2 h-3 w-3 rounded-full border-2 ${
                    event.impact === "critical"
                      ? "border-red-400 bg-red-400"
                      : event.impact === "high"
                        ? "border-orange-400 bg-orange-400"
                        : "border-slate-400 bg-slate-400"
                  }`} />
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-500">{event.year}{event.month ? `-${event.month.toString().padStart(2, "0")}` : ""}</p>
                        <p className="mt-1 text-sm font-medium text-white">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{event.summary}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        event.kind === "crisis" ? "bg-red-400/20 text-red-200"
                          : event.kind === "sanctions" ? "bg-orange-400/20 text-orange-200"
                          : event.kind === "devaluation" ? "bg-yellow-400/20 text-yellow-200"
                          : "bg-slate-400/20 text-slate-200"
                      }`}>
                        {event.kind}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {selectedTab === "patterns" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            AI-detected patterns and anomalies across economic, trade, and geopolitical data.
          </p>
          <div className="space-y-3">
            {patternAlerts.map((pattern) => (
              <div key={pattern.id} className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-200">{pattern.pattern}</p>
                    <p className="mt-1 text-xs text-slate-400">{pattern.description}</p>
                  </div>
                  <span className="rounded-full bg-amber-400/20 px-2 py-1 text-xs text-amber-200">
                    {(pattern.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {pattern.entities.map((e) => (
                    <span key={e} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-300/70">
                  <strong>Action:</strong> {pattern.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
