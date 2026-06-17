import { latestYear } from "@/data/mock/catalog";
import { countries, countryProfiles, getObservation, indicatorObservations } from "@/data/mock/countries";
import { blocs } from "@/data/normalized/blocs";
import { historicalEvents } from "@/data/normalized/events";
import { forecastSeries } from "@/data/normalized/forecasts";
import { indicatorDefinitions } from "@/data/normalized/indicators";
import { subnationalUnits } from "@/data/normalized/regions";
import { tradeFlows } from "@/data/mock/trade";

export function getCountryBySlug(slug: string) {
  return countries.find((country) => country.slug === slug);
}

export function getCountryProfileBySlug(slug: string) {
  return countryProfiles.find((profile) => profile.country.slug === slug);
}

export function getCountrySeries(slug: string, indicatorIds: string[]) {
  return indicatorObservations.filter(
    (observation) =>
      observation.entityId === slug && indicatorIds.includes(observation.indicatorId),
  );
}

export function getRegionsForCountry(countrySlug: string) {
  return subnationalUnits.filter((region) => region.countrySlug === countrySlug);
}

export function getTradeFlowsForCountry(countrySlug: string) {
  return tradeFlows.filter((flow) => flow.reporterSlug === countrySlug);
}

export function getHistoricalEvents(entityId: string) {
  return historicalEvents.filter((event) => event.entityId === entityId);
}

export function getForecasts(entityId: string) {
  return forecastSeries.filter((series) => series.entityId === entityId);
}

export function getIndicatorLibrary() {
  return indicatorDefinitions;
}

export function getIndicatorCategories() {
  return Array.from(new Set(indicatorDefinitions.map((indicator) => indicator.category)));
}

export function getRanking(metric: string, year = latestYear) {
  return countries
    .map((country) => ({
      country,
      observation: getObservation(country.slug, metric, year),
    }))
    .filter((entry) => entry.observation?.value !== null && entry.observation?.value !== undefined)
    .sort((left, right) => (right.observation?.value ?? 0) - (left.observation?.value ?? 0));
}

export function getCompareRows(slugs: string[], metricIds: string[]) {
  return slugs
    .map((slug) => {
      const country = getCountryBySlug(slug);
      if (!country) return null;

      return {
        country,
        values: Object.fromEntries(
          metricIds.map((metricId) => [metricId, getObservation(slug, metricId)?.value ?? null]),
        ),
      };
    })
    .filter(
      (
        row,
      ): row is {
        country: NonNullable<ReturnType<typeof getCountryBySlug>>;
        values: Record<string, number | null>;
      } => Boolean(row),
    );
}

export function getBlocById(blocId: string) {
  return blocs.find((bloc) => bloc.id === blocId);
}

export function getCountriesForBloc(blocId: string) {
  const bloc = getBlocById(blocId);
  if (!bloc) return [];
  return bloc.memberSlugs
    .map((slug) => getCountryBySlug(slug))
    .filter((country): country is NonNullable<typeof country> => Boolean(country));
}
