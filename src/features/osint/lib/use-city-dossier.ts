"use client";

/**
 * Loads a city's dossier (entities + sources + coverage) from the Range-addressable bundle,
 * with the same monotonic-token / cancelled guard the OSINT console uses — so an out-of-order
 * resolution can't write one city's data under another. Used by the multi-city compare view
 * (one hook per column) and available to any future single-city surface.
 *
 * `loading` and the returned dossier are DERIVED from one `loaded` state + the requested cityId,
 * so the effect only ever sets state asynchronously (in `.then`) — no synchronous setState in an
 * effect (react-hooks/set-state-in-effect).
 */
import { useEffect, useRef, useState } from "react";

import {
  loadCityCoverageShell,
  loadCityEntities,
  type CityCoverageShell,
} from "@/lib/city-data-client";

export type DossierEntity = NonNullable<Awaited<ReturnType<typeof loadCityEntities>>>["entities"][number];
export type DossierSources = NonNullable<Awaited<ReturnType<typeof loadCityEntities>>>["sources"];

export type CityDossier = {
  entities: DossierEntity[];
  sources: DossierSources;
  coverage: CityCoverageShell | null;
  /** null while loading / before first load; true once any source-backed data resolved; false = identity-only. */
  hasDossier: boolean | null;
  loading: boolean;
};

const EMPTY: CityDossier = { entities: [], sources: [], coverage: null, hasDossier: null, loading: false };

export function useCityDossier(cityId: string | null): CityDossier {
  const [loaded, setLoaded] = useState<{ cityId: string | null; dossier: CityDossier }>({
    cityId: null,
    dossier: EMPTY,
  });
  const latestReq = useRef(0);

  useEffect(() => {
    if (!cityId) return;
    const reqId = ++latestReq.current;
    let cancelled = false;

    Promise.all([loadCityEntities(cityId), loadCityCoverageShell(cityId)])
      .then(([ent, cov]) => {
        if (cancelled || reqId !== latestReq.current) return;
        setLoaded({
          cityId,
          dossier: {
            entities: ent?.entities ?? [],
            sources: ent?.sources ?? [],
            coverage: cov,
            hasDossier: Boolean(ent || cov),
            loading: false,
          },
        });
      })
      .catch(() => {
        if (cancelled || reqId !== latestReq.current) return;
        setLoaded({
          cityId,
          dossier: { entities: [], sources: [], coverage: null, hasDossier: false, loading: false },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [cityId]);

  if (cityId == null) return EMPTY;
  // The loaded state matches the requested city → return it; otherwise we're loading the new one.
  if (loaded.cityId === cityId) return loaded.dossier;
  return { ...EMPTY, loading: true };
}
