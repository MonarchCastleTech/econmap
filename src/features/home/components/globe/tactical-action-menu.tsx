export type GlobeSelectedPointInfo = {
  activeLayerIds: string[];
  latitude: number;
  longitude: number;
  nearestPlaceName?: string;
  timestamp: string;
};

type TacticalActionMenuProps = {
  isOpen: boolean;
  selectedPoint: GlobeSelectedPointInfo | null;
};

const ACTION_LABELS = ["Drop marker", "Create waypoint", "Region select"] as const;

export function TacticalActionMenu({ isOpen, selectedPoint }: TacticalActionMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="tactical-panel border-slate-700/80 p-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#a2b27d]">Tactical actions</p>
      <p className="mt-2 text-sm text-slate-300">
        {selectedPoint
          ? `Point locked at ${selectedPoint.latitude.toFixed(2)}, ${selectedPoint.longitude.toFixed(2)}.`
          : "Right-click actions become location-aware after a point is selected."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTION_LABELS.map((actionLabel) => (
          <span key={actionLabel} className="tactical-chip px-3 py-2 text-[11px]">
            {actionLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
