// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

describe("runPipeline", () => {
  it("runs all city enrichment generators before publishing globe artifacts", async () => {
    const calls: string[] = [];

    const dependencies = {
      assertRequiredBulkSourcesExist: vi.fn(() => {
        calls.push("assert");
      }),
      ingestRegistry: vi.fn(async () => {
        calls.push("ingest");
      }),
      fetchCitySources: vi.fn(async (options?: unknown) => {
        calls.push(`fetch:${JSON.stringify(options)}`);
      }),
      resolveEntities: vi.fn(async (options?: unknown) => {
        calls.push(`resolve:${JSON.stringify(options)}`);
      }),
      generateArtifacts: vi.fn(async () => {
        calls.push("artifacts");
      }),
      runArtifactGenerator: vi.fn(async (scriptPath: string) => {
        calls.push(scriptPath.replace(/\\/g, "/").split("/").at(-1) ?? scriptPath);
      }),
      generateGlobeArtifacts: vi.fn(async () => {
        calls.push("globe");
      }),
    };

    const { runPipeline } = await import("./run-pipeline");

    await runPipeline(dependencies as unknown as Parameters<typeof runPipeline>[0]);

    expect(calls).toEqual([
      "assert",
      "ingest",
      'fetch:{"forceRebuild":true}',
      'resolve:{"forceRebuild":true}',
      "artifacts",
      "generate-connectivity-artifacts.py",
      "generate-environment-artifacts.py",
      "generate-economic-coverage-artifacts.py",
      "generate-mobility-artifacts.ts",
      "globe",
    ]);
    expect(dependencies.runArtifactGenerator).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("generate-connectivity-artifacts.py"),
    );
    expect(dependencies.runArtifactGenerator).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("generate-environment-artifacts.py"),
    );
    expect(dependencies.runArtifactGenerator).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("generate-economic-coverage-artifacts.py"),
    );
    expect(dependencies.runArtifactGenerator).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("generate-mobility-artifacts.ts"),
    );
  });
});
