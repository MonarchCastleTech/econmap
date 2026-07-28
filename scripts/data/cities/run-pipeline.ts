import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { ingestRegistry } from "./ingest-registry";
import { fetchCitySources } from "./fetch-sources";
import { resolveEntities } from "./resolve-entities";
import { generateArtifacts } from "./generate-artifacts";
import { generateGlobeArtifacts } from "./generate-globe-artifacts";
import { assertRequiredBulkSourcesExist } from "./bulk-source-manifest";

const execFileAsync = promisify(execFile);
const CHECKPOINT_FILE = path.join(
  process.cwd(),
  "data",
  "raw",
  "cities",
  "pipeline-checkpoint.json",
);

type PipelineCheckpoint = {
  schemaVersion: "1";
  totalCityCount: number;
  batchSize: number;
  completedOffsets: number[];
  failedOffsets: number[];
};

type RunPipelineOptions = {
  batchSize?: number;
  resume?: boolean;
};

export function isCanonicalCity(city: { placeClass?: string }) {
  return city.placeClass !== "subordinate_place";
}

export function parseRunPipelineOptions(args: string[]): RunPipelineOptions {
  const options: RunPipelineOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--resume") {
      options.resume = true;
      continue;
    }

    if (args[index] === "--batch-size") {
      const batchSize = Number.parseInt(args[index + 1] ?? "", 10);
      if (!Number.isFinite(batchSize) || batchSize < 1) {
        throw new Error("--batch-size requires a positive integer");
      }
      options.batchSize = batchSize;
      index += 1;
    }
  }

  return options;
}

type PipelineDependencies = {
  assertRequiredBulkSourcesExist: typeof assertRequiredBulkSourcesExist;
  ingestRegistry: typeof ingestRegistry;
  fetchCitySources: typeof fetchCitySources;
  resolveEntities: typeof resolveEntities;
  generateArtifacts: typeof generateArtifacts;
  runArtifactGenerator: (scriptPath: string) => Promise<void>;
  generateGlobeArtifacts: typeof generateGlobeArtifacts;
  loadCheckpoint?: () => Promise<PipelineCheckpoint | null>;
  saveCheckpoint?: (checkpoint: PipelineCheckpoint) => Promise<void>;
};

const defaultDependencies: PipelineDependencies = {
  assertRequiredBulkSourcesExist,
  ingestRegistry,
  fetchCitySources,
  resolveEntities,
  generateArtifacts,
  runArtifactGenerator: async (scriptPath: string) => {
    const extension = path.extname(scriptPath).toLowerCase();

    if (extension === ".py") {
      await execFileAsync("python", [scriptPath], {
        cwd: process.cwd(),
        windowsHide: true,
      });
      return;
    }

    await execFileAsync("npx", ["tsx", scriptPath], {
      cwd: process.cwd(),
      windowsHide: true,
    });
  },
  generateGlobeArtifacts,
  loadCheckpoint: async () => {
    try {
      return JSON.parse(await fs.readFile(CHECKPOINT_FILE, "utf8")) as PipelineCheckpoint;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  },
  saveCheckpoint: async (checkpoint) => {
    await fs.mkdir(path.dirname(CHECKPOINT_FILE), { recursive: true });
    await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  },
};

export async function runPipeline(
  dependencies: PipelineDependencies = defaultDependencies,
  options: RunPipelineOptions = {},
) {
  dependencies.assertRequiredBulkSourcesExist();
  const registry = await dependencies.ingestRegistry();

  if (options.batchSize != null) {
    const batchSize = Math.max(1, Math.trunc(options.batchSize));
    const totalCityCount = registry.filter(isCanonicalCity).length;
    const loaded = options.resume
      ? await dependencies.loadCheckpoint?.()
      : null;
    const checkpoint: PipelineCheckpoint =
      loaded?.schemaVersion === "1" &&
      loaded.totalCityCount === totalCityCount &&
      loaded.batchSize === batchSize
        ? loaded
        : {
            schemaVersion: "1",
            totalCityCount,
            batchSize,
            completedOffsets: [],
            failedOffsets: [],
          };

    for (let offset = 0; offset < totalCityCount; offset += batchSize) {
      if (checkpoint.completedOffsets.includes(offset)) continue;
      const maxCities = Math.min(batchSize, totalCityCount - offset);

      try {
        await dependencies.fetchCitySources({
          cityFilter: isCanonicalCity,
          cityOffset: offset,
          maxCities,
          forceRebuild: !options.resume && offset === 0,
        });
        checkpoint.completedOffsets = [...checkpoint.completedOffsets, offset].sort((a, b) => a - b);
        checkpoint.failedOffsets = checkpoint.failedOffsets.filter((value) => value !== offset);
        await dependencies.saveCheckpoint?.(checkpoint);
      } catch (error) {
        checkpoint.failedOffsets = Array.from(new Set([...checkpoint.failedOffsets, offset])).sort(
          (a, b) => a - b,
        );
        await dependencies.saveCheckpoint?.(checkpoint);
        throw error;
      }
    }

    await dependencies.resolveEntities({ forceRebuild: !options.resume });
  } else {
    await dependencies.fetchCitySources({
      cityFilter: isCanonicalCity,
      forceRebuild: true,
    });
    await dependencies.resolveEntities({ forceRebuild: true });
  }

  await dependencies.generateArtifacts();
  await dependencies.runArtifactGenerator(
    path.join(process.cwd(), "scripts", "data", "cities", "generate-connectivity-artifacts.py"),
  );
  await dependencies.runArtifactGenerator(
    path.join(process.cwd(), "scripts", "data", "cities", "generate-environment-artifacts.py"),
  );
  await dependencies.runArtifactGenerator(
    path.join(process.cwd(), "scripts", "data", "cities", "generate-economic-coverage-artifacts.py"),
  );
  await dependencies.runArtifactGenerator(
    path.join(process.cwd(), "scripts", "data", "cities", "generate-mobility-artifacts.ts"),
  );
  await dependencies.generateGlobeArtifacts();
}

async function main() {
  console.log("=== MapFactbook City Data Pipeline ===");
  try {
    await runPipeline(defaultDependencies, parseRunPipelineOptions(process.argv.slice(2)));
    console.log("=== Pipeline completed successfully! ===");
  } catch (err) {
    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
