"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchlistState = {
  items: string[];
  toggle: (slug: string) => void;
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (slug) => {
        const items = get().items.includes(slug)
          ? get().items.filter((item) => item !== slug)
          : [...get().items, slug];
        set({ items });
      },
    }),
    { name: "mapfactbook-watchlist" },
  ),
);
