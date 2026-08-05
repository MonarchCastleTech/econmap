"use client";

import { useMemo, useState } from "react";

import {
  computeInfluenceScores,
  entityEdges,
  entityNodes,
  findEntityPath,
  getEntityRelationships,
  networkClusters,
} from "@/data/mock/entity-network";

export function EntityNetworkPanel() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [pathSource, setPathSource] = useState<string | null>(null);
  const [pathTarget, setPathTarget] = useState<string | null>(null);

  const influenceScores = useMemo(() => computeInfluenceScores(), []);
  const topInfluencers = useMemo(
    () => [...influenceScores].sort((a, b) => b.degree - a.degree).slice(0, 10),
    [influenceScores],
  );

  const selectedRelationships = selectedEntity
    ? getEntityRelationships(selectedEntity)
    : null;

  const path = pathSource && pathTarget ? findEntityPath(pathSource, pathTarget) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Network Clusters</h3>
        <p className="mt-1 text-sm text-slate-400">
          Industry clusters identified through relationship analysis
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {networkClusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => setSelectedEntity(cluster.nodes[0] ?? null)}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left transition-colors hover:border-cyan-400/30 hover:bg-slate-800/50"
            >
              <p className="text-sm font-medium text-cyan-200">{cluster.label}</p>
              <p className="mt-1 text-xs text-slate-400">
                {cluster.nodes.length} entities
              </p>
              {cluster.dominantIndustry && (
                <span className="mt-2 inline-block rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
                  {cluster.dominantIndustry}
                </span>
              )}
              {cluster.totalRevenueUsd && (
                <p className="mt-2 text-xs text-slate-500">
                  ${(cluster.totalRevenueUsd / 1e9).toFixed(0)}B combined revenue
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Top Influencers</h3>
        <p className="mt-1 text-sm text-slate-400">
          Entities with the highest network connectivity (degree centrality)
        </p>
        <div className="mt-4 space-y-2">
          {topInfluencers.map((entity, index) => {
            const node = entityNodes.find((n) => n.id === entity.entityId);
            return (
              <button
                key={entity.entityId}
                onClick={() => setSelectedEntity(entity.entityId)}
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-left transition-colors hover:border-cyan-400/20"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-200">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{entity.entityName}</p>
                    <p className="text-xs text-slate-400">
                      {node?.industry} • {entity.industries.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan-200">{entity.degree} links</p>
                  <p className="text-xs text-slate-500">{entity.clusterCount} clusters</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedEntity && selectedRelationships && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            Entity Relationships: {entityNodes.find((n) => n.id === selectedEntity)?.name}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Outgoing</p>
              <div className="mt-2 space-y-1">
                {selectedRelationships.outgoing.map((edge) => (
                  <div key={edge.id} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs">
                    <span className="text-slate-200">
                      {entityNodes.find((n) => n.id === edge.targetId)?.name}
                    </span>
                    <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-orange-300">
                      {edge.relationship}
                    </span>
                  </div>
                ))}
                {selectedRelationships.outgoing.length === 0 && (
                  <p className="text-xs text-slate-500">No outgoing relationships</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Incoming</p>
              <div className="mt-2 space-y-1">
                {selectedRelationships.incoming.map((edge) => (
                  <div key={edge.id} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-xs">
                    <span className="text-slate-200">
                      {entityNodes.find((n) => n.id === edge.sourceId)?.name}
                    </span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                      {edge.relationship}
                    </span>
                  </div>
                ))}
                {selectedRelationships.incoming.length === 0 && (
                  <p className="text-xs text-slate-500">No incoming relationships</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Entity Path Finder</h3>
        <p className="mt-1 text-sm text-slate-400">
          Trace relationship paths between entities
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={pathSource ?? ""}
            onChange={(e) => setPathSource(e.target.value || null)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Select source...</option>
            {entityNodes.map((node) => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
          <select
            value={pathTarget ?? ""}
            onChange={(e) => setPathTarget(e.target.value || null)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Select target...</option>
            {entityNodes.map((node) => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
        </div>
        {path && (
          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cyan-300">
              Path ({path.length - 1} hops)
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {path.map((nodeId, i) => {
                const node = entityNodes.find((n) => n.id === nodeId);
                return (
                  <span key={nodeId} className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-900/60 px-2 py-1 text-xs text-white">
                      {node?.name}
                    </span>
                    {i < path.length - 1 && (
                      <span className="text-cyan-400">→</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {pathSource && pathTarget && path === null && (
          <p className="mt-4 text-sm text-slate-500">No path found between selected entities.</p>
        )}
      </div>
    </div>
  );
}
