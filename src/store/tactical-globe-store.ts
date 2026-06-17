"use client";

import { create, type StateCreator } from "zustand";
import { createStore } from "zustand/vanilla";

export type TacticalSelectedPoint = {
  activeLayerIds: string[];
  latitude: number;
  longitude: number;
  nearestPlaceName?: string;
  timestamp: string;
};

export type TacticalMarkerMode =
  | "none"
  | "marker"
  | "waypoint"
  | "polygon"
  | "rectangle";

export type TacticalGlobeState = {
  activeBaseImageryLayerId: string;
  activeDate?: string;
  activeLayerIds: string[];
  isLegendOpen: boolean;
  isSettingsOpen: boolean;
  isShortcutsOpen: boolean;
  isSidebarCollapsed: boolean;
  layerOpacityById: Record<string, number>;
  markerMode: TacticalMarkerMode;
  selectedPoint: TacticalSelectedPoint | null;
  setActiveBaseImageryLayerId: (layerId: string) => void;
  setActiveDate: (date?: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLegendOpen: (isOpen: boolean) => void;
  setMarkerMode: (mode: TacticalMarkerMode) => void;
  setSelectedPoint: (selectedPoint: TacticalSelectedPoint | null) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setShortcutsOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleLayer: (layerId: string) => void;
};

const createTacticalGlobeState: StateCreator<TacticalGlobeState> = (set) => ({
  activeBaseImageryLayerId: "night-lights",
  activeDate: undefined,
  activeLayerIds: [],
  isLegendOpen: false,
  isSettingsOpen: false,
  isShortcutsOpen: false,
  isSidebarCollapsed: false,
  layerOpacityById: {},
  markerMode: "none",
  selectedPoint: null,
  setActiveBaseImageryLayerId: (activeBaseImageryLayerId) => set({ activeBaseImageryLayerId }),
  setActiveDate: (activeDate) => set({ activeDate }),
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layerOpacityById: {
        ...state.layerOpacityById,
        [layerId]: opacity,
      },
    })),
  setLegendOpen: (isLegendOpen) => set({ isLegendOpen }),
  setMarkerMode: (markerMode) => set({ markerMode }),
  setSelectedPoint: (selectedPoint) => set({ selectedPoint }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleLayer: (layerId) =>
    set((state) => ({
      activeLayerIds: state.activeLayerIds.includes(layerId)
        ? state.activeLayerIds.filter((activeLayerId) => activeLayerId !== layerId)
        : [...state.activeLayerIds, layerId],
    })),
});

export const createTacticalGlobeStore = () => createStore<TacticalGlobeState>()(createTacticalGlobeState);

export const useTacticalGlobeStore = create<TacticalGlobeState>()(createTacticalGlobeState);
