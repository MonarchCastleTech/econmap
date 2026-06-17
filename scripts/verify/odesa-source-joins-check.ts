import { getEntityIndex } from "../data/cities/load-bulk-entities";
import { findAirportsForCity } from "../data/cities/parsers/ourairports-parser";
import { findUnlocodeEntitiesForCity } from "../data/cities/parsers/unlocode-parser";
import { findPowerPlantsForCity } from "../data/cities/parsers/wri-powerplants-parser";
import { findResearchForCity } from "../data/cities/parsers/ror-parser";
import { findPortsForCity } from "../data/cities/parsers/wpi-parser";

async function main() {
  const entityIndex = await getEntityIndex();
  const city = {
    name: "Odesa",
    countryIso2: "UA",
    countryIso3: "UKR",
    admin1Name: "Odesa",
    latitude: 46.48572,
    longitude: 30.74383,
  };

  const airports = findAirportsForCity(entityIndex.airports, city, 50);
  const unlocode = findUnlocodeEntitiesForCity(entityIndex.unlocodeEntities, city, 30);
  const wpiPorts = findPortsForCity(entityIndex.wpiPorts, city, 50);
  const powerPlants = findPowerPlantsForCity(entityIndex.powerPlants, city, 100);
  const research = findResearchForCity(entityIndex.researchOrgs, city, 50);

  console.log(
    JSON.stringify(
      {
        city,
        counts: {
          airports: airports.length,
          unlocode: unlocode.length,
          wpiPorts: wpiPorts.length,
          powerPlants: powerPlants.length,
          research: research.length,
        },
        unlocodeSample: unlocode.slice(0, 10).map((entity) => ({
          entityType: entity.entityType,
          name: entity.name,
          unlocode: entity.unlocode,
        })),
        wpiSample: wpiPorts.slice(0, 10).map((entity) => ({
          name: entity.name,
          alternateName: entity.alternateName,
          unlocode: entity.unlocode,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
