import type { ResultsResponse } from "../report/results";

// Version-level diff at bench scope (FE-2): two bench projections, compared
// experiment by experiment. The unifying number across experiments is the
// server-computed grade (higher = better), so that's what we diff — not the
// per-case cells, which the experiment's own evolution view already covers.
// No aggregation here: grades come straight from the projection.

type ExperimentSection = ResultsResponse["experiments"][number];
type CollectionSeg = ExperimentSection["collection_path"][number];

// Grade deltas below this (post display-rounding) read as no change.
const EPS = 5e-3;

export interface ExperimentDiff {
    id: string;
    name: string;
    key: string;
    baseGrade: number | null;
    candGrade: number | null;
    baseRuns: number | null;
    candRuns: number | null;
    /** candGrade − baseGrade when both versions ran this experiment. */
    delta: number | null;
    /** true = improved, false = regressed, null = unchanged / one-sided. */
    better: boolean | null;
    inBase: boolean;
    inCand: boolean;
}

/** Experiments sharing one collection breadcrumb (mirrors the bench overview). */
export interface DiffGroup {
    key: string;
    path: CollectionSeg[];
    experiments: ExperimentDiff[];
}

/**
 * Builds the per-experiment grade diff between a baseline and candidate version,
 * grouped by collection breadcrumb. Experiments are the union of both sides
 * (candidate ordering first, then baseline-only), so an experiment that ran at
 * only one version still appears — flagged via inBase/inCand.
 */
export function buildBenchComparison(
    base: ResultsResponse,
    cand: ResultsResponse,
): DiffGroup[] {
    const baseById = new Map(base.experiments.map((e) => [e.experiment.id, e]));
    const candById = new Map(cand.experiments.map((e) => [e.experiment.id, e]));

    const order: string[] = [];
    const seen = new Set<string>();
    for (const e of cand.experiments) {
        order.push(e.experiment.id);
        seen.add(e.experiment.id);
    }
    for (const e of base.experiments)
        if (!seen.has(e.experiment.id)) {
            order.push(e.experiment.id);
            seen.add(e.experiment.id);
        }

    const groups: DiffGroup[] = [];
    const index = new Map<string, DiffGroup>();

    for (const id of order) {
        const b = baseById.get(id);
        const k = candById.get(id);
        const src = k ?? b!; // prefer candidate for identity + breadcrumb
        const baseGrade = b?.grade.value ?? null;
        const candGrade = k?.grade.value ?? null;

        let delta: number | null = null;
        let better: boolean | null = null;
        if (baseGrade != null && candGrade != null) {
            delta = candGrade - baseGrade;
            better = Math.abs(delta) < EPS ? null : delta > 0;
        }

        const diff: ExperimentDiff = {
            id,
            name: src.experiment.name,
            key: src.experiment.key,
            baseGrade,
            candGrade,
            baseRuns: b?.run_summary.total ?? null,
            candRuns: k?.run_summary.total ?? null,
            delta,
            better,
            inBase: !!b,
            inCand: !!k,
        };

        const gkey = src.collection_path.map((c) => c.key).join("/");
        let g = index.get(gkey);
        if (!g) {
            g = { key: gkey, path: src.collection_path, experiments: [] };
            index.set(gkey, g);
            groups.push(g);
        }
        g.experiments.push(diff);
    }

    return groups;
}
