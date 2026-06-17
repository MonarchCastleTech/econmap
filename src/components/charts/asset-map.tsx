"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AssetRecord } from "@/domain/types";

export function AssetMap({ assets, center }: { assets: AssetRecord[], center: [number, number] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
          }
        ]
      },
      center: center,
      zoom: 4,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: assets.map(asset => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [asset.longitude, asset.latitude]
          },
          properties: {
            name: asset.name,
            category: asset.category,
            subtype: asset.subtype,
            priority: asset.priority
          }
        }))
      };

      map.current.addSource('assets', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'assets-layer',
        type: 'circle',
        source: 'assets',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'priority'],
            'critical', 8,
            'high', 6,
            4
          ],
          'circle-color': [
            'match',
            ['get', 'category'],
            'transport', '#3b82f6',
            'energy', '#eab308',
            'water', '#06b6d4',
            'public_services', '#8b5cf6',
            'telecom', '#ec4899',
            'industrial', '#f97316',
            '#ffffff'
          ],
          'circle-stroke-width': [
            'match',
            ['get', 'priority'],
            'critical', 3,
            1
          ],
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add popups
      map.current.on('click', 'assets-layer', (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const { name, subtype, priority, category } = feature.properties as any;

        // Generate mock dependencies based on priority to simulate the Blast Radius graph
        let blastRadius = "10km";
        let deps = 1;
        if (priority === 'critical') { blastRadius = "500km"; deps = Math.floor(Math.random() * 5) + 5; }
        else if (priority === 'high') { blastRadius = "100km"; deps = Math.floor(Math.random() * 3) + 2; }
        else if (priority === 'medium') { blastRadius = "50km"; deps = Math.floor(Math.random() * 2) + 1; }

        const html = `
          <div style="font-family: inherit; color: #333; min-width: 200px;">
            <strong style="font-size: 14px;">${name}</strong>
            <p style="margin: 4px 0; font-size: 12px; color: #666; text-transform: uppercase;">
              ${category} • ${subtype}
            </p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <div style="font-size: 11px; font-weight: bold; color: #999; margin-bottom: 4px;">DEPENDENCY GRAPH</div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span>Priority:</span> <span style="font-weight: 500;">${priority.toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span>Blast Radius:</span> <span style="font-weight: 500;">${blastRadius}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Linked Nodes:</span> <span style="font-weight: 500;">${deps} dependent entities</span>
              </div>
            </div>
          </div>
        `;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(html)
          .addTo(map.current!);
      });

      map.current.on('mouseenter', 'assets-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'assets-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [assets, center]);

  return <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden border border-white/10" />;
}
