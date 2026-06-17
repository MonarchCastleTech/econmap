import type { GlobeLayerManifest } from "@/domain/types";

export type OperatorLayerGroup =
  | "Borders & Labels"
  | "Transport"
  | "Utilities"
  | "Connectivity"
  | "Environment"
  | "Economy / Institutions";

export type LayerRegistryEntry = {
  id: string;
  label: string;
  family: string;
  operatorGroup?: OperatorLayerGroup;
  purpose: string;
  sourceLabels: string[];
  tier: "boot" | "interactive" | "deep" | "city-focus";
  supportsCityFocus: boolean;
  supportsTime: boolean;
  assetPath: string;
  bootAssetPath?: string;
  // Vector source-layer name inside layers.pmtiles (= id). The 2D map renders this layer from the
  // shared pmtiles source; geojson region-sharding was retired in favour of vector tiles.
  sourceLayer: string;
  usesRegionShards: boolean;
  markerColor: string;
  markerSize: number;
  strokeColor: string;
};

const LAYER_STYLE_DEFAULTS: Record<
  string,
  Pick<
    LayerRegistryEntry,
    "markerColor" | "markerSize" | "operatorGroup" | "purpose" | "strokeColor"
  >
> = {
  airports: {
    markerColor: "#c9a867",
    markerSize: 18,
    operatorGroup: "Transport",
    purpose: "airports and aviation access",
    strokeColor: "#efe2a1",
  },
  cities: {
    markerColor: "#b7c3a2",
    markerSize: 12,
    operatorGroup: "Borders & Labels",
    purpose: "visible city boundaries and labels",
    strokeColor: "#dce6c9",
  },
  ports: {
    markerColor: "#7f95a3",
    markerSize: 16,
    operatorGroup: "Transport",
    purpose: "ports and maritime access",
    strokeColor: "#b9c6cf",
  },
  utilities: {
    markerColor: "#a66a43",
    markerSize: 14,
    operatorGroup: "Utilities",
    purpose: "power generation and critical utility sites",
    strokeColor: "#d79a70",
  },
  "connectivity-fixed": {
    markerColor: "#4b87b7",
    markerSize: 14,
    operatorGroup: "Connectivity",
    purpose: "city-level fixed broadband performance",
    strokeColor: "#94c9f0",
  },
  "connectivity-mobile": {
    markerColor: "#2d6f92",
    markerSize: 14,
    operatorGroup: "Connectivity",
    purpose: "city-level mobile broadband performance",
    strokeColor: "#8dd8ea",
  },
  "air-quality": {
    markerColor: "#4f8f62",
    markerSize: 14,
    operatorGroup: "Environment",
    purpose: "city PM2.5 observations and air quality signals",
    strokeColor: "#b7e1c3",
  },
  "water-stress": {
    markerColor: "#3d7f8e",
    markerSize: 14,
    operatorGroup: "Environment",
    purpose: "city water stress scores and hydrology risk",
    strokeColor: "#d79a70",
  },
  "rail-hubs": {
    markerColor: "#9a7b5a",
    markerSize: 14,
    operatorGroup: "Transport",
    purpose: "rail terminals and intermodal rail access",
    strokeColor: "#c8ad8c",
  },
  "logistics-hubs": {
    markerColor: "#8a7f6a",
    markerSize: 14,
    operatorGroup: "Transport",
    purpose: "freight, distribution, and logistics nodes",
    strokeColor: "#bdb39c",
  },
  "transit-feeds": {
    markerColor: "#6f7fa6",
    markerSize: 13,
    operatorGroup: "Transport",
    purpose: "public transit feed coverage (GTFS)",
    strokeColor: "#a9b7d8",
  },
  research: {
    markerColor: "#9a6a9a",
    markerSize: 13,
    operatorGroup: "Economy / Institutions",
    purpose: "universities and research anchors",
    strokeColor: "#cda3cd",
  },
};

export function resolveLayerRegistryEntry(layer: GlobeLayerManifest): LayerRegistryEntry {
  const styleDefaults = LAYER_STYLE_DEFAULTS[layer.id] ?? {
    markerColor: "#cbd5e1",
    markerSize: 14,
    operatorGroup: undefined,
    purpose: `${layer.label.toLowerCase()} overlay`,
    strokeColor: "#94a3b8",
  };

  return {
    id: layer.id,
    label: layer.label,
    family: layer.family,
    sourceLabels: layer.sourceLabels,
    tier: layer.tier,
    supportsCityFocus: layer.supportsCityFocus,
    supportsTime: layer.supportsTime,
    assetPath: layer.assetPath,
    bootAssetPath: layer.bootAssetPath,
    sourceLayer: layer.sourceLayer ?? layer.id,
    usesRegionShards: layer.assetPath.includes("{region}"),
    ...styleDefaults,
  };
}
