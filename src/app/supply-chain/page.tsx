import { SupplyChainPanel } from "@/features/supply-chain/components/supply-chain-panel";

export const metadata = {
  title: "Supply Chain — EconMap",
  description: "Deterministic reference scenarios for global trade corridors and logistics hubs.",
};

export default function SupplyChainPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Supply Chain Reference Model</h1>
          <p className="mt-1 text-sm text-slate-400">
            Explore reproducible corridor and dependency scenarios alongside published source data.
          </p>
        </header>
        <SupplyChainPanel />
      </div>
    </div>
  );
}
