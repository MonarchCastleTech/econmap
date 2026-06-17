import { HomeShell } from "@/features/home/components/home-shell";
import {
  loadBaseImageryCatalog,
  loadCityFootprintCatalog,
  loadCityFootprintSelection,
  loadFeaturedCommandCenterCities,
  loadCommandCenterManifest,
  loadGlobeManifest,
} from "@/lib/command-center-home-data";
import { loadLegacyOsintSurfaceModel } from "@/lib/command-center-data";

const EXCLUDED_BASE_IMAGERY_LAYER_IDS = new Set(["true-color"]);

function resolveDefaultBaseImageryLayerId(
  availableBaseImageryLayerIds: Set<string>,
  defaultLayerId?: string,
) {
  if (availableBaseImageryLayerIds.has("night-lights")) {
    return "night-lights";
  }

  if (defaultLayerId && availableBaseImageryLayerIds.has(defaultLayerId)) {
    return defaultLayerId;
  }

  return undefined;
}

function isBaseImageryLayerSelectable(layerId?: string) {
  if (!layerId) {
    return false;
  }

  return !EXCLUDED_BASE_IMAGERY_LAYER_IDS.has(layerId);
}

function buildSelectedCitySummary({
  featuredCities,
  selectableCities,
  selectedCitySlug,
}: {
  featuredCities: Awaited<ReturnType<typeof loadFeaturedCommandCenterCities>>;
  selectableCities: Awaited<ReturnType<typeof loadCityFootprintCatalog>>["cities"];
  selectedCitySlug?: string;
}) {
  if (!selectedCitySlug) {
    return undefined;
  }

  const featuredCity = featuredCities.find((city) => city.slug === selectedCitySlug);
  if (featuredCity) {
    return {
      admin1Code: featuredCity.admin1Code,
      admin1Name: featuredCity.admin1Name,
      cityId: featuredCity.cityId,
      countryIso2: featuredCity.countryIso2,
      countryIso3: featuredCity.countryIso3,
      latitude: featuredCity.latitude,
      longitude: featuredCity.longitude,
      name: featuredCity.name,
      population: featuredCity.population,
      populationSource: featuredCity.populationSource,
      registrySource: featuredCity.registrySource,
      slug: featuredCity.slug,
      sourceLabel: featuredCity.populationSource ?? featuredCity.registrySource,
    };
  }

  const selectableCity = selectableCities.find((city) => city.slug === selectedCitySlug);
  if (!selectableCity || selectableCity.latitude === undefined || selectableCity.longitude === undefined) {
    return undefined;
  }

  return {
    cityId: selectableCity.cityId,
    countryIso3: selectableCity.countryIso3,
    latitude: selectableCity.latitude,
    longitude: selectableCity.longitude,
    name: selectableCity.name,
    population: selectableCity.population,
    slug: selectableCity.slug,
    sourceLabel: selectableCity.sourceLabel,
  };
}

function buildAnalystWatchlists({
  featuredCities,
  legacySurfaceModel,
}: {
  featuredCities: Awaited<ReturnType<typeof loadFeaturedCommandCenterCities>>;
  legacySurfaceModel: Awaited<ReturnType<typeof loadLegacyOsintSurfaceModel>>;
}) {
  return legacySurfaceModel.watchlists.map((watchlist) => {
    const cityLabels = watchlist.citySlugs
      .map((slug) =>
        legacySurfaceModel.selectedCities.find((city) => city.slug === slug)?.name ??
        featuredCities.find((city) => city.slug === slug)?.name,
      )
      .filter((value): value is string => Boolean(value))
      .slice(0, 3);

    return {
      id: watchlist.id,
      label: watchlist.label,
      description: watchlist.description,
      cityCount: watchlist.citySlugs.length,
      cityLabels,
      href: watchlist.citySlugs[0] ? `/?city=${watchlist.citySlugs[0]}` : undefined,
      sourceLabels: watchlist.sourceLabels,
    };
  });
}

