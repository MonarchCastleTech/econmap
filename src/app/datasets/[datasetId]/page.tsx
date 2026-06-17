import { notFound } from "next/navigation";

import { DatasetWorkspacePage } from "@/features/datasets/components/dataset-workspace-page";
import {
  loadCommandCenterDatasetAnalytics,
  loadCommandCenterDatasetWorkspace,
  loadCommandCenterManifest,
} from "@/lib/command-center-data";

// Required by output:'export' — pre-render every dataset in the command-center inventory.
export async function generateStaticParams() {
  const manifest = await loadCommandCenterManifest();
  return (manifest?.datasetInventory ?? []).map((dataset) => ({ datasetId: dataset.id }));
}

export default async function DatasetWorkspaceRoute({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;

  try {
    const [workspace, analytics] = await Promise.all([
      loadCommandCenterDatasetWorkspace(datasetId),
      loadCommandCenterDatasetAnalytics(datasetId),
    ]);
    return <DatasetWorkspacePage workspace={workspace} analytics={analytics} />;
  } catch {
    notFound();
  }
}
