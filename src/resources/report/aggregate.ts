import type { Case, Metric, Run } from "../schemas";

// Pure client-side aggregation for an experiment report. Given the raw runs,
// metrics, and cases for one (experiment, version), produce the case × metric
// matrix of means, per-metric column aggregates, a headline grade, and a run
// summary. No I/O here — trivially testable.

/** Metric kinds whose value is a 0..1-style score we can grade / heatmap. */
const SCORE_KINDS = new Set(["ratio", "pct"]);

/** Normalize a metric value to [0,1] for grading/coloring, or null if not scoreable. */
export function normalizeScore(value: number, kind: string): number | null {
    if (kind === "ratio") return value;
    if (kind === "pct") return value / 100;
    return null;
}

export interface MetricColumn {
    key: string;
    name: string;
    kind: string;
}

export interface Cell {
    mean: number;
    n: number;
    stddev: number;
    min: number;
    max: number;
}

export interface CaseRow {
    case: Case;
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
    /** Mean of per-metric means over score-like kinds, or null if none. */
    grade: number | null;
    runSummary: RunSummary;
}

function stats(values: number[]): Cell {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance =
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return {
        mean,
        n,
        stddev: Math.sqrt(variance),
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

export function aggregateReport(
    runs: Run[],
    metrics: Metric[],
    cases: Case[],
): ExperimentReport {
    // Column set: distinct metrics in first-seen order.
    const columns = new Map<string, MetricColumn>();
    for (const m of metrics) {
        if (!columns.has(m.key)) {
            columns.set(m.key, { key: m.key, name: m.name, kind: m.kind });
        }
    }

    const runsByCase = new Map<string, Run[]>();
    for (const r of runs) {
        if (!r.caseId) continue;
        const list = runsByCase.get(r.caseId) ?? [];
        list.push(r);
        runsByCase.set(r.caseId, list);
    }
    const metricsByRun = new Map<string, Metric[]>();
    for (const m of metrics) {
        const list = metricsByRun.get(m.runId) ?? [];
        list.push(m);
        metricsByRun.set(m.runId, list);
    }

    const caseRows: CaseRow[] = cases.map((c) => {
        const caseRuns = c.id ? (runsByCase.get(c.id) ?? []) : [];
        const cells: Record<string, Cell | undefined> = {};
        for (const col of columns.values()) {
            const values: number[] = [];
            for (const run of caseRuns) {
                if (!run.id) continue;
                for (const m of metricsByRun.get(run.id) ?? []) {
                    if (m.key === col.key) values.push(m.value);
                }
            }
            cells[col.key] = values.length ? stats(values) : undefined;
        }
        return {
            case: c,
            runCount: caseRuns.length,
            okCount: caseRuns.filter((r) => r.status === "succeeded").length,
            erroredCount: caseRuns.filter((r) => r.status !== "succeeded")
                .length,
            cells,
        };
    });

    // Column footers + grade.
    const metricAggregates: Record<string, { mean: number; n: number }> = {};
    const valuesByKey = new Map<string, number[]>();
    for (const m of metrics) {
        const list = valuesByKey.get(m.key) ?? [];
        list.push(m.value);
        valuesByKey.set(m.key, list);
    }
    const normalizedMeans: number[] = [];
    for (const col of columns.values()) {
        const values = valuesByKey.get(col.key) ?? [];
        if (!values.length) continue;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        metricAggregates[col.key] = { mean, n: values.length };
        if (SCORE_KINDS.has(col.kind)) {
            const norm = normalizeScore(mean, col.kind);
            if (norm != null) normalizedMeans.push(norm);
        }
    }
    const grade = normalizedMeans.length
        ? normalizedMeans.reduce((a, b) => a + b, 0) / normalizedMeans.length
        : null;

    const total = runs.length;
    const ok = runs.filter((r) => r.status === "succeeded").length;
    const errored = total - ok;

    return {
        metrics: [...columns.values()],
        cases: caseRows,
        metricAggregates,
        grade,
        runSummary: {
            total,
            ok,
            errored,
            succeededPct: total ? (ok / total) * 100 : 0,
        },
    };
}
