import assert from "node:assert/strict";

import Home from "@/app/page";
import { HomeShell } from "@/features/home/components/home-shell";
import { InfosPanel } from "@/features/home/components/layout/infos-panel";
import { TacticalSidebar } from "@/features/home/components/layout/tactical-sidebar";

type VerifyWorkspaceMetric = {
  indicatorId: string;
};

type VerifyWorkspace = {
  economicIntel?: VerifyWorkspaceMetric[];
  environmentIntel?: VerifyWorkspaceMetric[];
  organizationIntel?: VerifyWorkspaceMetric[];
  telecomIntel?: VerifyWorkspaceMetric[];
  transportIntel?: VerifyWorkspaceMetric[];
  utilitiesIntel?: VerifyWorkspaceMetric[];
  entityCounts?: Record<string, number | undefined>;
};

type ReactElementLike = {
  props?: {
    children?: unknown;
    [key: string]: unknown;
  };
  type?: unknown;
};

function isElementLike(value: unknown): value is ReactElementLike {
  return Boolean(value) && typeof value === "object" && "type" in (value as Record<string, unknown>);
}

function visitTree(node: unknown, visitor: (element: ReactElementLike) => void) {
  if (Array.isArray(node)) {
    node.forEach((item) => visitTree(item, visitor));
    return;
  }

  if (!isElementLike(node)) {
    return;
  }

  visitor(node);
  visitTree(node.props?.children, visitor);
}

function findElementByType(root: unknown, type: unknown) {
  let match: ReactElementLike | null = null;

  visitTree(root, (element) => {
    if (!match && element.type === type) {
      match = element;
    }
  });

  return match;
}

function hasElementTypeName(root: unknown, typeName: string) {
  let found = false;

  visitTree(root, (element) => {
    if (found) {
      return;
    }

    const candidateType = element.type as { displayName?: string; name?: string } | string | undefined;
    const resolvedName =
      typeof candidateType === "string"
        ? candidateType
        : candidateType?.displayName ?? candidateType?.name ?? "";

    if (resolvedName === typeName) {
      found = true;
    }
  });

  return found;
}

function collectExpectedMetricLabels(workspace: NonNullable<any>) {
  const labels = new Set<string>();
  const canonicalMetrics = [
    ...(workspace.economicIntel ?? []),
    ...(workspace.transportIntel ?? []),
    ...(workspace.utilitiesIntel ?? []),
    ...(workspace.telecomIntel ?? []),
    ...(workspace.environmentIntel ?? []),
    ...(workspace.organizationIntel ?? []),
  ];

  if (canonicalMetrics.some((metric: { indicatorId: string }) => metric.indicatorId === "population")) {
    labels.add("Population");
  }

  if (
    canonicalMetrics.some((metric: { indicatorId: string }) =>
      /(^|-)gdp($|-)|gross-domestic|economic-output/i.test(metric.indicatorId),
    )
  ) {
    labels.add("GDP");
  }

  if (canonicalMetrics.some((metric: { indicatorId: string }) => metric.indicatorId === "telecom")) {
    labels.add("Telecom");
  }

  if (canonicalMetrics.some((metric: { indicatorId: string }) => metric.indicatorId === "environment")) {
    labels.add("Environment");
  }

  if (canonicalMetrics.some((metric: { indicatorId: string }) => metric.indicatorId === "organizations")) {
    labels.add("Organizations");
  }

  return labels;
}

function collectExpectedInfrastructureLabels(workspace: NonNullable<any>) {
  const labels = new Set<string>();
  const entityCounts = workspace.entityCounts ?? {};

  if ((entityCounts.airport ?? 0) > 0) {
    labels.add("Airports");
  }

  if ((entityCounts.port ?? 0) > 0) {
    labels.add("Ports");
  }

  if ((entityCounts.utility ?? 0) > 0) {
    labels.add("Utilities");
  }

  if ((entityCounts.research ?? 0) > 0) {
    labels.add("Organizations");
  }

  return labels;
}

