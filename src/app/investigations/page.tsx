import { InvestigationPanel } from "@/features/investigations/components/investigation-panel";

export const metadata = {
  title: "Investigations — EconMap",
  description: "Active investigations, historical timeline events, and AI-detected pattern alerts.",
};

export default function InvestigationsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Investigation Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Active case files, historical event timelines, and AI-detected patterns.
            Track anomalies and build evidence packages.
          </p>
        </header>
        <InvestigationPanel />
      </div>
    </div>
  );
}
