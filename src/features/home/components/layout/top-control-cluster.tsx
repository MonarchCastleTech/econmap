"use client";

import { Camera, Expand, ImageDown, Layers3, Settings2 } from "lucide-react";

import { useTacticalGlobeStore } from "@/store/tactical-globe-store";

const CONTROL_ITEMS = [
  { icon: Camera, label: "Reset camera" },
  { icon: Expand, label: "Toggle fullscreen" },
  { icon: Layers3, label: "Open layer legend" },
  { icon: Settings2, label: "Open settings" },
  { icon: ImageDown, label: "Export screenshot" },
] as const;

export function TopControlCluster() {
  const setLegendOpen = useTacticalGlobeStore((state) => state.setLegendOpen);
  const setSettingsOpen = useTacticalGlobeStore((state) => state.setSettingsOpen);

  async function handleAction(label: (typeof CONTROL_ITEMS)[number]["label"]) {
    if (label === "Reset camera") {
      window.dispatchEvent(new CustomEvent("mapfactbook:reset-camera"));
      return;
    }

    if (label === "Toggle fullscreen") {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        return;
      }

      await document.exitFullscreen?.();
      return;
    }

    if (label === "Open layer legend") {
      setLegendOpen(true);
      return;
    }

    if (label === "Open settings") {
      setSettingsOpen(true);
      return;
    }

    if (label === "Export screenshot") {
      const activeSurfaceCanvas = document.querySelector<HTMLCanvasElement>('[data-surface-export-root="true"] canvas');
      if (!activeSurfaceCanvas) {
        return;
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = activeSurfaceCanvas.toDataURL("image/png");
      downloadLink.download = "mapfactbook-tactical-surface.png";
      downloadLink.click();
      return;
    }
  }

  return (
    <div
      data-testid="tactical-control-cluster"
      data-geometry="hard-edge"
      data-density="compact"
      className="tactical-panel tactical-panel-strong flex items-center gap-1.5 p-1.5"
    >
      {CONTROL_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            aria-label={item.label}
            data-geometry="hard-edge"
            onClick={() => {
              void handleAction(item.label);
            }}
            className="tactical-control h-10 w-10 text-slate-200 hover:border-[#9cab7a]/45 hover:bg-[#23291f] hover:text-[#d7dfc1]"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