async function main() {
  // Static export: the home page no longer reads searchParams server-side; it
  // always renders the default analyst surface (featured city preselected).
  const pageElement = (await Home()) as ReactElementLike;
  const pageProps = (pageElement.props ?? {}) as ReactElementLike["props"] & {
    cityFootprintCatalog?: {
      cities?: unknown[];
      selectionAssetPath?: string;
    };
    selectedCityPanel?: unknown;
  };

  assert.equal(pageElement.type, HomeShell, "page should render HomeShell");
  assert.ok(pageProps.cityFootprintCatalog?.selectionAssetPath, "page should pass city footprint selection");
  assert.ok(
    Array.isArray(pageProps.cityFootprintCatalog?.cities),
    "page should pass the full city footprint catalog",
  );
  assert.ok(pageProps.selectedCityPanel, "blank homepage should preload a selected city panel");

  const shellTree = HomeShell(pageProps as Parameters<typeof HomeShell>[0]);
  const sidebarElement = findElementByType(shellTree, TacticalSidebar) as ReactElementLike | null;
  const infosElement = findElementByType(shellTree, InfosPanel) as ReactElementLike | null;

  assert.ok(sidebarElement, "HomeShell should render TacticalSidebar");
  assert.ok(infosElement, "HomeShell should render InfosPanel");
  assert.ok(!hasElementTypeName(shellTree, "TopControlCluster"), "top-right control cluster should be absent");

  const sidebarProps = (sidebarElement?.props ?? {}) as any;
  const sectionTitles = sidebarProps.sections.map((section: { title: string }) => section.title);
  const requiredSectionTitles = [
    "Borders & Labels",
    "Transport",
    "Utilities",
    "Connectivity",
    "Environment",
    "Economy / Institutions",
  ];

  requiredSectionTitles.forEach((title) => {
    assert.ok(sectionTitles.includes(title), `sidebar should include ${title}`);
  });

  assert.equal(sidebarProps.datasetWorkspaceSummary.label, "Dataset explorer");
  assert.deepEqual(sidebarProps.featuredCities, []);
  assert.deepEqual(sidebarProps.productLinks, []);

  const selectedCityIntel = sidebarProps.selectedCityIntel;
  assert.equal(selectedCityIntel.kind, "selected-city", "blank homepage should open with a city brief");
  assert.ok(selectedCityIntel.sourceLabels.length > 0, "city brief should expose visible source labels");

  const workspace = (pageProps.selectedCityPanel as { workspace?: VerifyWorkspace | null })?.workspace ?? null;
  assert.ok(workspace, "selected city should include a workspace");

  const metricLabels = new Set(selectedCityIntel.metricRows.map((row: { label: string }) => row.label));
  const infrastructureLabels = new Set(
    selectedCityIntel.infrastructureRows.map((row: { label: string }) => row.label),
  );

  collectExpectedMetricLabels(workspace).forEach((label) => {
    assert.ok(metricLabels.has(label), `city brief metric rows should include ${label}`);
  });

  collectExpectedInfrastructureLabels(workspace).forEach((label) => {
    assert.ok(infrastructureLabels.has(label), `city brief infrastructure rows should include ${label}`);
  });

  console.log(
    JSON.stringify(
      {
        selectedCity: selectedCityIntel.cityName,
        selectedCitySlug: "featured-default",
        selectedCityId: (pageProps.selectedCityPanel as { city?: { cityId?: string } })?.city?.cityId,
        metricRows: selectedCityIntel.metricRows.map((row: { label: string }) => row.label),
        infrastructureRows: selectedCityIntel.infrastructureRows.map((row: { label: string }) => row.label),
        workspaceMetricIds: [
          ...(workspace.economicIntel ?? []),
          ...(workspace.transportIntel ?? []),
          ...(workspace.utilitiesIntel ?? []),
          ...(workspace.telecomIntel ?? []),
          ...(workspace.environmentIntel ?? []),
          ...(workspace.organizationIntel ?? []),
        ].map((metric) => metric.indicatorId),
        workspaceEntityCounts: workspace.entityCounts ?? {},
        sectionTitles,
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
