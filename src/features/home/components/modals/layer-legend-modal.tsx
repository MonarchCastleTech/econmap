"use client";

import type { BaseImageryCatalog, GlobeManifest } from "@/domain/types";
import { useTacticalGlobeStore } from "@/store/tactical-globe-store";

type LayerLegendModalProps = {
  baseImageryCatalog: BaseImageryCatalog;
  globeManifest: GlobeManifest;
};

export function LayerLegendModal({ baseImageryCatalog, globeManifest }: LayerLegendModalProps) {
  const isLegendOpen = useTacticalGlobeStore((state) => state.isLegendOpen);
  const setLegendOpen = useTacticalGlobeStore((state) => state.setLegendOpen);

  if (!isLegendOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
      <div className="tactical-modal-surface w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#a2b27d]">Legend</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Published imagery and overlay routing</h2>
          </div>
          <button
            type="button"
            onClick={() => setLegendOpen(false)}
            className="tactical-chip px-3 py-2 text-[11px]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Base imagery families</p>
            {baseImageryCatalog.layers.map((layer) => (
              <div key={layer.id} className="tactical-panel border-slate-800/80 p-4">
                <p className="text-sm font-medium text-white">{layer.label}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {layer.availableDates.length > 0
                    ? `${layer.availableDates.length} shipped date ${layer.availableDates.length === 1 ? "window" : "windows"}`
                    : "No local imagery pack published"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {layer.attribution.map((attribution) => (
                    <span key={`${layer.id}-${attribution}`} className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
                      {attribution}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Operational overlays</p>
            {globeManifest.layers.map((layer) => (
              <div key={layer.id} className="tactical-panel border-slate-800/80 p-4">
                <p className="text-sm font-medium text-white">{layer.label}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {layer.family} / {layer.tier}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {layer.sourceLabels.map((sourceLabel) => (
                    <span key={`${layer.id}-${sourceLabel}`} className="tactical-chip tactical-chip-active px-2 py-1 text-[10px]">
                      {sourceLabel}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
