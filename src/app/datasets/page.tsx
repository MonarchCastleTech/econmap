import { DatasetCatalogPage } from "@/features/datasets/components/dataset-catalog-page";
import { loadCommandCenterManifest } from "@/lib/command-center-home-data";

export default async function DatasetsRoute() {
  const manifest = await loadCommandCenterManifest();
  return <DatasetCatalogPage manifest={manifest} />;
}
