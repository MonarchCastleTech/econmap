import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CountryFactbook } from "@/features/country/components/country-factbook";
import { getCountryBySlug, getCountryProfileBySlug } from "@/lib/factbook";
import { countries } from "@/data/normalized/countries";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return countries.map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryBySlug(slug);

  if (!country) {
    return {
      title: "Country Not Found | MapFactbook",
    };
  }

  return {
    title: `${country.name} Country Factbook | MapFactbook`,
    description: `Economic and demographic data for ${country.name}`,
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { slug } = await params;

  if (!getCountryBySlug(slug)) {
    notFound();
  }

  return <CountryFactbook slug={slug} />;
}
