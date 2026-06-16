import { z } from "zod";

// The version projection (backend D17): GET /versions/{id}/results. Aggregation
// is backend-only now — the server returns per-case cells, per-metric means and
// the headline grade already computed, so the client does no math (the former
// client-side aggregate.ts is gone).
//
// This endpoint is fetched WITHOUT the core's snake→camel conversion: `cells`
// and `metric_means` are maps keyed by metric key (e.g. `time_awareness`), and
// the generic converter would corrupt those keys. So the wire schema below is
// snake_case-faithful, and `toExperimentReport` maps it to the camelCased view
// the report UI already renders.

// ── Wire schema (snake_case, parsed straight off the response) ────────────────

const RunSummaryWire = z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number(),
    errored: z.number(),
    succeeded_pct: z.number().nullish(),
});

const RefWire = z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
});

const MetricColumnWire = z.object({
    key: z.string(),
    name: z.string(),
    kind: z.string(),
});

const CellWire = z.object({
    mean: z.number(),
    n: z.number(),
    stddev: z.number().nullable(), // null when n < 2 (sample stddev)
    min: z.number(),
    max: z.number(),
});

const MetricMeanWire = z.object({
    mean: z.number(),
    n: z.number(),
});

const CaseSectionWire = z.object({
    case: RefWire,
    runs: RunSummaryWire,
    cells: z.record(z.string(), CellWire),
});

const ExperimentSectionWire = z.object({
    experiment: RefWire,
    collection_path: z.array(z.object({ key: z.string(), name: z.string() })),
    run_summary: RunSummaryWire,
    grade: z.object({ method: z.string(), value: z.number().nullable() }),
    metrics: z.array(MetricColumnWire),
    metric_means: z.record(z.string(), MetricMeanWire),
    cases: z.array(CaseSectionWire),
});

export const ResultsResponseSchema = z.object({
    version: z.object({
        id: z.string(),
        components: z.unknown(),
        components_hash: z.string(),
        created_at: z.string(),
    }),
    scope: z.object({
        bench_id: z.string().nullable(),
        experiment_id: z.string().nullable(),
    }),
    run_summary: RunSummaryWire,
    experiments: z.array(ExperimentSectionWire),
});
export type ResultsResponse = z.infer<typeof ResultsResponseSchema>;

// ── Report view (camelCase; the shape the report UI consumes) ─────────────────

export interface MetricColumn {
    key: string;
    name: string;
    kind: string;
}

export interface Cell {
    mean: number;
    n: number;
    /** Sample stddev; null when n < 2 (the server omits it). */
    stddev: number | null;
    min: number;
    max: number;
}

export interface CaseRef {
    id: string;
    key: string;
    name: string;
}

export interface CaseRow {
    case: CaseRef;
    runCount: number;
    okCount: number;
    erroredCount: number;
    /** Keyed by metric key; undefined when the case has no value for that metric. */
    cells: Record<string, Cell | undefined>;
}

export interface RunSummary {
    total: number;
    ok: number;
    errored: number;
    succeededPct: number;
}

export interface ExperimentReport {
    metrics: MetricColumn[];
    cases: CaseRow[];
    metricAggregates: Record<string, { mean: number; n: number }>;
    /** Server-computed grade (mean_of_metric_means); null when nothing scores. */
    grade: number | null;
    runSummary: RunSummary;
}

/**
 * Maps an experiment-scoped projection to the report view. The scope is one
 * experiment, so `experiments` holds 0 or 1 section; an empty scope (no runs at
 * this version) yields null — the caller renders "no data yet".
 */
export function toExperimentReport(
    res: ResultsResponse,
): ExperimentReport | null {
    const exp = res.experiments[0];
    if (!exp) return null;

    // Experiment scope ⇒ the top-level summary covers this one experiment; it
    // carries succeeded_pct (the per-experiment section does not).
    const top = res.run_summary;

    return {
        metrics: exp.metrics,
        cases: exp.cases.map((c) => ({
            case: c.case,
            runCount: c.runs.total,
            okCount: c.runs.succeeded,
            erroredCount: c.runs.failed + c.runs.errored,
            cells: c.cells,
        })),
        metricAggregates: exp.metric_means,
        grade: exp.grade.value,
        runSummary: {
            total: top.total,
            ok: top.succeeded,
            errored: top.failed + top.errored,
            succeededPct: top.succeeded_pct ?? 0,
        },
    };
}
