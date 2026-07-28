// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

describe("runPipeline", () => {
  it("parses batch and resume CLI options", async () => {
    const pipelineModule = await import("./run-pipeline");
    const parse = (
      pipelineModule as typeof pipelineModule & {
        parseRunPipelineOptions?: (args: string[]) => unknown;
      }
    ).parseRunPipelineOptions;

    expect(parse?.(["--batch-size", "2500", "--resume"])).toEqual({
      batchSize: 2500,
      resume: true,
    });
  });

  it("enriches canonical cities but not subordinate populated places", async () => {
    const { isCanonicalCity } = await import("./run-pipeline");

    expect(isCanonicalCity({ placeClass: "city" })).toBe(true);
    expect(isCanonicalCity({ placeClass: "subordinate_place" })).toBe(false);
    expect(isCanonicalCity({})).toBe(true);
  });

  it("resumes deterministic fetch batches from a persisted checkpoint", async () => {
    const dependencies = {
      assertRequiredBulkSourcesExist: vi.fn(),
      ingestRegistry: vi.fn(async () => Array.from({ length: 5 }, (_, index) => ({ cityId: `city-${index}` }))),
      fetchCitySources: vi.fn(async () => {}),
      resolveEntities: vi.fn(async () => {}),
      generateArtifacts: vi.fn(async () => {}),
      runArtifactGenerator: vi.fn(async () => {}),
      generateGlobeArtifacts: vi.fn(async () => {}),
      loadCheckpoint: vi.fn(async () => ({
        schemaVersion: "1",
        totalCityCount: 5,
        batchSize: 2,
        completedOffsets: [0],
        failedOffsets: [],
      })),
      saveCheckpoint: vi.fn(async () => {}),
    };

    const { runPipeline } = await import("./run-pipeline");
    await runPipeline(
      dependencies as unknown as Parameters<typeof runPipeline>[0],
      { batchSize: 2, resume: true } as never,
    );

    expect(dependencies.fetchCitySources).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cityOffset: 2, maxCities: 2, forceRebuild: false }),
    );
    expect(dependencies.fetchCitySources).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cityOffset: 4, maxCities: 1, forceRebuild: false }),
    );
    const fetchCalls = dependencies.fetchCitySources.mock.calls as unknown as Array<
      [{ cityFilter?: (city: { placeClass?: string }) => boolean }]
    >;
    const cityFilter = fetchCalls[0]?.[0].cityFilter as
      | ((city: { placeClass?: string }) => boolean)
      | undefined;
    expect(cityFilter?.({ placeClass: "city" })).toBe(true);
    expect(cityFilter?.({ placeClass: "subordinate_place" })).toBe(false);
    expect(dependencies.resolveEntities).toHaveBeenCalledWith({ forceRebuild: false });
    expect(dependencies.saveCheckpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({
        totalCityCount: 5,
        batchSize: 2,
        completedOffsets: [0, 2, 4],
        failedOffsets: [],
      }),
    );
  });

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
