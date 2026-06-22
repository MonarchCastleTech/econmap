"use client";

/**
 * A controls-free maplibre point map of a city's EXACT-SITE entities. Follows the tactical-map
 * pattern: maplibre is lazy-imported inside the effect (kept out of the SSG bundle, no window
 * access at build), the style is inline (a background layer + one geojson circle layer) so NO
 * maplibre CSS import is needed, and there are no controls/popups (which would require the CSS).
 * Degrades honestly: no exact-site coordinates → an explicit empty card; no webgl (tests) → the
 * import is caught and skipped.
 */
import { useEffect, useMemo, useRef } from "react";

import { entityColor, entityLabel } from "@/features/osint/lib/entity-display";
import type { DossierEntity } from "@/features/osint/lib/use-city-dossier";

export function EntityMiniMap({ entities }: { entities: DossierEntity[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const points = useMemo(
    () =>
      entities
        .filter((e) => e.exactSite && e.latitude != null && e.longitude != null)
        .map((e) => ({
          lon: e.longitude as number,
          lat: e.latitude as number,
          color: entityColor(e.entityType),
          name: e.entityName,
          type: entityLabel(e.entityType),
        })),
    [entities],
  );

  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    let map: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !ref.current) return;
        const features = points.map((p) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
          properties: { color: p.color, name: p.name, type: p.type },
        }));
        const instance = new maplibregl.Map({
          container: ref.current,
          attributionControl: false,
          dragRotate: false,
          center: [points[0].lon, points[0].lat],
          zoom: 3,
          style: {
            version: 8,
            sources: {},
            layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b0f14" } }],
          },
        });
        map = instance;
        instance.on("load", () => {
          instance.addSource("entities", {
            type: "geojson",
            data: { type: "FeatureCollection", features },
          });
          instance.addLayer({
            id: "entity-points",
            type: "circle",
            source: "entities",
            paint: {
              "circle-radius": 5,
              "circle-color": ["get", "color"],
              "circle-stroke-width": 1,
              "circle-stroke-color": "#0b0f14",
              "circle-opacity": 0.9,
            },
          });
          if (points.length > 1) {
            const lons = points.map((p) => p.lon);
            const lats = points.map((p) => p.lat);
            instance.fitBounds(
              [
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)],
              ],
              { padding: 36, maxZoom: 9, duration: 0 },
            );
          }
        });
      } catch {
        // maplibre/webgl unavailable (SSR, jsdom tests) — skip the map; the rest of the brief stands.
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-500">
        No exact-site coordinates for this city&rsquo;s entities yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entity map</h3>
        <span className="text-[11px] text-slate-500">{points.length} exact-site</span>
      </div>
      <div ref={ref} className="h-64 w-full bg-[#0b0f14]" aria-label="Map of this city's exact-site entities" />
    </div>
  );
}
