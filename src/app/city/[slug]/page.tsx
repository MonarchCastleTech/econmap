import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityPageClient } from "./city-page-client";
import { loadCitySlugMeta } from "@/lib/city-data";

// Pre-render cities with population >= this threshold
const POPULATION_THRESHOLD = 50000;

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Generate static params for cities above population threshold.
// Uses the slim slug-meta map (~11MB) rather than the full registry (113MB) so
// the static-export workers don't hold ~500MB resident per worker (which OOM'd).
export async function generateStaticParams() {
  const slugMeta = await loadCitySlugMeta();
  return Object.entries(slugMeta)
    .filter(([, meta]) => meta.p >= POPULATION_THRESHOLD)
    .map(([slug]) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugMeta = await loadCitySlugMeta();
  const meta = slugMeta[slug];

  if (!meta) {
    return {
      title: "City Not Found | MapFactbook",
    };
  }

  return {
    title: `${meta.n} City OSINT Dossier | MapFactbook`,
    description: `Source-backed city-first OSINT dossier for ${meta.n}, ${meta.i}`,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params;
  // generateStaticParams already restricts this route to valid slugs; the O(1)
  // slug-meta check just guards stray direct hits without touching the registry.
  const slugMeta = await loadCitySlugMeta();
  if (!slugMeta[slug]) {
    notFound();
  }

  return <CityPageClient slug={slug} />;
}
