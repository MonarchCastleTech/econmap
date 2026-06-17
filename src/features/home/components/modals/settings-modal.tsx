"use client";

import { useTacticalGlobeStore } from "@/store/tactical-globe-store";

export function SettingsModal() {
  const isSettingsOpen = useTacticalGlobeStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useTacticalGlobeStore((state) => state.setSettingsOpen);

  if (!isSettingsOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
      <div className="tactical-modal-surface w-full max-w-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#a2b27d]">Settings</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Tactical surface preferences</h2>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="tactical-chip px-3 py-2 text-[11px]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="tactical-panel border-slate-800/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Base imagery mode</p>
            <p className="mt-2 text-sm text-white">Offline published packs only</p>
          </div>
          <div className="tactical-panel border-slate-800/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Network policy</p>
            <p className="mt-2 text-sm text-white">No runtime third-party map APIs</p>
          </div>
          <div className="tactical-panel border-slate-800/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Selection mode</p>
            <p className="mt-2 text-sm text-white">Coordinate picking with source-backed overlays only</p>
          </div>
          <div className="tactical-panel border-slate-800/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Delivery model</p>
            <p className="mt-2 text-sm text-white">Static-site export with shipped assets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
