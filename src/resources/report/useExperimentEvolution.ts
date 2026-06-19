import { useQueries } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useApiClient, useGetResources } from "@examen/crud";
import { VersionSchema, type Version } from "../schemas";
import { ResultsResponseSchema, type ResultsResponse } from "./results";

// One column per metric seen across the experiment's versions.
export interface EvolutionMetric {
    key: string;
    name: string;
    kind: string;
}

// One version's place on the trend (oldest-first, so newest is on the right).
export interface EvolutionPoint {
    versionId: string;
    hash: string;
    createdAt?: Date;
    /** Server-computed grade for this version; null when nothing scores. */
    grade: number | null;
    /** Per-metric experiment-wide mean, keyed by metric key (raw, un-normalised). */
    metricMeans: Record<string, number>;
}

/**
 * Builds an experiment's evolution across its versions. Enumerates the versions
 * that have runs (GET /versions?experiment_id=) and projects each one
 * (GET /versions/{id}/results?experiment_id=) for its grade + per-metric means.
 * Query keys mirror useExperimentReport's, so the selected version's projection
 * is shared rather than refetched. No client aggregation — the points are the
 * server's numbers, just arranged over time.
 */
export function useExperimentEvolution(experimentId: string) {
    const api = useApiClient();

    const { objectQuery: versionsQ } = useGetResources<Version>({
        url: `/versions?experiment_id=${experimentId}`,
        schema: VersionSchema,
        keys: ["versions", experimentId],
    });
    // API is newest-first; a trend reads left→right oldest→newest.
    const chrono = [...(versionsQ.data ?? [])].reverse();

    const resultsQs = useQueries({
        queries: chrono.map((v) => ({
            queryKey: ["results", experimentId, v.id ?? ""],
            queryFn: async (): Promise<ResultsResponse> => {
                const res = await api.get(
                    `/versions/${v.id}/results?experiment_id=${experimentId}`,
                );
                return ResultsResponseSchema.parse(res.data);
            },
            enabled: !!v.id,
            retry: false,
        })),
    });

    const points: EvolutionPoint[] = chrono.map((v, i) => {
        const exp = resultsQs[i]?.data?.experiments[0];
        const metricMeans: Record<string, number> = {};
        if (exp) {
            for (const [k, mm] of Object.entries(exp.metric_means)) {
                metricMeans[k] = mm.mean;
            }
        }
        return {
            versionId: v.id!,
            hash: (v.componentsHash ?? v.id ?? "").slice(0, 10),
            createdAt: v.createdAt,
            grade: exp?.grade.value ?? null,
            metricMeans,
        };
    });

    // Metric columns: first-seen across versions (matches the report's ordering).
    const metricMap = new Map<string, EvolutionMetric>();
    for (const q of resultsQs) {
        const exp = q.data?.experiments[0];
        if (!exp) continue;
        for (const m of exp.metrics) {
            if (!metricMap.has(m.key)) metricMap.set(m.key, m);
        }
    }

    const resultsError = resultsQs.find((q) => q.error)?.error as
        | AxiosError
        | undefined;

    return {
        points,
        metrics: [...metricMap.values()],
        hasData: points.some((p) => p.grade != null),
        isLoading:
            versionsQ.isLoading || resultsQs.some((q) => q.isLoading),
        isError: versionsQ.isError || resultsQs.some((q) => q.isError),
        error: versionsQ.error ?? resultsError ?? null,
    };
}
