import type { CityWorkspace } from "@/lib/city-data";

import { SourceBadge } from "./source-badge";

type EntityCardProps = {
  entity: CityWorkspace["entityHighlights"][number];
  showSource?: boolean;
  compact?: boolean;
};

const entityTypeLabels: Record<string, string> = {
  airport: "Airport",
  port: "Port",
  rail_hub: "Rail Hub",
  logistics_hub: "Logistics Hub",
  utility: "Utility",
  research: "Research",
  company: "Company",
  factory: "Factory",
  industrial_park: "Industrial Park",
};

const presenceTypeLabels: Record<string, string> = {
  airport: "Airport",
  port: "Port",
  rail_hub: "Rail Terminal",
  distribution: "Distribution Center",
  power_asset: "Power Asset",
  research: "Research Organization",
  office: "Office",
  headquarters: "Headquarters",
  regional_hq: "Regional HQ",
  manufacturing: "Manufacturing",
  plant: "Plant",
  warehouse: "Warehouse",
  industrial_park: "Industrial Park",
  logistics_hub: "Logistics Hub",
};

export function EntityCard({ entity, showSource = false, compact }: EntityCardProps) {
  const entityLabel = entityTypeLabels[entity.entityType] ?? entity.entityType;
  const presenceLabel = presenceTypeLabels[entity.presenceType] ?? entity.presenceType;

  const primarySource = entity.sources[0];

  if (compact) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#13181d] p-3 transition-colors hover:bg-white/8">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">{entity.entityName}</h3>
              {entity.exactSite ? (
                <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-xs text-emerald-300">
                  Exact
                </span>
              ) : (
                <span className="rounded bg-amber-500/20 px-1 py-0.5 text-xs text-amber-300">
                  City
                </span>
              )}
            </div>
            <div className="mt-1 flex gap-1">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">
                {entityLabel}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">
                {presenceLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="entity-name text-sm font-semibold text-white">{entity.entityName}</h3>
            {entity.exactSite && (
              <span
                className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300"
                title="Exact site coordinates verified"
              >
                Exact
              </span>
            )}
            {!entity.exactSite && (
              <span
                className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300"
                title="City-level presence only"
              >
                City-level
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className="entity-type rounded bg-white/10 px-2 py-0.5 text-slate-300">
              {entityLabel}
            </span>
            <span className="entity-type rounded bg-white/10 px-2 py-0.5 text-slate-400">
              {presenceLabel}
            </span>
          </div>

          {entity.entitySubtype && (
            <p className="mt-1.5 text-xs text-slate-500">Subtype: {entity.entitySubtype}</p>
          )}

          {showSource && primarySource && (
            <div className="mt-2">
              <SourceBadge source={primarySource} compact />
            </div>
          )}
        </div>

        {/* Geometry indicator */}
        <div className="ml-3 text-right">
          {entity.latitude && entity.longitude && (
            <p className="text-xs text-slate-500">
              {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-600">{entity.sources.length} source(s)</p>
        </div>
      </div>
    </div>
  );
}
