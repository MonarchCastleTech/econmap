import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { XMLParser } from "fast-xml-parser";
import sharp from "sharp";

type SupportedLocalLayerId = "true-color" | "night-lights" | "clouds";

type GibsLayerSeed = {
  attribution: string[];
  id: SupportedLocalLayerId;
  remoteLayerId: string;
};

type ParsedGibsLayer = {
  attribution: string[];
  defaultDate: string;
  fileExtension: string;
  format: string;
  id: SupportedLocalLayerId;
  remoteLayerId: string;
  template: string;
  tileMatrixSet: string;
};

type GibsTileJob = {
  outputFile: string;
  url: string;
  x: number;
  y: number;
  z: number;
};

type DownloadGibsImageryOptions = {
  capabilitiesUrl?: string;
  concurrency?: number;
  date?: string;
  destinationRootDir?: string;
  fetchImpl?: typeof fetch;
  force?: boolean;
  layers?: SupportedLocalLayerId[];
  logger?: Pick<Console, "log" | "warn">;
  maxZoom?: number;
  minZoom?: number;
};

const DEFAULT_CAPABILITIES_URL =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml";
const DEFAULT_DESTINATION_ROOT_DIR = path.join(process.cwd(), "data", "raw", "globe-imagery");
const DEFAULT_MIN_ZOOM = 0;
const DEFAULT_MAX_ZOOM = 3;
const DEFAULT_CONCURRENCY = 6;
const WEB_MERCATOR_WORLD_BBOX = "-20037508.34278925,-20037508.34278925,20037508.34278925,20037508.34278925";
const GIBS_WMS_BASE_URL = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi";

const GIBS_LAYER_SEEDS: GibsLayerSeed[] = [
  {
    id: "true-color",
    remoteLayerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
    attribution: ["NASA GIBS"],
  },
  {
    id: "night-lights",
    remoteLayerId: "VIIRS_Black_Marble",
    attribution: ["NASA Black Marble"],
  },
  {
    id: "clouds",
    remoteLayerId: "MODIS_Terra_Cloud_Fraction_Day",
    attribution: ["NASA GIBS"],
  },
];

function getFileExtensionFromFormat(format: string) {
  switch (format) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      throw new Error(`Unsupported GIBS imagery format: ${format}`);
  }
}

export function parseGibsCapabilities(xml: string): Record<SupportedLocalLayerId, ParsedGibsLayer> {
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
  });
  const document = parser.parse(xml) as {
    Capabilities?: {
      Contents?: {
        Layer?: Array<Record<string, unknown>> | Record<string, unknown>;
      };
    };
  };
  const layerNodes = document.Capabilities?.Contents?.Layer;
  const layers = Array.isArray(layerNodes) ? layerNodes : layerNodes ? [layerNodes] : [];

  const parsedEntries = GIBS_LAYER_SEEDS.map((seed) => {
    const layer = layers.find((candidate) => candidate["ows:Identifier"] === seed.remoteLayerId);
    if (!layer) {
      throw new Error(`Layer ${seed.remoteLayerId} is missing from the NASA GIBS capabilities document.`);
    }

    const resourceNodes = layer.ResourceURL;
    const resourceList = Array.isArray(resourceNodes) ? resourceNodes : resourceNodes ? [resourceNodes] : [];
    const tileResource = resourceList.find(
      (resource): resource is { format?: string; template?: string } =>
        Boolean(resource) &&
        typeof resource === "object" &&
        "template" in resource &&
        "format" in resource,
    );
    if (!tileResource?.format || !tileResource.template) {
      throw new Error(`Unable to parse ${seed.remoteLayerId} resource template from WMTS capabilities.`);
    }

    const dimensionNodes = layer.Dimension;
    const dimensionList = Array.isArray(dimensionNodes) ? dimensionNodes : dimensionNodes ? [dimensionNodes] : [];
    const timeDimension = dimensionList.find(
      (dimension): dimension is { Default?: string; ["ows:Identifier"]?: string } =>
        Boolean(dimension) &&
        typeof dimension === "object" &&
        dimension["ows:Identifier"] === "Time",
    );
    if (!timeDimension?.Default) {
      throw new Error(`Unable to parse ${seed.remoteLayerId} default time from WMTS capabilities.`);
    }

    const tileMatrixSetLink = layer.TileMatrixSetLink as { TileMatrixSet?: string } | undefined;
    if (!tileMatrixSetLink?.TileMatrixSet) {
      throw new Error(`Unable to parse ${seed.remoteLayerId} tile matrix set from WMTS capabilities.`);
    }

    return [
      seed.id,
      {
        id: seed.id,
        remoteLayerId: seed.remoteLayerId,
        attribution: seed.attribution,
        defaultDate: timeDimension.Default,
        fileExtension: getFileExtensionFromFormat(tileResource.format),
        format: tileResource.format,
        template: tileResource.template,
        tileMatrixSet: tileMatrixSetLink.TileMatrixSet,
      } satisfies ParsedGibsLayer,
    ] as const;
  });

  return Object.fromEntries(parsedEntries) as Record<SupportedLocalLayerId, ParsedGibsLayer>;
}

