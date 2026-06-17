import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const ROOT_DIR = process.cwd();
const CITY_FOOTPRINT_DIR = path.join(ROOT_DIR, "public", "data", "globe", "reference", "city-footprints");
const CITY_FOOTPRINT_CATALOG_FILE = path.join(CITY_FOOTPRINT_DIR, "catalog.json");
const CITY_FOOTPRINT_SELECTION_FILE = path.join(CITY_FOOTPRINT_DIR, "selectable.geojson");
const execFileAsync = promisify(execFile);

function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

describe("generate-reference-layers", () => {
  it(
    "publishes political city selection assets for major cities and excludes district noise",
    async () => {
      await execFileAsync("python", ["scripts/data/globe/generate-reference-layers.py"], {
        cwd: ROOT_DIR,
      });

      expect(fs.existsSync(CITY_FOOTPRINT_CATALOG_FILE)).toBe(true);
      expect(fs.existsSync(CITY_FOOTPRINT_SELECTION_FILE)).toBe(true);

      const catalog = readJsonFile<{
        selectionAssetPath: string;
        cities: Array<{
          cityId: string;
          countryIso3: string;
          name: string;
          slug: string;
          sourceLabel: string;
        }>;
      }>(CITY_FOOTPRINT_CATALOG_FILE);

      const selection = readJsonFile<{
        features: Array<{
          properties?: {
            cityId?: string;
            countryIso3?: string;
            name?: string;
            slug?: string;
          };
        }>;
      }>(CITY_FOOTPRINT_SELECTION_FILE);

      expect(catalog.selectionAssetPath).toBe("/data/globe/reference/city-footprints/selectable.geojson");
      expect(catalog.cities.find((city) => city.slug === "geo-323786-ankara")?.sourceLabel).toBe(
        "Natural Earth Admin1",
      );
      expect(catalog.cities.length).toBeGreaterThan(0);
      expect(selection.features.length).toBeGreaterThan(0);
      expect(selection.features.length).toBe(catalog.cities.length);

      expect(catalog.cities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Istanbul",
            countryIso3: "TUR",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Ankara",
            countryIso3: "TUR",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Antalya",
            countryIso3: "TUR",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Paris",
            countryIso3: "FRA",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Rome",
            countryIso3: "ITA",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "London",
            countryIso3: "GBR",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Berlin",
            countryIso3: "DEU",
            sourceLabel: "Natural Earth Admin1",
          }),
          expect.objectContaining({
            name: "Tbilisi",
            countryIso3: "GEO",
            sourceLabel: "Natural Earth Admin1",
          }),
        ]),
      );

      expect(selection.features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ name: "Istanbul", countryIso3: "TUR" }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({ name: "Ankara", countryIso3: "TUR" }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({ name: "Paris", countryIso3: "FRA" }),
          }),
        ]),
      );

      const hasCity = (name: string, countryIso3: string) =>
        catalog.cities.some((city) => city.name === name && city.countryIso3 === countryIso3);

      expect(hasCity("Bedford", "GBR")).toBe(false);
      expect(hasCity("Eskipazar", "TUR")).toBe(false);
      expect(hasCity("Filmski Grad", "SRB")).toBe(false);
      expect(hasCity("Maltepe", "TUR")).toBe(false);
      expect(hasCity("Piacenza", "ITA")).toBe(false);
      expect(hasCity("Sultangazi", "TUR")).toBe(false);
      expect(hasCity("Sultanbeyli", "TUR")).toBe(false);
      expect(hasCity("Umraniye", "TUR")).toBe(false);
      expect(hasCity("Zonguldak", "TUR")).toBe(false);
    },
    240000,
  );
});
