import { generateArtifacts } from "./generate-artifacts";
import { generateGlobeArtifacts } from "./generate-globe-artifacts";

async function main() {
  console.log("=== Regenerating homepage artifacts ===");
  await generateArtifacts({ skipPerCityOutputs: true });
  await generateGlobeArtifacts();
  console.log("=== Homepage artifacts regenerated successfully ===");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