export function buildGibsTileJobs({
  date,
  destinationRootDir,
  fileExtension,
  localLayerId,
  maxZoom,
  minZoom,
  template,
  tileMatrixSet,
}: {
  date: string;
  destinationRootDir: string;
  fileExtension: string;
  localLayerId: SupportedLocalLayerId;
  maxZoom: number;
  minZoom: number;
  template: string;
  tileMatrixSet: string;
}) {
  const jobs: GibsTileJob[] = [];

  for (let z = minZoom; z <= maxZoom; z += 1) {
    const tilesPerAxis = 2 ** z;

    for (let y = 0; y < tilesPerAxis; y += 1) {
      for (let x = 0; x < tilesPerAxis; x += 1) {
        jobs.push({
          z,
          x,
          y,
          url: template
            .replace("{Time}", date)
            .replace("{TileMatrixSet}", tileMatrixSet)
            .replace("{TileMatrix}", String(z))
            .replace("{TileRow}", String(y))
            .replace("{TileCol}", String(x)),
          outputFile: path.join(
            destinationRootDir,
            localLayerId,
            date,
            String(z),
            String(x),
            `${y}.${fileExtension}`,
          ),
        });
      }
    }
  }

  return jobs;
}

export function getSnapshotDimensionsForMaxZoom(maxZoom: number) {
  const edgeLength = 256 * 2 ** maxZoom;
  return {
    width: edgeLength,
    height: edgeLength,
  };
}

export function buildGibsWmsGetMapUrl({
  date,
  format,
  height,
  remoteLayerId,
  width,
}: {
  date: string;
  format: string;
  height: number;
  remoteLayerId: string;
  width: number;
}) {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.1.1",
    LAYERS: remoteLayerId,
    STYLES: "",
    FORMAT: format,
    SRS: "EPSG:3857",
    BBOX: WEB_MERCATOR_WORLD_BBOX,
    WIDTH: String(width),
    HEIGHT: String(height),
    TIME: date,
  });

  return `${GIBS_WMS_BASE_URL}?${params.toString()}`;
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadTileJob(
  job: GibsTileJob,
  {
    fetchImpl,
    force,
  }: {
    fetchImpl: typeof fetch;
    force: boolean;
  },
) {
  if (!force && (await fileExists(job.outputFile))) {
    return "skipped";
  }

  const response = await fetchImpl(job.url);
  if (!response.ok) {
    throw new Error(`Failed to download ${job.url}: ${response.status} ${response.statusText}`);
  }

  await fs.mkdir(path.dirname(job.outputFile), { recursive: true });
  await fs.writeFile(job.outputFile, Buffer.from(await response.arrayBuffer()));
  return "downloaded";
}

