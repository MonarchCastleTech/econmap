import { EntityNetworkPanel } from "@/features/entity-network/components/entity-network-panel";

export const metadata = {
  title: "Entity Network — EconMap",
  description: "Palantir-style entity resolution and network analysis. Map corporate relationships, supply chain dependencies, and industry clusters.",
};

export default function EntityNetworkPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Entity Network</h1>
          <p className="mt-1 text-sm text-slate-400">
            Corporate relationship mapping, supply chain dependencies, and industry cluster analysis.
            Click any entity to explore its relationships.
          </p>
        </header>
        <EntityNetworkPanel />
      </div>
    </div>
  );
}
