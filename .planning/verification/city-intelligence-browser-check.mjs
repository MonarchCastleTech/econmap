import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  pathToFileURL("C:/Users/akgul/node_modules/playwright/index.mjs").href
);

const root = path.resolve(import.meta.dirname, "../..");
const baseUrl = "http://localhost:3001/econmap";
const outputDir = import.meta.dirname;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function layoutMetrics(page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
}

const alertFeed = readJson("public/data/cities/alerts.json");
const searchIndex = readJson("public/data/cities/search-index.json");
const alertsByCity = new Map();
for (const alert of alertFeed.alerts) {
  const current = alertsByCity.get(alert.cityId) ?? [];
  current.push(alert);
  alertsByCity.set(alert.cityId, current);
}

const alertCity = searchIndex
  .filter((city) => alertsByCity.has(city.cityId))
  .sort(
    (left, right) =>
      Number(right.isMajorCity) - Number(left.isMajorCity) ||
      (right.population ?? 0) - (left.population ?? 0),
  )[0];
assert(alertCity, "No alert city resolves through the canonical city search index");
const expectedAlert = alertsByCity.get(alertCity.cityId)[0];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultNavigationTimeout(90_000);
page.setDefaultTimeout(120_000);
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${baseUrl}/osint/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(/95,915 cities indexed/i).waitFor();

  const search = page.getByRole("textbox", { name: "Search cities" });
  await search.fill(`${alertCity.name} ${alertCity.countryIso3}`);
  const result = page
    .getByRole("button")
    .filter({ hasText: alertCity.name })
    .filter({ hasText: alertCity.countryIso3 })
    .first();
  await result.click();

  await page.getByRole("heading", { name: "Telecom and network evidence" }).waitFor();
  await page.getByRole("heading", { name: "City time machine" }).waitFor();
  await page.getByText("5G evidence unknown", { exact: true }).waitFor();
  await page
    .getByText(/No technology-specific regulator or operator observation is published/i)
    .waitFor();

  await page.getByRole("button", { name: "Hazards" }).click();
  await page.getByText(expectedAlert.title, { exact: true }).first().waitFor();
  await page.getByText(/USGS/i).first().waitFor();

  const saveButton = page.getByRole("button", {
    name: `Save ${alertCity.name}`,
  });
  await saveButton.click();
  await page.getByText("Saved city alerts", { exact: true }).waitFor();
  await page.getByText(expectedAlert.title, { exact: true }).first().waitFor();
  await page
    .getByRole("button", { name: `Remove ${alertCity.name} from saved cities` })
    .waitFor();

  const desktopLayout = await layoutMetrics(page);
  assert(
    desktopLayout.documentWidth <= desktopLayout.viewportWidth + 1,
    `Desktop OSINT page overflows: ${JSON.stringify(desktopLayout)}`,
  );
  await page.screenshot({
    path: path.join(outputDir, "city-intelligence-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const mobileLayout = await layoutMetrics(page);
  assert(
    mobileLayout.documentWidth <= mobileLayout.viewportWidth + 1,
    `Mobile OSINT page overflows: ${JSON.stringify(mobileLayout)}`,
  );
  await page.screenshot({
    path: path.join(outputDir, "city-intelligence-mobile.png"),
    fullPage: true,
  });

  const meaningfulConsoleErrors = consoleErrors.filter(
    (message) => !/Failed to load resource.*404|_rsc=/i.test(message),
  );
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);
  assert(
    meaningfulConsoleErrors.length === 0,
    `Console errors: ${meaningfulConsoleErrors.join(" | ")}`,
  );

  const resultSummary = {
    status: "passed",
    cityId: alertCity.cityId,
    city: alertCity.name,
    countryIso3: alertCity.countryIso3,
    alert: expectedAlert.title,
    desktopLayout,
    mobileLayout,
    pageErrors,
    ignoredStaticPrefetchErrors: consoleErrors.length - meaningfulConsoleErrors.length,
  };
  fs.writeFileSync(
    path.join(outputDir, "city-intelligence-browser-check.json"),
    `${JSON.stringify(resultSummary, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(resultSummary)}\n`);
} finally {
  await browser.close();
}
