import type { BaseImageryCatalog, BaseImageryLayer, TacticalLayer } from "@/domain/types";

export function isTacticalLayerPublished(layer: TacticalLayer) {
  return layer.status === "published";
}

export function getPublishedTacticalLayers(layers: TacticalLayer[]) {
  return layers.filter(isTacticalLayerPublished);
}

export function getBaseImageryLayerById(
  catalog: BaseImageryCatalog,
  layerId?: string,
): BaseImageryLayer | null {
  const requestedLayer = layerId
    ? catalog.layers.find((layer) => layer.id === layerId)
    : null;

  if (requestedLayer) {
    return requestedLayer;
  }

  return catalog.layers.find((layer) => layer.id === catalog.defaultLayerId) ?? null;
}

export function getAvailableDatesForImageryLayer(
  catalog: BaseImageryCatalog,
  layerId?: string,
) {
  const layer = getBaseImageryLayerById(catalog, layerId);
  if (!layer || layer.status !== "published") {
    return [];
  }

  return [...layer.availableDates];
}

export function getImageryLevelBounds(
  catalog: BaseImageryCatalog,
  layerId?: string,
) {
  const layer = getBaseImageryLayerById(catalog, layerId);
  if (!layer || layer.status !== "published") {
    return null;
  }

  return {
    minimumLevel: layer.minZoom,
    maximumLevel: layer.maxZoom,
  };
}
