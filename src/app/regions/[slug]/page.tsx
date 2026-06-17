import { subnationalUnits } from "@/data/normalized/regions";
import { RegionPage } from "@/features/regions/components/region-page";

// Required by output:'export' — pre-render every known subnational region slug.
export function generateStaticParams() {
  return subnationalUnits.map((unit) => ({ slug: unit.slug }));
}

export default async function RegionRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RegionPage slug={slug} />;
}
