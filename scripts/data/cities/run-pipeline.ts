import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { ingestRegistry } from "./ingest-registry";
import { fetchCitySources } from "./fetch-sources";
import { resolveEntities } from "./resolve-entities";
import { generateArtifacts } from "./generate-artifacts";
import { generateGlobeArtifacts } from "./generate-globe-artifacts";
import { assertRequiredBulkSourcesExist } from "./bulk-source-manifest";

const execFileAsync = promisify(execFile);

type PipelineDependencies = {
  assertRequiredBulkSourcesExist: typeof assertRequiredBulkSourcesExist;
  ingestRegistry: typeof ingestRegistry;
  fetchCitySources: typeof fetchCitySources;
  resolveEntities: typeof resolveEntities;
  generateArtifacts: typeof generateArtifacts;
  runArtifactGenerator: (scriptPath: string) => Promise<void>;
  generateGlobeArtifacts: typeof generateGlobeArtifacts;
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
};

export async function runPipeline(dependencies: PipelineDependencies = defaultDependencies) {
  dependencies.assertRequiredBulkSourcesExist();
  await dependencies.ingestRegistry();
  await dependencies.fetchCitySources({ forceRebuild: true });
  await dependencies.resolveEntities({ forceRebuild: true });
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
    await runPipeline();
    console.log("=== Pipeline completed successfully! ===");
  } catch (err) {
    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
