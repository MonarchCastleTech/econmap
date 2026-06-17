/**
 * Telecom asset extractor.
 *
 * P0.2 (no-fabrication non-negotiable): this script previously SYNTHESIZED base stations and
 * IXPs with Math.random() coordinates and stamped them with a fake `ookla` / `mock-telecom-registry`
 * sourceId at coverageState `verified_exact`. That violated the "never fabricate / every claim
 * traceable" rule, so the fabrication has been removed.
 *
 * Real telecom point assets:
 *   - Subsea cable landing points  -> scripts/data/assets/extract-subsea-assets.ts (TeleGeography, real)
 *   - IXPs + data centers          -> PeeringDB           (P3 — to be added via the SourceJoinModule seam)
 *   - Cell sites / mobile          -> OpenCelliD          (P3)
 *
 * This file is intentionally a NO-OP that emits nothing, so running the asset pipeline can never
 * reintroduce synthetic telecom points. It is kept (rather than deleted) so the pipeline ordering
 * and npm scripts that reference it do not break, and so P3 can replace this body with a real
 * PeeringDB/OpenCelliD extractor.
 */

function main(): void {
  console.log(
    "[extract-telecom-assets] No-op: synthetic telecom generation removed (P0.2). " +
      "Real telecom points come from extract-subsea-assets (TeleGeography) and, in P3, PeeringDB/OpenCelliD.",
  );
}

main();
