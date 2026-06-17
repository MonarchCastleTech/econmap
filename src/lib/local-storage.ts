/**
 * Client-side localStorage wrapper for user state persistence.
 * Replaces Prisma/SQLite for static export deployment.
 * Provides the same API shape as server-side storage.
 */

const STORAGE_KEYS = {
  WATCHLISTS: "mapfactbook_watchlists",
  DASHBOARDS: "mapfactbook_dashboards",
  COLLECTIONS: "mapfactbook_collections",
} as const;

function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// -- Watchlists --

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

export const watchlistStorage = {
  list: (): Watchlist[] => getStorage<Watchlist>(STORAGE_KEYS.WATCHLISTS),

  create: (data: Omit<Watchlist, "id" | "createdAt" | "updatedAt">): Watchlist => {
    const items = getStorage<Watchlist>(STORAGE_KEYS.WATCHLISTS);
    const now = new Date().toISOString();
    const newItem: Watchlist = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    setStorage(STORAGE_KEYS.WATCHLISTS, items);
    return newItem;
  },

  update: (id: string, data: Partial<Omit<Watchlist, "id" | "createdAt">>): Watchlist | null => {
    const items = getStorage<Watchlist>(STORAGE_KEYS.WATCHLISTS);
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.WATCHLISTS, items);
    return items[idx];
  },

  delete: (id: string): boolean => {
    const items = getStorage<Watchlist>(STORAGE_KEYS.WATCHLISTS);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    setStorage(STORAGE_KEYS.WATCHLISTS, filtered);
    return true;
  },

  findById: (id: string): Watchlist | null => {
    return getStorage<Watchlist>(STORAGE_KEYS.WATCHLISTS).find((item) => item.id === id) ?? null;
  },
};

// -- Dashboards --

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: Record<string, unknown>;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const dashboardStorage = {
  list: (): Dashboard[] => getStorage<Dashboard>(STORAGE_KEYS.DASHBOARDS),

  create: (data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">): Dashboard => {
    const items = getStorage<Dashboard>(STORAGE_KEYS.DASHBOARDS);
    const now = new Date().toISOString();
    const newItem: Dashboard = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    setStorage(STORAGE_KEYS.DASHBOARDS, items);
    return newItem;
  },

  update: (id: string, data: Partial<Omit<Dashboard, "id" | "createdAt">>): Dashboard | null => {
    const items = getStorage<Dashboard>(STORAGE_KEYS.DASHBOARDS);
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.DASHBOARDS, items);
    return items[idx];
  },

  delete: (id: string): boolean => {
    const items = getStorage<Dashboard>(STORAGE_KEYS.DASHBOARDS);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    setStorage(STORAGE_KEYS.DASHBOARDS, filtered);
    return true;
  },

  findById: (id: string): Dashboard | null => {
    return getStorage<Dashboard>(STORAGE_KEYS.DASHBOARDS).find((item) => item.id === id) ?? null;
  },
};

// -- Saved Collections --

export interface SavedCollection {
  id: string;
  name: string;
  kind: string;
  description?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const collectionStorage = {
  list: (): SavedCollection[] => getStorage<SavedCollection>(STORAGE_KEYS.COLLECTIONS),

  create: (data: Omit<SavedCollection, "id" | "createdAt" | "updatedAt">): SavedCollection => {
    const items = getStorage<SavedCollection>(STORAGE_KEYS.COLLECTIONS);
    const now = new Date().toISOString();
    const newItem: SavedCollection = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    setStorage(STORAGE_KEYS.COLLECTIONS, items);
    return newItem;
  },

  update: (
    id: string,
    data: Partial<Omit<SavedCollection, "id" | "createdAt">>,
  ): SavedCollection | null => {
    const items = getStorage<SavedCollection>(STORAGE_KEYS.COLLECTIONS);
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.COLLECTIONS, items);
    return items[idx];
  },

  delete: (id: string): boolean => {
    const items = getStorage<SavedCollection>(STORAGE_KEYS.COLLECTIONS);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    setStorage(STORAGE_KEYS.COLLECTIONS, filtered);
    return true;
  },

  findById: (id: string): SavedCollection | null => {
    return (
      getStorage<SavedCollection>(STORAGE_KEYS.COLLECTIONS).find((item) => item.id === id) ?? null
    );
  },
};