// Static export (`output: "export"`) provides no request-time searchParams, so the
// home page renders the default analyst surface (featured city + default imagery).
// Deep-link params (?city, ?layers, ?base, ?date, ?view, ?q) are a client concern
// and are not read at build time.
export default async function Home() {
  const searchQuery = "";
  const selectedCitySlug: string | undefined = undefined;
  const requestedViewId: string | undefined = undefined;
  const requestedLayerIds: string[] = [];
  const requestedBaseImageryLayerId: string | undefined = undefined;
  const requestedDate: string | undefined = undefined;
  const isBlankHomepageSearch = true;

  const [
    commandCenterManifest,
    globeManifest,
    baseImageryCatalog,
    cityFootprintCatalog,
    cityFootprintSelection,
    featuredCities,
    legacySurfaceModel,
  ] = await Promise.all([
    loadCommandCenterManifest(),
    loadGlobeManifest(),
    loadBaseImageryCatalog(),
    loadCityFootprintCatalog(),
    loadCityFootprintSelection(),
    loadFeaturedCommandCenterCities(),
    loadLegacyOsintSurfaceModel(),
  ]);
  const resolvedSelectedCitySlug = selectedCitySlug ?? (isBlankHomepageSearch ? featuredCities[0]?.slug : undefined);
  const selectedCitySummary = buildSelectedCitySummary({
    featuredCities,
    selectableCities: cityFootprintCatalog.cities,
    selectedCitySlug: resolvedSelectedCitySlug,
  });

  const activeView =
    commandCenterManifest.savedViews.find((view) => view.id === requestedViewId) ??
    commandCenterManifest.savedViews.find((view) => view.id === commandCenterManifest.defaultViewId) ??
    commandCenterManifest.savedViews[0];

  const availableLayerIds = new Set(globeManifest.layers.map((layer) => layer.id));
  const hasExplicitLayerSelection = requestedLayerIds.length > 0;
  // Default-visible evidence layer: the real Ports layer (UN/LOCODE + World Port Index).
  // activeLayerIds below filters this through availableLayerIds, so it is silently dropped
  // if the layer is ever absent from the globe manifest. Source labels stay visible via the
  // layer-legend modal + the sidebar Ports row.
  const defaultHomepageLayerIds: string[] = ["ports"];
  const activeLayerIds = hasExplicitLayerSelection
    ? requestedLayerIds.filter((layerId) => availableLayerIds.has(layerId))
    : defaultHomepageLayerIds;
  const availableBaseImageryLayerIds = new Set(baseImageryCatalog.layers.map((layer) => layer.id));
  const defaultBaseImageryLayerId = resolveDefaultBaseImageryLayerId(
    availableBaseImageryLayerIds,
    baseImageryCatalog.defaultLayerId,
  );
  const activeBaseImageryLayer =
    (requestedBaseImageryLayerId &&
    isBaseImageryLayerSelectable(requestedBaseImageryLayerId) &&
    availableBaseImageryLayerIds.has(requestedBaseImageryLayerId)
      ? baseImageryCatalog.layers.find((layer) => layer.id === requestedBaseImageryLayerId)
      : undefined) ??
    (defaultBaseImageryLayerId
      ? baseImageryCatalog.layers.find((layer) => layer.id === defaultBaseImageryLayerId)
      : undefined) ??
    baseImageryCatalog.layers[0];
  const activeDate =
    activeBaseImageryLayer?.status === "published"
      ? activeBaseImageryLayer.availableDates.includes(requestedDate ?? "")
        ? requestedDate
        : activeBaseImageryLayer.availableDates[0]
      : undefined;

  return (
    <HomeShell
      activeLayerIds={activeLayerIds}
      activeBaseImageryLayerId={
        activeBaseImageryLayer?.id ?? defaultBaseImageryLayerId ?? baseImageryCatalog.defaultLayerId
      }
      activeDate={activeDate}
      activeViewId={activeView?.id ?? commandCenterManifest.defaultViewId}
      cityResults={[]}
      commandCenterManifest={commandCenterManifest}
      globeManifest={globeManifest}
      baseImageryCatalog={baseImageryCatalog}
      citySelectionAssetPath={cityFootprintSelection.selectionAssetPath}
      featuredCities={featuredCities}
      searchQuery={searchQuery}
      selectedCityPanel={null}
      selectedCitySummary={selectedCitySummary}
      selectedCitySlug={resolvedSelectedCitySlug}
      watchlists={buildAnalystWatchlists({ featuredCities, legacySurfaceModel })}
    />
  );
}
