import type { MapMode } from "@/domain/types";

export type ViewState = {
  metric?: string;
  year?: number;
  region?: string;
  bloc?: string;
  mapMode?: MapMode | "bubble";
};

export function serializeViewState(state: ViewState) {
  const params = new URLSearchParams();

  if (state.metric) params.set("metric", state.metric);
  if (state.year) params.set("year", String(state.year));
  if (state.region) params.set("region", state.region);
  if (state.bloc) params.set("bloc", state.bloc);
  if (state.mapMode) params.set("mapMode", state.mapMode);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function parseViewState(queryString: string): ViewState {
  const normalized = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(normalized);
  const year = params.get("year");

  return {
    metric: params.get("metric") ?? undefined,
    year: year ? Number(year) : undefined,
    region: params.get("region") ?? undefined,
    bloc: params.get("bloc") ?? undefined,
    mapMode: (params.get("mapMode") as ViewState["mapMode"]) ?? undefined,
  };
}
