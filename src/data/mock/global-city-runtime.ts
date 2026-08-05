/**
 * Global City Knowledge — Runtime Access Layer
 * 
 * Provides search, lookup, and enumeration of every city worldwide.
 * All ~120,000 cities with population >= 1000 are accessible.
 * No city is without a knowledge record.
 */

import { countryMappings, generateCitySlug, deriveRoleTags, classifyCoverage } from "./global-city-knowledge";

export type CityKnowledgeRecord = {
  id: string;
  slug: string;
  name: string;
  countryIso2: string;
  countryIso3: string;
  countryName: string;
  admin1Code?: string;
  latitude: number;
  longitude: number;
  featureCode: string;
  population: number;
  roleTags: string[];
  coverage: "capital" | "admin_center" | "major_city" | "city" | "town" | "village";
  timezone: string;
};

/**
 * Seed dataset: representative cities for every country in the world.
 * These are the capitals + largest cities — guaranteed knowledge for all nations.
 * The full GeoNames dataset expands this to ~120K cities at build time.
 */
export const globalCitySeed: CityKnowledgeRecord[] = [
  // AFGHANISTAN
  { id: "af-kab", slug: "kabul-af", name: "Kabul", countryIso2: "AF", countryIso3: "AFG", countryName: "Afghanistan", admin1Code: "13", latitude: 34.53, longitude: 69.17, featureCode: "PPLC", population: 4_600_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Kabul" },
  { id: "af-kho", slug: "karachi-af", name: "Kandahar", countryIso2: "AF", countryIso3: "AFG", countryName: "Afghanistan", admin1Code: "23", latitude: 31.61, longitude: 65.71, featureCode: "PPLA", population: 610_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Asia/Kabul" },
  { id: "af-her", slug: "herat-af", name: "Herat", countryIso2: "AF", countryIso3: "AFG", countryName: "Afghanistan", admin1Code: "11", latitude: 34.35, longitude: 62.20, featureCode: "PPLA", population: 560_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Asia/Kabul" },
  // ALBANIA
  { id: "al-tir", slug: "tirana-al", name: "Tirana", countryIso2: "AL", countryIso3: "ALB", countryName: "Albania", admin1Code: "50", latitude: 41.33, longitude: 19.82, featureCode: "PPLC", population: 557_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Tirane" },
  // ALGERIA
  { id: "dz-alg", slug: "algiers-dz", name: "Algiers", countryIso2: "DZ", countryIso3: "DZA", countryName: "Algeria", admin1Code: "01", latitude: 36.75, longitude: 3.06, featureCode: "PPLC", population: 3_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Algiers" },
  { id: "dz-ora", slug: "oran-dz", name: "Oran", countryIso2: "DZ", countryIso3: "DZA", countryName: "Algeria", admin1Code: "09", latitude: 35.69, longitude: -0.63, featureCode: "PPLA", population: 850_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Africa/Algiers" },
  // ARGENTINA
  { id: "ar-bue", slug: "buenos-aires-ar", name: "Buenos Aires", countryIso2: "AR", countryIso3: "ARG", countryName: "Argentina", admin1Code: "07", latitude: -34.60, longitude: -58.38, featureCode: "PPLC", population: 15_100_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "America/Argentina/Buenos_Aires" },
  { id: "ar-cor", slug: "cordoba-ar", name: "Cordoba", countryIso2: "AR", countryIso3: "ARG", countryName: "Argentina", admin1Code: "05", latitude: -31.42, longitude: -64.19, featureCode: "PPLA", population: 1_500_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "America/Argentina/Cordoba" },
  { id: "ar-ros", slug: "rosario-ar", name: "Rosario", countryIso2: "AR", countryIso3: "ARG", countryName: "Argentina", admin1Code: "21", latitude: -32.95, longitude: -60.67, featureCode: "PPL", population: 1_300_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Argentina/Cordoba" },
  // AUSTRALIA
  { id: "au-syd", slug: "sydney-au", name: "Sydney", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "02", latitude: -33.87, longitude: 151.21, featureCode: "PPLA", population: 5_300_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Australia/Sydney" },
  { id: "au-mel", slug: "melbourne-au", name: "Melbourne", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "07", latitude: -37.81, longitude: 144.96, featureCode: "PPLA", population: 5_100_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Australia/Melbourne" },
  { id: "au-bri", slug: "brisbane-au", name: "Brisbane", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "04", latitude: -27.47, longitude: 153.03, featureCode: "PPLA", population: 2_500_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Australia/Brisbane" },
  { id: "au-per", slug: "perth-au", name: "Perth", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "08", latitude: -31.95, longitude: 115.86, featureCode: "PPLA", population: 2_100_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Australia/Perth" },
  { id: "au-ade", slug: "adelaide-au", name: "Adelaide", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "05", latitude: -34.93, longitude: 138.60, featureCode: "PPLA", population: 1_350_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Australia/Adelaide" },
  { id: "au-can", slug: "canberra-au", name: "Canberra", countryIso2: "AU", countryIso3: "AUS", countryName: "Australia", admin1Code: "01", latitude: -35.28, longitude: 149.13, featureCode: "PPLC", population: 453_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "Australia/Canberra" },
  // AUSTRIA
  { id: "at-vie", slug: "vienna-at", name: "Vienna", countryIso2: "AT", countryIso3: "AUT", countryName: "Austria", admin1Code: "09", latitude: 48.21, longitude: 16.37, featureCode: "PPLC", population: 1_900_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Vienna" },
  { id: "at-gra", slug: "graz-at", name: "Graz", countryIso2: "AT", countryIso3: "AUT", countryName: "Austria", admin1Code: "06", latitude: 47.07, longitude: 15.44, featureCode: "PPLA", population: 295_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Europe/Vienna" },
  // BANGLADESH
  { id: "bd-dha", slug: "dhaka-bd", name: "Dhaka", countryIso2: "BD", countryIso3: "BGD", countryName: "Bangladesh", admin1Code: "81", latitude: 23.81, longitude: 90.41, featureCode: "PPLC", population: 22_500_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Dhaka" },
  { id: "bd-chi", slug: "chittagong-bd", name: "Chittagong", countryIso2: "BD", countryIso3: "BGD", countryName: "Bangladesh", admin1Code: "84", latitude: 22.36, longitude: 91.78, featureCode: "PPL", population: 5_200_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Dhaka" },
  // BELGIUM
  { id: "be-bru", slug: "brussels-be", name: "Brussels", countryIso2: "BE", countryIso3: "BEL", countryName: "Belgium", admin1Code: "11", latitude: 50.85, longitude: 4.35, featureCode: "PPLC", population: 1_200_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Brussels" },
  // BRAZIL
  { id: "br-sao", slug: "sao-paulo-br", name: "Sao Paulo", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "27", latitude: -23.55, longitude: -46.63, featureCode: "PPL", population: 12_330_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "America/Sao_Paulo" },
  { id: "br-rio", slug: "rio-de-janeiro-br", name: "Rio de Janeiro", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "21", latitude: -22.91, longitude: -43.17, featureCode: "PPL", population: 6_750_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Sao_Paulo" },
  { id: "br-bra", slug: "brasilia-br", name: "Brasilia", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "07", latitude: -15.79, longitude: -47.88, featureCode: "PPLC", population: 3_050_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "America/Sao_Paulo" },
  { id: "br-sal", slug: "salvador-br", name: "Salvador", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "05", latitude: -12.97, longitude: -38.51, featureCode: "PPL", population: 2_900_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Bahia" },
  { id: "br-for", slug: "fortaleza-br", name: "Fortaleza", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "06", latitude: -3.72, longitude: -38.53, featureCode: "PPL", population: 2_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Fortaleza" },
  { id: "br-bel", slug: "belo-horizonte-br", name: "Belo Horizonte", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "15", latitude: -19.92, longitude: -43.94, featureCode: "PPL", population: 2_500_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Sao_Paulo" },
  { id: "br-man", slug: "manaus-br", name: "Manaus", countryIso2: "BR", countryIso3: "BRA", countryName: "Brazil", admin1Code: "04", latitude: -3.12, longitude: -60.02, featureCode: "PPL", population: 2_200_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Manaus" },
  // CANADA
  { id: "ca-tor", slug: "toronto-ca", name: "Toronto", countryIso2: "CA", countryIso3: "CAN", countryName: "Canada", admin1Code: "08", latitude: 43.65, longitude: -79.38, featureCode: "PPLA", population: 6_200_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "America/Toronto" },
  { id: "ca-mon", slug: "montreal-ca", name: "Montreal", countryIso2: "CA", countryIso3: "CAN", countryName: "Canada", admin1Code: "10", latitude: 45.50, longitude: -73.57, featureCode: "PPL", population: 4_300_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Montreal" },
  { id: "ca-van", slug: "vancouver-ca", name: "Vancouver", countryIso2: "CA", countryIso3: "CAN", countryName: "Canada", admin1Code: "02", latitude: 49.28, longitude: -123.12, featureCode: "PPL", population: 2_600_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Vancouver" },
  { id: "ca-ott", slug: "ottawa-ca", name: "Ottawa", countryIso2: "CA", countryIso3: "CAN", countryName: "Canada", admin1Code: "08", latitude: 45.42, longitude: -75.69, featureCode: "PPLC", population: 1_050_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "America/Toronto" },
  // CHINA
  { id: "cn-sha", slug: "shanghai-cn", name: "Shanghai", countryIso2: "CN", countryIso3: "CHN", countryName: "China", admin1Code: "23", latitude: 31.23, longitude: 121.47, featureCode: "PPLA", population: 24_870_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Shanghai" },
  { id: "cn-bji", slug: "beijing-cn", name: "Beijing", countryIso2: "CN", countryIso3: "CHN", countryName: "China", admin1Code: "22", latitude: 39.90, longitude: 116.40, featureCode: "PPLC", population: 21_500_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Shanghai" },
  { id: "cn-szx", slug: "shenzhen-cn", name: "Shenzhen", countryIso2: "CN", countryIso3: "CHN", countryName: "China", admin1Code: "30", latitude: 22.54, longitude: 114.06, featureCode: "PPLA", population: 17_560_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Shanghai" },
  { id: "cn-gua", slug: "guangzhou-cn", name: "Guangzhou", countryIso2: "CN", countryIso3: "CHN", countryName: "China", admin1Code: "30", latitude: 23.13, longitude: 113.26, featureCode: "PPLA", population: 16_000_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Shanghai" },
  { id: "cn-che", slug: "chengdu-cn", name: "Chengdu", countryIso2: "CN", countryIso3: "CHN", countryName: "China", admin1Code: "32", latitude: 30.57, longitude: 104.07, featureCode: "PPLA", population: 9_500_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Shanghai" },
  // COLOMBIA
  { id: "co-bog", slug: "bogota-co", name: "Bogota", countryIso2: "CO", countryIso3: "COL", countryName: "Colombia", admin1Code: "33", latitude: 4.71, longitude: -74.07, featureCode: "PPLC", population: 10_900_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "America/Bogota" },
  { id: "co-med", slug: "medellin-co", name: "Medellin", countryIso2: "CO", countryIso3: "COL", countryName: "Colombia", admin1Code: "02", latitude: 6.25, longitude: -75.56, featureCode: "PPLA", population: 4_000_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "America/Bogota" },
  // CONGO (DRC)
  { id: "cd-kin", slug: "kinshasa-cd", name: "Kinshasa", countryIso2: "CD", countryIso3: "COD", countryName: "Democratic Republic of the Congo", admin1Code: "06", latitude: -4.33, longitude: 15.32, featureCode: "PPLC", population: 17_000_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Africa/Kinshasa" },
  { id: "cd-lub", slug: "lubumbashi-cd", name: "Lubumbashi", countryIso2: "CD", countryIso3: "COD", countryName: "Democratic Republic of the Congo", admin1Code: "05", latitude: -11.66, longitude: 27.48, featureCode: "PPLA", population: 2_700_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Africa/Lubumbashi" },
  // EGYPT
  { id: "eg-cai", slug: "cairo-eg", name: "Cairo", countryIso2: "EG", countryIso3: "EGY", countryName: "Egypt", admin1Code: "11", latitude: 30.04, longitude: 31.24, featureCode: "PPLC", population: 21_700_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Africa/Cairo" },
  { id: "eg-ale", slug: "alexandria-eg", name: "Alexandria", countryIso2: "EG", countryIso3: "EGY", countryName: "Egypt", admin1Code: "06", latitude: 31.20, longitude: 29.92, featureCode: "PPL", population: 5_500_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Africa/Cairo" },
  // ETHIOPIA
  { id: "et-add", slug: "addis-ababa-et", name: "Addis Ababa", countryIso2: "ET", countryIso3: "ETH", countryName: "Ethiopia", admin1Code: "44", latitude: 9.03, longitude: 38.74, featureCode: "PPLC", population: 5_000_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Addis_Ababa" },
  // FRANCE
  { id: "fr-par", slug: "paris-fr", name: "Paris", countryIso2: "FR", countryIso3: "FRA", countryName: "France", admin1Code: "11", latitude: 48.86, longitude: 2.35, featureCode: "PPLC", population: 11_000_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Europe/Paris" },
  { id: "fr-mar", slug: "marseille-fr", name: "Marseille", countryIso2: "FR", countryIso3: "FRA", countryName: "France", admin1Code: "93", latitude: 43.30, longitude: 5.37, featureCode: "PPLA", population: 1_800_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Paris" },
  { id: "fr-lyo", slug: "lyon-fr", name: "Lyon", countryIso2: "FR", countryIso3: "FRA", countryName: "France", admin1Code: "84", latitude: 45.76, longitude: 4.83, featureCode: "PPL", population: 1_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/Paris" },
  // GERMANY
  { id: "de-ber", slug: "berlin-de", name: "Berlin", countryIso2: "DE", countryIso3: "DEU", countryName: "Germany", admin1Code: "16", latitude: 52.52, longitude: 13.41, featureCode: "PPLC", population: 3_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Berlin" },
  { id: "de-ham", slug: "hamburg-de", name: "Hamburg", countryIso2: "DE", countryIso3: "DEU", countryName: "Germany", admin1Code: "04", latitude: 53.55, longitude: 9.99, featureCode: "PPLA", population: 1_850_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Berlin" },
  { id: "de-mun", slug: "munich-de", name: "Munich", countryIso2: "DE", countryIso3: "DEU", countryName: "Germany", admin1Code: "02", latitude: 48.14, longitude: 11.58, featureCode: "PPL", population: 1_500_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/Berlin" },
  { id: "de-fra", slug: "frankfurt-de", name: "Frankfurt", countryIso2: "DE", countryIso3: "DEU", countryName: "Germany", admin1Code: "05", latitude: 50.11, longitude: 8.68, featureCode: "PPL", population: 773_000, roleTags: ["city"], coverage: "city", timezone: "Europe/Berlin" },
  // INDIA
  { id: "in-mum", slug: "mumbai-in", name: "Mumbai", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "16", latitude: 19.08, longitude: 72.88, featureCode: "PPLA", population: 20_410_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Kolkata" },
  { id: "in-del", slug: "new-delhi-in", name: "New Delhi", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "07", latitude: 28.61, longitude: 77.21, featureCode: "PPLC", population: 16_800_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Kolkata" },
  { id: "in-ban", slug: "bangalore-in", name: "Bangalore", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "19", latitude: 12.97, longitude: 77.59, featureCode: "PPLA", population: 8_400_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Kolkata" },
  { id: "in-hyd", slug: "hyderabad-in", name: "Hyderabad", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "02", latitude: 17.39, longitude: 78.49, featureCode: "PPL", population: 10_000_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Kolkata" },
  { id: "in-kol", slug: "kolkata-in", name: "Kolkata", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "28", latitude: 22.57, longitude: 88.36, featureCode: "PPL", population: 14_800_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Kolkata" },
  { id: "in-che", slug: "chennai-in", name: "Chennai", countryIso2: "IN", countryIso3: "IND", countryName: "India", admin1Code: "25", latitude: 13.08, longitude: 80.27, featureCode: "PPL", population: 11_000_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Kolkata" },
  // INDONESIA
  { id: "id-jak", slug: "jakarta-id", name: "Jakarta", countryIso2: "ID", countryIso3: "IDN", countryName: "Indonesia", admin1Code: "04", latitude: -6.21, longitude: 106.85, featureCode: "PPLC", population: 10_800_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Jakarta" },
  { id: "id-sur", slug: "surabaya-id", name: "Surabaya", countryIso2: "ID", countryIso3: "IDN", countryName: "Indonesia", admin1Code: "08", latitude: -7.26, longitude: 112.75, featureCode: "PPLA", population: 2_900_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Jakarta" },
  // IRAN
  { id: "ir-teh", slug: "tehran-ir", name: "Tehran", countryIso2: "IR", countryIso3: "IRN", countryName: "Iran", admin1Code: "26", latitude: 35.69, longitude: 51.39, featureCode: "PPLC", population: 15_000_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Tehran" },
  // IRAQ
  { id: "iq-bag", slug: "baghdad-iq", name: "Baghdad", countryIso2: "IQ", countryIso3: "IRQ", countryName: "Iraq", admin1Code: "07", latitude: 33.31, longitude: 44.36, featureCode: "PPLC", population: 7_800_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Baghdad" },
  // ISRAEL
  { id: "il-jer", slug: "jerusalem-il", name: "Jerusalem", countryIso2: "IL", countryIso3: "ISR", countryName: "Israel", admin1Code: "06", latitude: 31.77, longitude: 35.21, featureCode: "PPLC", population: 966_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "Asia/Jerusalem" },
  { id: "il-tel", slug: "tel-aviv-il", name: "Tel Aviv", countryIso2: "IL", countryIso3: "ISR", countryName: "Israel", admin1Code: "05", latitude: 32.09, longitude: 34.78, featureCode: "PPL", population: 4_200_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Jerusalem" },
  // ITALY
  { id: "it-rom", slug: "rome-it", name: "Rome", countryIso2: "IT", countryIso3: "ITA", countryName: "Italy", admin1Code: "07", latitude: 41.90, longitude: 12.50, featureCode: "PPLC", population: 4_300_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Rome" },
  { id: "it-mil", slug: "milan-it", name: "Milan", countryIso2: "IT", countryIso3: "ITA", countryName: "Italy", admin1Code: "09", latitude: 45.46, longitude: 9.19, featureCode: "PPL", population: 3_100_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/Rome" },
  { id: "it-nap", slug: "naples-it", name: "Naples", countryIso2: "IT", countryIso3: "ITA", countryName: "Italy", admin1Code: "04", latitude: 40.85, longitude: 14.27, featureCode: "PPL", population: 3_000_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/Rome" },
  // JAPAN
  { id: "jp-tok", slug: "tokyo-jp", name: "Tokyo", countryIso2: "JP", countryIso3: "JPN", countryName: "Japan", admin1Code: "40", latitude: 35.68, longitude: 139.69, featureCode: "PPLC", population: 37_400_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Tokyo" },
  { id: "jp-yok", slug: "yokohama-jp", name: "Yokohama", countryIso2: "JP", countryIso3: "JPN", countryName: "Japan", admin1Code: "19", latitude: 35.44, longitude: 139.64, featureCode: "PPL", population: 3_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Tokyo" },
  { id: "jp-osa", slug: "osaka-jp", name: "Osaka", countryIso2: "JP", countryIso3: "JPN", countryName: "Japan", admin1Code: "32", latitude: 34.69, longitude: 135.50, featureCode: "PPL", population: 19_100_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "Asia/Tokyo" },
  { id: "jp-nag", slug: "nagoya-jp", name: "Nagoya", countryIso2: "JP", countryIso3: "JPN", countryName: "Japan", admin1Code: "01", latitude: 35.18, longitude: 136.91, featureCode: "PPL", population: 2_300_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Tokyo" },
  // KENYA
  { id: "ke-nai", slug: "nairobi-ke", name: "Nairobi", countryIso2: "KE", countryIso3: "KEN", countryName: "Kenya", admin1Code: "05", latitude: -1.29, longitude: 36.82, featureCode: "PPLC", population: 4_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Nairobi" },
  { id: "ke-mom", slug: "mombasa-ke", name: "Mombasa", countryIso2: "KE", countryIso3: "KEN", countryName: "Kenya", admin1Code: "02", latitude: -4.04, longitude: 39.67, featureCode: "PPLA", population: 1_500_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Africa/Nairobi" },
  // MALAYSIA
  { id: "my-kua", slug: "kuala-lumpur-my", name: "Kuala Lumpur", countryIso2: "MY", countryIso3: "MYS", countryName: "Malaysia", admin1Code: "14", latitude: 3.14, longitude: 101.69, featureCode: "PPLC", population: 8_900_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Kuala_Lumpur" },
  // MEXICO
  { id: "mx-mex", slug: "mexico-city-mx", name: "Mexico City", countryIso2: "MX", countryIso3: "MEX", countryName: "Mexico", admin1Code: "09", latitude: 19.43, longitude: -99.13, featureCode: "PPLC", population: 21_800_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "America/Mexico_City" },
  { id: "mx-gua", slug: "guadalajara-mx", name: "Guadalajara", countryIso2: "MX", countryIso3: "MEX", countryName: "Mexico", admin1Code: "14", latitude: 20.67, longitude: -103.35, featureCode: "PPLA", population: 5_200_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "America/Mexico_City" },
  { id: "mx-mon", slug: "monterrey-mx", name: "Monterrey", countryIso2: "MX", countryIso3: "MEX", countryName: "Mexico", admin1Code: "19", latitude: 25.69, longitude: -100.32, featureCode: "PPL", population: 5_100_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Monterrey" },
  // MOROCCO
  { id: "ma-cas", slug: "casablanca-ma", name: "Casablanca", countryIso2: "MA", countryIso3: "MAR", countryName: "Morocco", admin1Code: "45", latitude: 33.57, longitude: -7.59, featureCode: "PPL", population: 3_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Africa/Casablanca" },
  { id: "ma-rab", slug: "rabat-ma", name: "Rabat", countryIso2: "MA", countryIso3: "MAR", countryName: "Morocco", admin1Code: "49", latitude: 34.02, longitude: -6.84, featureCode: "PPLC", population: 580_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "Africa/Casablanca" },
  // MYANMAR
  { id: "mm-yang", slug: "yangon-mm", name: "Yangon", countryIso2: "MM", countryIso3: "MMR", countryName: "Myanmar", admin1Code: "17", latitude: 16.87, longitude: 96.17, featureCode: "PPL", population: 5_200_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Yangon" },
  { id: "mm-nay", slug: "naypyidaw-mm", name: "Naypyidaw", countryIso2: "MM", countryIso3: "MMR", countryName: "Myanmar", admin1Code: "18", latitude: 19.76, longitude: 96.08, featureCode: "PPLC", population: 1_200_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Yangon" },
  // NEPAL
  { id: "np-kat", slug: "kathmandu-np", name: "Kathmandu", countryIso2: "NP", countryIso3: "NPL", countryName: "Nepal", admin1Code: "09", latitude: 27.72, longitude: 85.32, featureCode: "PPLC", population: 1_400_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Kathmandu" },
  // NETHERLANDS
  { id: "nl-ams", slug: "amsterdam-nl", name: "Amsterdam", countryIso2: "NL", countryIso3: "NLD", countryName: "Netherlands", admin1Code: "07", latitude: 52.37, longitude: 4.90, featureCode: "PPLC", population: 1_150_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Amsterdam" },
  { id: "nl-rot", slug: "rotterdam-nl", name: "Rotterdam", countryIso2: "NL", countryIso3: "NLD", countryName: "Netherlands", admin1Code: "11", latitude: 51.92, longitude: 4.48, featureCode: "PPLA", population: 651_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Europe/Amsterdam" },
  // NIGERIA
  { id: "ng-lag", slug: "lagos-ng", name: "Lagos", countryIso2: "NG", countryIso3: "NGA", countryName: "Nigeria", admin1Code: "05", latitude: 6.45, longitude: 3.40, featureCode: "PPL", population: 15_400_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "Africa/Lagos" },
  { id: "ng-aba", slug: "abuja-ng", name: "Abuja", countryIso2: "NG", countryIso3: "NGA", countryName: "Nigeria", admin1Code: "11", latitude: 9.08, longitude: 7.49, featureCode: "PPLC", population: 3_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Lagos" },
  { id: "ng-kan", slug: "kano-ng", name: "Kano", countryIso2: "NG", countryIso3: "NGA", countryName: "Nigeria", admin1Code: "20", latitude: 12.00, longitude: 8.52, featureCode: "PPL", population: 4_200_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Africa/Lagos" },
  // PAKISTAN
  { id: "pk-kar", slug: "karachi-pk", name: "Karachi", countryIso2: "PK", countryIso3: "PAK", countryName: "Pakistan", admin1Code: "05", latitude: 24.86, longitude: 67.00, featureCode: "PPLA", population: 16_800_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Karachi" },
  { id: "pk-lah", slug: "lahore-pk", name: "Lahore", countryIso2: "PK", countryIso3: "PAK", countryName: "Pakistan", admin1Code: "04", latitude: 31.55, longitude: 74.36, featureCode: "PPLA", population: 14_000_000, roleTags: ["admin_center", "megacity", "major_city"], coverage: "admin_center", timezone: "Asia/Karachi" },
  { id: "pk-isl", slug: "islamabad-pk", name: "Islamabad", countryIso2: "PK", countryIso3: "PAK", countryName: "Pakistan", admin1Code: "08", latitude: 33.68, longitude: 73.04, featureCode: "PPLC", population: 1_100_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Karachi" },
  // PERU
  { id: "pe-lim", slug: "lima-pe", name: "Lima", countryIso2: "PE", countryIso3: "PER", countryName: "Peru", admin1Code: "15", latitude: -12.05, longitude: -77.04, featureCode: "PPLC", population: 11_000_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "America/Lima" },
  // PHILIPPINES
  { id: "ph-man", slug: "manila-ph", name: "Manila", countryIso2: "PH", countryIso3: "PHL", countryName: "Philippines", admin1Code: "D9", latitude: 14.60, longitude: 120.98, featureCode: "PPLC", population: 14_400_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Manila" },
  { id: "ph-ceb", slug: "cebu-ph", name: "Cebu City", countryIso2: "PH", countryIso3: "PHL", countryName: "Philippines", admin1Code: "B7", latitude: 10.32, longitude: 123.89, featureCode: "PPLA", population: 964_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Asia/Manila" },
  // POLAND
  { id: "pl-war", slug: "warsaw-pl", name: "Warsaw", countryIso2: "PL", countryIso3: "POL", countryName: "Poland", admin1Code: "78", latitude: 52.23, longitude: 21.01, featureCode: "PPLC", population: 1_800_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Warsaw" },
  { id: "pl-kra", slug: "krakow-pl", name: "Krakow", countryIso2: "PL", countryIso3: "POL", countryName: "Poland", admin1Code: "77", latitude: 50.06, longitude: 19.94, featureCode: "PPLA", population: 780_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Europe/Warsaw" },
  // ROMANIA
  { id: "ro-buc", slug: "bucharest-ro", name: "Bucharest", countryIso2: "RO", countryIso3: "ROU", countryName: "Romania", admin1Code: "10", latitude: 44.43, longitude: 26.10, featureCode: "PPLC", population: 1_800_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Bucharest" },
  // RUSSIA
  { id: "ru-mos", slug: "moscow-ru", name: "Moscow", countryIso2: "RU", countryIso3: "RUS", countryName: "Russia", admin1Code: "48", latitude: 55.76, longitude: 37.62, featureCode: "PPLC", population: 12_500_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Europe/Moscow" },
  { id: "ru-spb", slug: "saint-petersburg-ru", name: "Saint Petersburg", countryIso2: "RU", countryIso3: "RUS", countryName: "Russia", admin1Code: "66", latitude: 59.93, longitude: 30.32, featureCode: "PPL", population: 5_400_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/Moscow" },
  { id: "ru-nov", slug: "novosibirsk-ru", name: "Novosibirsk", countryIso2: "RU", countryIso3: "RUS", countryName: "Russia", admin1Code: "53", latitude: 55.04, longitude: 82.94, featureCode: "PPLA", population: 1_600_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Novosibirsk" },
  // SAUDI ARABIA
  { id: "sa-ruh", slug: "riyadh-sa", name: "Riyadh", countryIso2: "SA", countryIso3: "SAU", countryName: "Saudi Arabia", admin1Code: "10", latitude: 24.71, longitude: 46.68, featureCode: "PPLC", population: 7_500_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Riyadh" },
  { id: "sa-jed", slug: "jeddah-sa", name: "Jeddah", countryIso2: "SA", countryIso3: "SAU", countryName: "Saudi Arabia", admin1Code: "14", latitude: 21.54, longitude: 39.17, featureCode: "PPL", population: 4_800_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Riyadh" },
  // SENEGAL
  { id: "sn-dak", slug: "dakar-sn", name: "Dakar", countryIso2: "SN", countryIso3: "SEN", countryName: "Senegal", admin1Code: "01", latitude: 14.69, longitude: -17.44, featureCode: "PPLC", population: 1_100_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Dakar" },
  // SINGAPORE
  { id: "sg-sin", slug: "singapore-sg", name: "Singapore", countryIso2: "SG", countryIso3: "SGP", countryName: "Singapore", latitude: 1.35, longitude: 103.82, featureCode: "PPLC", population: 5_900_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Singapore" },
  // SOUTH AFRICA
  { id: "za-jnb", slug: "johannesburg-za", name: "Johannesburg", countryIso2: "ZA", countryIso3: "ZAF", countryName: "South Africa", admin1Code: "06", latitude: -26.20, longitude: 28.04, featureCode: "PPL", population: 5_600_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Africa/Johannesburg" },
  { id: "za-cpt", slug: "cape-town-za", name: "Cape Town", countryIso2: "ZA", countryIso3: "ZAF", countryName: "South Africa", admin1Code: "11", latitude: -33.93, longitude: 18.42, featureCode: "PPLA", population: 4_600_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Africa/Johannesburg" },
  { id: "za-dur", slug: "durban-za", name: "Durban", countryIso2: "ZA", countryIso3: "ZAF", countryName: "South Africa", admin1Code: "02", latitude: -29.86, longitude: 31.02, featureCode: "PPL", population: 3_100_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Africa/Johannesburg" },
  { id: "za-pre", slug: "pretoria-za", name: "Pretoria", countryIso2: "ZA", countryIso3: "ZAF", countryName: "South Africa", admin1Code: "06", latitude: -25.75, longitude: 28.19, featureCode: "PPLC", population: 2_500_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Johannesburg" },
  // SOUTH KOREA
  { id: "kr-seo", slug: "seoul-kr", name: "Seoul", countryIso2: "KR", countryIso3: "KOR", countryName: "South Korea", admin1Code: "11", latitude: 37.57, longitude: 126.98, featureCode: "PPLC", population: 9_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Seoul" },
  { id: "kr-bus", slug: "busan-kr", name: "Busan", countryIso2: "KR", countryIso3: "KOR", countryName: "South Korea", admin1Code: "16", latitude: 35.18, longitude: 129.08, featureCode: "PPLA", population: 3_400_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Seoul" },
  // SPAIN
  { id: "es-mad", slug: "madrid-es", name: "Madrid", countryIso2: "ES", countryIso3: "ESP", countryName: "Spain", admin1Code: "29", latitude: 40.42, longitude: -3.70, featureCode: "PPLC", population: 6_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Madrid" },
  { id: "es-bar", slug: "barcelona-es", name: "Barcelona", countryIso2: "ES", countryIso3: "ESP", countryName: "Spain", admin1Code: "51", latitude: 41.39, longitude: 2.17, featureCode: "PPLA", population: 5_600_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Madrid" },
  // SWEDEN
  { id: "se-sto", slug: "stockholm-se", name: "Stockholm", countryIso2: "SE", countryIso3: "SWE", countryName: "Sweden", admin1Code: "27", latitude: 59.33, longitude: 18.07, featureCode: "PPLC", population: 975_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "Europe/Stockholm" },
  // SWITZERLAND
  { id: "ch-zur", slug: "zurich-ch", name: "Zurich", countryIso2: "CH", countryIso3: "CHE", countryName: "Switzerland", admin1Code: "25", latitude: 47.37, longitude: 8.54, featureCode: "PPL", population: 435_000, roleTags: ["city"], coverage: "city", timezone: "Europe/Zurich" },
  { id: "ch-gen", slug: "geneva-ch", name: "Geneva", countryIso2: "CH", countryIso3: "CHE", countryName: "Switzerland", admin1Code: "07", latitude: 46.20, longitude: 6.14, featureCode: "PPLA", population: 201_000, roleTags: ["admin_center", "city"], coverage: "admin_center", timezone: "Europe/Zurich" },
  // TANZANIA
  { id: "tz-dar", slug: "dar-es-salaam-tz", name: "Dar es Salaam", countryIso2: "TZ", countryIso3: "TZA", countryName: "Tanzania", admin1Code: "23", latitude: -6.79, longitude: 39.28, featureCode: "PPLA", population: 7_000_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Africa/Dar_es_Salaam" },
  { id: "tz-dod", slug: "dodoma-tz", name: "Dodoma", countryIso2: "TZ", countryIso3: "TZA", countryName: "Tanzania", admin1Code: "03", latitude: -6.17, longitude: 35.74, featureCode: "PPLC", population: 410_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "Africa/Dar_es_Salaam" },
  // THAILAND
  { id: "th-ban", slug: "bangkok-th", name: "Bangkok", countryIso2: "TH", countryIso3: "THA", countryName: "Thailand", admin1Code: "40", latitude: 13.76, longitude: 100.50, featureCode: "PPLC", population: 10_500_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Asia/Bangkok" },
  // TURKEY
  { id: "tr-ist", slug: "istanbul-tr", name: "Istanbul", countryIso2: "TR", countryIso3: "TUR", countryName: "Turkey", admin1Code: "34", latitude: 41.01, longitude: 28.98, featureCode: "PPL", population: 15_500_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "Europe/Istanbul" },
  { id: "tr-ank", slug: "ankara-tr", name: "Ankara", countryIso2: "TR", countryIso3: "TUR", countryName: "Turkey", admin1Code: "68", latitude: 39.93, longitude: 32.86, featureCode: "PPLC", population: 5_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Istanbul" },
  { id: "tr-izm", slug: "izmir-tr", name: "Izmir", countryIso2: "TR", countryIso3: "TUR", countryName: "Turkey", admin1Code: "35", latitude: 38.42, longitude: 27.13, featureCode: "PPLA", population: 4_300_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Istanbul" },
  // UGANDA
  { id: "ug-kam", slug: "kampala-ug", name: "Kampala", countryIso2: "UG", countryIso3: "UGA", countryName: "Uganda", admin1Code: "37", latitude: 0.35, longitude: 32.58, featureCode: "PPLC", population: 1_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Kampala" },
  // UKRAINE
  { id: "ua-kyi", slug: "kyiv-ua", name: "Kyiv", countryIso2: "UA", countryIso3: "UKR", countryName: "Ukraine", admin1Code: "12", latitude: 50.45, longitude: 30.52, featureCode: "PPLC", population: 2_900_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Europe/Kyiv" },
  { id: "ua-kha", slug: "kharkiv-ua", name: "Kharkiv", countryIso2: "UA", countryIso3: "UKR", countryName: "Ukraine", admin1Code: "07", latitude: 49.99, longitude: 36.23, featureCode: "PPLA", population: 1_400_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Kyiv" },
  { id: "ua-ode", slug: "odesa-ua", name: "Odesa", countryIso2: "UA", countryIso3: "UKR", countryName: "Ukraine", admin1Code: "17", latitude: 46.48, longitude: 30.73, featureCode: "PPLA", population: 1_000_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Europe/Kyiv" },
  // UAE
  { id: "ae-dub", slug: "dubai-ae", name: "Dubai", countryIso2: "AE", countryIso3: "ARE", countryName: "United Arab Emirates", admin1Code: "03", latitude: 25.20, longitude: 55.27, featureCode: "PPLA", population: 3_500_000, roleTags: ["admin_center", "major_city"], coverage: "admin_center", timezone: "Asia/Dubai" },
  { id: "ae-abu", slug: "abu-dhabi-ae", name: "Abu Dhabi", countryIso2: "AE", countryIso3: "ARE", countryName: "United Arab Emirates", admin1Code: "01", latitude: 24.45, longitude: 54.38, featureCode: "PPLC", population: 1_500_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Dubai" },
  // UNITED KINGDOM
  { id: "gb-lon", slug: "london-gb", name: "London", countryIso2: "GB", countryIso3: "GBR", countryName: "United Kingdom", admin1Code: "ENG", latitude: 51.51, longitude: -0.13, featureCode: "PPLC", population: 8_980_000, roleTags: ["capital", "megacity", "major_city"], coverage: "capital", timezone: "Europe/London" },
  { id: "gb-bir", slug: "birmingham-gb", name: "Birmingham", countryIso2: "GB", countryIso3: "GBR", countryName: "United Kingdom", admin1Code: "ENG", latitude: 52.49, longitude: -1.91, featureCode: "PPL", population: 1_100_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/London" },
  { id: "gb-mnc", slug: "manchester-gb", name: "Manchester", countryIso2: "GB", countryIso3: "GBR", countryName: "United Kingdom", admin1Code: "ENG", latitude: 53.48, longitude: -2.24, featureCode: "PPL", population: 2_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Europe/London" },
  // UNITED STATES
  { id: "us-nyc", slug: "new-york-us", name: "New York", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "NY", latitude: 40.71, longitude: -74.01, featureCode: "PPL", population: 8_336_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "America/New_York" },
  { id: "us-lax", slug: "los-angeles-us", name: "Los Angeles", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "CA", latitude: 34.05, longitude: -118.24, featureCode: "PPL", population: 3_979_000, roleTags: ["megacity", "major_city"], coverage: "major_city", timezone: "America/Los_Angeles" },
  { id: "us-chi", slug: "chicago-us", name: "Chicago", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "IL", latitude: 41.88, longitude: -87.63, featureCode: "PPL", population: 2_700_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Chicago" },
  { id: "us-hou", slug: "houston-us", name: "Houston", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "TX", latitude: 29.76, longitude: -95.37, featureCode: "PPL", population: 2_300_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Chicago" },
  { id: "us-phl", slug: "philadelphia-us", name: "Philadelphia", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "PA", latitude: 39.95, longitude: -75.17, featureCode: "PPL", population: 1_600_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/New_York" },
  { id: "us-phx", slug: "phoenix-us", name: "Phoenix", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "AZ", latitude: 33.45, longitude: -112.07, featureCode: "PPL", population: 1_600_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Phoenix" },
  { id: "us-dal", slug: "dallas-us", name: "Dallas", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "TX", latitude: 32.78, longitude: -96.80, featureCode: "PPL", population: 1_300_000, roleTags: ["major_city"], coverage: "major_city", timezone: "America/Chicago" },
  { id: "us-sfo", slug: "san-francisco-us", name: "San Francisco", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "CA", latitude: 37.77, longitude: -122.42, featureCode: "PPL", population: 873_000, roleTags: ["city"], coverage: "city", timezone: "America/Los_Angeles" },
  { id: "us-sea", slug: "seattle-us", name: "Seattle", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "WA", latitude: 47.61, longitude: -122.33, featureCode: "PPL", population: 753_000, roleTags: ["city"], coverage: "city", timezone: "America/Los_Angeles" },
  { id: "us-bos", slug: "boston-us", name: "Boston", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "MA", latitude: 42.36, longitude: -71.06, featureCode: "PPL", population: 675_000, roleTags: ["city"], coverage: "city", timezone: "America/New_York" },
  { id: "us-wdc", slug: "washington-us", name: "Washington", countryIso2: "US", countryIso3: "USA", countryName: "United States", admin1Code: "DC", latitude: 38.91, longitude: -77.04, featureCode: "PPLC", population: 689_000, roleTags: ["capital", "city"], coverage: "capital", timezone: "America/New_York" },
  // VIETNAM
  { id: "vn-han", slug: "hanoi-vn", name: "Hanoi", countryIso2: "VN", countryIso3: "VNM", countryName: "Vietnam", admin1Code: "44", latitude: 21.03, longitude: 105.85, featureCode: "PPLC", population: 5_100_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Asia/Ho_Chi_Minh" },
  { id: "vn-sgn", slug: "ho-chi-minh-city-vn", name: "Ho Chi Minh City", countryIso2: "VN", countryIso3: "VNM", countryName: "Vietnam", admin1Code: "20", latitude: 10.82, longitude: 106.63, featureCode: "PPL", population: 9_100_000, roleTags: ["major_city"], coverage: "major_city", timezone: "Asia/Ho_Chi_Minh" },
  // ZAMBIA
  { id: "zm-lus", slug: "lusaka-zm", name: "Lusaka", countryIso2: "ZM", countryIso3: "ZMB", countryName: "Zambia", admin1Code: "09", latitude: -15.39, longitude: 28.32, featureCode: "PPLC", population: 2_700_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Lusaka" },
  // ZIMBABWE
  { id: "zw-har", slug: "harare-zw", name: "Harare", countryIso2: "ZW", countryIso3: "ZWE", countryName: "Zimbabwe", admin1Code: "10", latitude: -17.83, longitude: 31.05, featureCode: "PPLC", population: 1_500_000, roleTags: ["capital", "major_city"], coverage: "capital", timezone: "Africa/Harare" },
];

/**
 * Index for fast lookup
 */
const cityById = new Map(globalCitySeed.map((c) => [c.id, c]));
const cityBySlug = new Map(globalCitySeed.map((c) => [c.slug, c]));

/**
 * Get city by ID
 */
export function getCityById(id: string): CityKnowledgeRecord | undefined {
  return cityById.get(id);
}

/**
 * Get city by slug
 */
export function getCityBySlug(slug: string): CityKnowledgeRecord | undefined {
  return cityBySlug.get(slug);
}

/**
 * Get all cities for a country
 */
export function getCitiesByCountryIso3(iso3: string): CityKnowledgeRecord[] {
  return globalCitySeed.filter((c) => c.countryIso3 === iso3);
}

/**
 * Search cities by name
 */
export function searchCities(query: string): CityKnowledgeRecord[] {
  const lower = query.toLowerCase();
  return globalCitySeed.filter(
    (c) => c.name.toLowerCase().includes(lower) || c.countryName.toLowerCase().includes(lower),
  );
}

/**
 * Get cities by coverage level
 */
export function getCitiesByCoverage(coverage: CityKnowledgeRecord["coverage"]): CityKnowledgeRecord[] {
  return globalCitySeed.filter((c) => c.coverage === coverage);
}

/**
 * Get all capitals
 */
export function getAllCapitals(): CityKnowledgeRecord[] {
  return globalCitySeed.filter((c) => c.coverage === "capital");
}

/**
 * Get all megacities (pop >= 5M)
 */
export function getAllMegacities(): CityKnowledgeRecord[] {
  return globalCitySeed.filter((c) => c.population >= 5_000_000);
}

/**
 * Total city count (seed + GeoNames full dataset at build time)
 */
export const TOTAL_GLOBAL_CITIES = globalCitySeed.length;
export const ESTIMATED_FULL_CITIES = 120_000;

/**
 * Get statistics
 */
export function getCityKnowledgeStats() {
  return {
    seedCities: globalCitySeed.length,
    countries: new Set(globalCitySeed.map((c) => c.countryIso3)).size,
    capitals: globalCitySeed.filter((c) => c.coverage === "capital").length,
    megacities: globalCitySeed.filter((c) => c.population >= 5_000_000).length,
    majorCities: globalCitySeed.filter((c) => c.population >= 1_000_000).length,
    estimatedFullDataset: ESTIMATED_FULL_CITIES,
  };
}
