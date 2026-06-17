"use client";

import { useEffect } from "react";

import { useTacticalGlobeStore } from "@/store/tactical-globe-store";

const SHORTCUTS = [
  { combo: "?", description: "Open keyboard shortcuts" },
  { combo: "Esc", description: "Close active modal" },
  { combo: "Right click", description: "Open tactical action menu" },
  { combo: "Double click", description: "Zoom the map" },
] as const;

export function KeyboardShortcutsModal() {
  const isShortcutsOpen = useTacticalGlobeStore((state) => state.isShortcutsOpen);
  const setShortcutsOpen = useTacticalGlobeStore((state) => state.setShortcutsOpen);
  const setLegendOpen = useTacticalGlobeStore((state) => state.setLegendOpen);
  const setSettingsOpen = useTacticalGlobeStore((state) => state.setSettingsOpen);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setShortcutsOpen(true);
      }

      if (event.key === "Escape") {
        setShortcutsOpen(false);
        setLegendOpen(false);
        setSettingsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setLegendOpen, setSettingsOpen, setShortcutsOpen]);

  if (!isShortcutsOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
      <div className="tactical-modal-surface w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#a2b27d]">Shortcuts</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Keyboard helper</h2>
          </div>
          <button
            type="button"
            onClick={() => setShortcutsOpen(false)}
            className="tactical-chip px-3 py-2 text-[11px]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.combo} className="tactical-panel flex items-center justify-between border-slate-800/80 px-4 py-3">
              <span className="tactical-chip tactical-chip-active px-3 py-1 text-[11px]">
                {shortcut.combo}
              </span>
              <span className="text-sm text-slate-300">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