async function runTileDownloads(
  jobs: GibsTileJob[],
  {
    concurrency,
    fetchImpl,
    force,
    logger,
  }: {
    concurrency: number;
    fetchImpl: typeof fetch;
    force: boolean;
    logger: Pick<Console, "log" | "warn">;
  },
) {
  let index = 0;
  let completed = 0;

  const worker = async () => {
    while (index < jobs.length) {
      const currentJob = jobs[index];
      index += 1;

      await downloadTileJob(currentJob, { fetchImpl, force });
      completed += 1;

      if (completed % 25 === 0 || completed === jobs.length) {
        logger.log(`  Downloaded ${completed}/${jobs.length} imagery tiles...`);
      }
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, jobs.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

async function rasterizeSnapshotToTiles({
  date,
  destinationRootDir,
  fileExtension,
  force,
  localLayerId,
  logger,
  maxZoom,
  minZoom,
  snapshotBuffer,
}: {
  date: string;
  destinationRootDir: string;
  fileExtension: string;
  force: boolean;
  localLayerId: SupportedLocalLayerId;
  logger: Pick<Console, "log" | "warn">;
  maxZoom: number;
  minZoom: number;
  snapshotBuffer: Buffer;
}) {
  const layerDateDir = path.join(destinationRootDir, localLayerId, date);
  if (force) {
    await fs.rm(layerDateDir, { force: true, recursive: true });
  }

  await fs.mkdir(layerDateDir, { recursive: true });

  for (let z = minZoom; z <= maxZoom; z += 1) {
    const tileCountPerAxis = 2 ** z;
    const zoomWorldSize = 256 * tileCountPerAxis;
    const resizedImageBuffer = await sharp(snapshotBuffer)
      .resize(zoomWorldSize, zoomWorldSize, {
        fit: "fill",
      })
      .toBuffer();

    for (let x = 0; x < tileCountPerAxis; x += 1) {
      const xDir = path.join(layerDateDir, String(z), String(x));
      await fs.mkdir(xDir, { recursive: true });

      for (let y = 0; y < tileCountPerAxis; y += 1) {
        const tileFile = path.join(xDir, `${y}.${fileExtension}`);
        if (!force && (await fileExists(tileFile))) {
          continue;
        }

        await sharp(resizedImageBuffer)
          .extract({
            left: x * 256,
            top: y * 256,
            width: 256,
            height: 256,
          })
          .toFile(tileFile);
      }
    }

    logger.log(`  Tiled ${localLayerId} snapshot for zoom ${z}.`);
  }
}

async function writeLayerMetadata({
  layer,
  date,
  destinationRootDir,
  maxZoom,
  minZoom,
}: {
  date: string;
  destinationRootDir: string;
  layer: ParsedGibsLayer;
  maxZoom: number;
  minZoom: number;
}) {
  const metadataFile = path.join(destinationRootDir, layer.id, "metadata.json");
  let existingMetadata: Record<string, unknown> | null = null;

  if (await fileExists(metadataFile)) {
    existingMetadata = JSON.parse(await fs.readFile(metadataFile, "utf-8")) as Record<string, unknown>;
  }

  const availableDates = Array.from(
    new Set([...(Array.isArray(existingMetadata?.availableDates) ? existingMetadata.availableDates : []), date]),
  ).sort((left, right) => String(left).localeCompare(String(right)));

  await fs.mkdir(path.dirname(metadataFile), { recursive: true });
  await fs.writeFile(
    metadataFile,
    JSON.stringify(
      {
        downloadedAt: new Date().toISOString(),
        remoteLayerId: layer.remoteLayerId,
        availableDates,
        minZoom,
        maxZoom,
        tileMatrixSet: layer.tileMatrixSet,
        format: layer.format,
        sourceLabels: layer.attribution,
      },
      null,
      2,
    ),
  );
}

function parseArgs(argv: string[]) {
  const parsed: Record<string, string | boolean> = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [key, value] = arg.slice(2).split("=", 2);
    parsed[key] = value ?? true;
  }

  return parsed;
}

export async function downloadGibsImagery(options: DownloadGibsImageryOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;
  const capabilitiesUrl = options.capabilitiesUrl ?? DEFAULT_CAPABILITIES_URL;
  const destinationRootDir = options.destinationRootDir ?? DEFAULT_DESTINATION_ROOT_DIR;
  const minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
  const maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const force = options.force ?? false;
  const layersToDownload = options.layers ?? GIBS_LAYER_SEEDS.map((seed) => seed.id);

  logger.log(`Fetching NASA GIBS capabilities from ${capabilitiesUrl}...`);
  const capabilitiesResponse = await fetchImpl(capabilitiesUrl);
  if (!capabilitiesResponse.ok) {
    throw new Error(
      `Unable to fetch NASA GIBS capabilities: ${capabilitiesResponse.status} ${capabilitiesResponse.statusText}`,
    );
  }

  const parsedLayers = parseGibsCapabilities(await capabilitiesResponse.text());
  const selectedLayers = layersToDownload.map((layerId) => parsedLayers[layerId]);

  for (const layer of selectedLayers) {
    const date = options.date ?? layer.defaultDate;
    logger.log(`Downloading ${layer.id} (${layer.remoteLayerId}) for ${date} at zoom ${minZoom}-${maxZoom}...`);

    const { width, height } = getSnapshotDimensionsForMaxZoom(maxZoom);
    const snapshotUrl = buildGibsWmsGetMapUrl({
      date,
      format: layer.format,
      height,
      remoteLayerId: layer.remoteLayerId,
      width,
    });
    const snapshotResponse = await fetchImpl(snapshotUrl);
    if (!snapshotResponse.ok) {
      throw new Error(
        `Failed to download ${snapshotUrl}: ${snapshotResponse.status} ${snapshotResponse.statusText}`,
      );
    }

    const snapshotBuffer = Buffer.from(await snapshotResponse.arrayBuffer());
    await rasterizeSnapshotToTiles({
      date,
      destinationRootDir,
      fileExtension: layer.fileExtension,
      force,
      localLayerId: layer.id,
      logger,
      maxZoom,
      minZoom,
      snapshotBuffer,
    });
    await writeLayerMetadata({
      date,
      destinationRootDir,
      layer,
      maxZoom,
      minZoom,
    });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await downloadGibsImagery({
    concurrency: args.concurrency ? Number(args.concurrency) : undefined,
    date: typeof args.date === "string" ? args.date : undefined,
    force: Boolean(args.force),
    layers:
      typeof args.layers === "string"
        ? (args.layers.split(",").map((layerId) => layerId.trim()) as SupportedLocalLayerId[])
        : undefined,
    maxZoom: args.maxZoom ? Number(args.maxZoom) : undefined,
    minZoom: args.minZoom ? Number(args.minZoom) : undefined,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error("[MapFactbook] Failed to download offline GIBS imagery.", error);
    process.exitCode = 1;
  });
}
