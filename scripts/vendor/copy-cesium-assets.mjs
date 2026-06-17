import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const cesiumBuildDir = path.join(rootDir, "node_modules", "cesium", "Build", "Cesium");
const publicCesiumDir = path.join(rootDir, "public", "vendor", "cesium");

const assetFolders = ["Assets", "ThirdParty", "Widgets", "Workers"];

mkdirSync(publicCesiumDir, { recursive: true });

for (const folder of assetFolders) {
  cpSync(path.join(cesiumBuildDir, folder), path.join(publicCesiumDir, folder), {
    force: true,
    recursive: true,
  });
}

console.log(`Copied Cesium static assets to ${publicCesiumDir}`);
