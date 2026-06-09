import { z } from "zod";
import { entityFields } from "@examen/crud";

// All schemas describe the camelCased payload (the core converts snake_case
// before parsing). Free-form JSON columns (payload, trace, components, context)
// are `z.unknown()` — displayed, not validated.

// ── Project ─────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
    ...entityFields,
    userId: z.string().optional(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectCreateSchema = z.object({
    key: z.string().min(1, "Key is required").max(200),
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(2000).optional(),
});
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;

// ── Bench ───────────────────────────────────────────────────────────────────

export const BenchSchema = z.object({
    ...entityFields,
    projectId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
});
export type Bench = z.infer<typeof BenchSchema>;

// ── Collection (nestable tree, bench-scoped) ──────────────────────────────────

export const CollectionSchema = z.object({
    ...entityFields,
    benchId: z.string(),
    parentId: z.string().nullish(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
});
export type Collection = z.infer<typeof CollectionSchema>;

// ── Experiment ────────────────────────────────────────────────────────────────

export const ExperimentSchema = z.object({
    ...entityFields,
    benchId: z.string(),
    collectionId: z.string().nullish(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

// ── Case (experiment-scoped) ──────────────────────────────────────────────────

export const CaseSchema = z.object({
    ...entityFields,
    experimentId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    payload: z.unknown(),
    inputSummary: z.string().nullish(),
});
export type Case = z.infer<typeof CaseSchema>;

// ── Run ───────────────────────────────────────────────────────────────────────

export const RunSchema = z.object({
    ...entityFields,
    benchId: z.string(),
    experimentId: z.string(),
    caseId: z.string(),
    versionId: z.string(),
    status: z.string(),
    startedAt: z.coerce.date().nullish(),
    finishedAt: z.coerce.date().nullish(),
    trace: z.unknown(),
    errorMessage: z.string().nullish(),
    outputSummary: z.string().nullish(),
});
export type Run = z.infer<typeof RunSchema>;

// ── Metric (run-scoped, read-only leaf) ───────────────────────────────────────

export const MetricSchema = z.object({
    ...entityFields,
    runId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    kind: z.string(),
    value: z.number(),
    context: z.unknown().nullish(),
});
export type Metric = z.infer<typeof MetricSchema>;
