import { describe, expect, it } from "vitest";

import { resolveLayerRegistryEntry } from "./layer-registry";
import type { GlobeLayerManifest } from "@/domain/types";

function manifestLayer(id: string, label: string): GlobeLayerManifest {
  return {
    id,
    label,
    family: "Transport",
    sourceLabels: ["UN/LOCODE", "World Port Index"],
    tier: "interactive",
    supportsTime: false,
    supportsCityFocus: true,
    assetPath: `/data/globe/layers/${id}/vectors/current.geojson`,
  } as GlobeLayerManifest;
}

describe("resolveLayerRegistryEntry (layer styling registry)", () => {
  it("maps the real ports layer to its dedicated transport style + markerSize the renderer consumes", () => {
    const entry = resolveLayerRegistryEntry(manifestLayer("ports", "Ports"));
    expect(entry.markerColor).toBe("#7f95a3");
    expect(entry.strokeColor).toBe("#b9c6cf");
    expect(entry.markerSize).toBe(16);
    expect(entry.operatorGroup).toBe("Transport");
    // Identity fields pass through from the manifest, source labels preserved.
    expect(entry.id).toBe("ports");
    expect(entry.sourceLabels).toEqual(["UN/LOCODE", "World Port Index"]);
  });

  it("falls back to the neutral default style for an unknown layer id", () => {
    const entry = resolveLayerRegistryEntry(manifestLayer("totally-unknown-layer", "Mystery"));
    expect(entry.markerColor).toBe("#cbd5e1");
    expect(entry.strokeColor).toBe("#94a3b8");
    expect(entry.markerSize).toBe(14);
    expect(entry.operatorGroup).toBeUndefined();
  });

  it("derives the pmtiles source-layer from the manifest id (falls back to id when absent)", () => {
    expect(resolveLayerRegistryEntry(manifestLayer("ports", "Ports")).sourceLayer).toBe("ports");
  });
});
