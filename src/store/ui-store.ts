"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { MapMode } from "@/domain/types";
import { latestYear } from "@/data/mock/catalog";

type UiState = {
  metric: string;
  year: number;
  region?: string;
  bloc?: string;
  mapMode: MapMode;
  selectedCountrySlug?: string;
  search: string;
  explorationMode: "country" | "city";
  selectedCitySlug?: string;
  setMetric: (metric: string) => void;
  setYear: (year: number) => void;
  setRegion: (region?: string) => void;
  setBloc: (bloc?: string) => void;
  setMapMode: (mode: MapMode) => void;
  setSelectedCountrySlug: (slug?: string) => void;
  setSearch: (search: string) => void;
  setExplorationMode: (mode: "country" | "city") => void;
  setSelectedCitySlug: (slug?: string) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      metric: "gdp-current-usd",
      year: latestYear,
      mapMode: "choropleth",
      explorationMode: "country",
      search: "",
      setMetric: (metric) => set({ metric }),
      setYear: (year) => set({ year }),
      setRegion: (region) => set({ region }),
      setBloc: (bloc) => set({ bloc }),
      setMapMode: (mapMode) => set({ mapMode }),
      setSelectedCountrySlug: (selectedCountrySlug) => set({ selectedCountrySlug }),
      setSearch: (search) => set({ search }),
      setExplorationMode: (explorationMode) => set({ explorationMode }),
      setSelectedCitySlug: (selectedCitySlug) => set({ selectedCitySlug }),
    }),
    {
      name: "mapfactbook-ui-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({
        metric: state.metric,
        year: state.year,
        mapMode: state.mapMode,
        explorationMode: state.explorationMode,
      }),
    },
  ),
);
