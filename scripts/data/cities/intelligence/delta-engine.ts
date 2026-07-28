import {
  cityAlertSchema,
  cityIntelligenceDeltaSchema,
  type CityAlert,
  type CityIntelligenceDelta,
  type CityObservation,
} from "../../../../src/domain/city-intelligence-schemas";

const DELTA_ORDER: Record<CityIntelligenceDelta["kind"], number> = {
  changed: 0,
  added: 1,
  removed: 2,
  expired: 3,
};

const SEVERITY_ORDER: Record<CityAlert["severity"], number> = {
  critical: 0,
  warning: 1,
  watch: 2,
  info: 3,
};

function comparable(observation: CityObservation): string {
  return JSON.stringify({
    state: observation.state,
    value: observation.value,
    unit: observation.unit,
    evidenceKind: observation.evidenceKind,
    technology: observation.technology,
    operator: observation.operator,
    geographyKind: observation.geographyKind,
    geographyId: observation.geographyId,
  });
}

function toDelta(
  kind: CityIntelligenceDelta["kind"],
  detectedAt: string,
  previous: CityObservation | undefined,
  current: CityObservation | undefined,
): CityIntelligenceDelta {
  const observation = current ?? previous;
  if (!observation) {
    throw new Error("A delta requires a previous or current observation.");
  }

  return cityIntelligenceDeltaSchema.parse({
    id: `${kind}:${observation.id}:${detectedAt}`,
    observationId: observation.id,
    cityId: observation.cityId,
    topic: observation.topic,
    metric: observation.metric,
    kind,
    detectedAt,
    sourceId: observation.sourceId,
    previousState: previous?.state,
    currentState: current?.state,
    previousValue: previous?.value,
    currentValue: current?.value,
    observedAt: current?.observedAt ?? previous?.observedAt,
  });
}

export function diffCityObservations(
  previous: readonly CityObservation[],
  current: readonly CityObservation[],
  detectedAt: string,
): CityIntelligenceDelta[] {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const currentById = new Map(current.map((item) => [item.id, item]));
  const ids = [...new Set([...previousById.keys(), ...currentById.keys()])].sort();
  const now = Date.parse(detectedAt);
  const deltas: CityIntelligenceDelta[] = [];

  for (const id of ids) {
    const before = previousById.get(id);
    const after = currentById.get(id);

    if (!before && after) {
      deltas.push(toDelta("added", detectedAt, undefined, after));
      continue;
    }

    if (before && !after) {
      const expired =
        before.validTo !== undefined &&
        Number.isFinite(now) &&
        Date.parse(before.validTo) <= now;
      deltas.push(
        toDelta(expired ? "expired" : "removed", detectedAt, before, undefined),
      );
      continue;
    }

    if (before && after && comparable(before) !== comparable(after)) {
      deltas.push(toDelta("changed", detectedAt, before, after));
    }
  }

  return deltas.sort(
    (a, b) =>
      DELTA_ORDER[a.kind] - DELTA_ORDER[b.kind] ||
      a.cityId.localeCompare(b.cityId) ||
      a.observationId.localeCompare(b.observationId),
  );
}

function severityFor(delta: CityIntelligenceDelta): CityAlert["severity"] {
  if (
    delta.topic === "hazard" &&
    delta.kind === "added" &&
    delta.currentState === "observed"
  ) {
    return delta.metric === "active-fire" ? "critical" : "warning";
  }
  if (delta.topic === "telecom_coverage") return "watch";
  if (delta.kind === "expired" || delta.kind === "removed") return "warning";
  return "info";
}

function titleFor(delta: CityIntelligenceDelta): string {
  if (delta.topic === "hazard" && delta.kind === "added") {
    return "Operational hazard detected";
  }
  if (delta.topic === "telecom_coverage") {
    return "Telecom evidence changed";
  }
  if (delta.kind === "expired") {
    return "Observation expired";
  }
  return "City observation changed";
}

export function alertsFromDeltas(
  deltas: readonly CityIntelligenceDelta[],
): CityAlert[] {
  return deltas
    .map((delta) =>
      cityAlertSchema.parse({
        id: `alert:${delta.id}`,
        cityId: delta.cityId,
        topic: delta.topic,
        severity: severityFor(delta),
        changeType: delta.kind,
        title: titleFor(delta),
        summary: `${delta.metric} was ${delta.kind} from ${delta.sourceId}.`,
        sourceId: delta.sourceId,
        observedAt: delta.observedAt,
        detectedAt: delta.detectedAt,
      }),
    )
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.detectedAt.localeCompare(a.detectedAt) ||
        a.id.localeCompare(b.id),
    );
}
