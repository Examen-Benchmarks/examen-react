import { useState } from "react";
import type { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { useGetResources, useApiClient } from "@examen/crud";
import {
    VersionSchema,
    RunSchema,
    MetricSchema,
    CaseSchema,
    type Version,
    type Run,
    type Metric,
    type Case,
} from "../schemas";
import {
    ResultsResponseSchema,
    toExperimentReport,
    type ExperimentReport,
    type ResultsResponse,
} from "./results";

/**
 * Drives an experiment's report. Flow: list versions (newest-first) → default to
 * [0] → ask the backend for the aggregated projection of that (experiment,
 * version) via GET /versions/{id}/results?experiment_id=. Aggregation is
 * backend-only (D17), so there is no client-side join — `report` is just the
 * mapped server response. Raw runs/metrics/cases are still fetched, but only to
 * feed the "All runs" table and the per-run drill-down.
 */
export function useExperimentReport(experimentId: string) {
    const api = useApiClient();

    const { objectQuery: versionsQ } = useGetResources<Version>({
        url: `/versions?experiment_id=${experimentId}`,
        schema: VersionSchema,
        keys: ["versions", experimentId],
    });
    const versions = versionsQ.data ?? [];

    const [picked, setPicked] = useState<string | null>(null);
    const selectedVersionId = picked ?? versions[0]?.id ?? null;
    const enabled = !!selectedVersionId;
    const v = selectedVersionId ?? "";

    // Aggregated matrix + grade — computed server-side.
    const resultsQ = useQuery<ResultsResponse, AxiosError>({
        queryKey: ["results", experimentId, v],
        queryFn: async () => {
            const res = await api.get(
                `/versions/${v}/results?experiment_id=${experimentId}`,
            );
            // Parsed straight off the wire (no snake→camel) to preserve the
            // metric-keyed `cells`/`metric_means` maps. See results.ts.
            return ResultsResponseSchema.parse(res.data);
        },
        enabled,
        retry: false,
    });

    // Raw reads — only for the per-run "All runs" table and drill-down.
    const { objectQuery: casesQ } = useGetResources<Case>({
        url: `/experiments/${experimentId}/cases`,
        schema: CaseSchema,
        keys: ["cases", experimentId],
    });
    const { objectQuery: runsQ } = useGetResources<Run>({
        url: `/runs?experiment_id=${experimentId}&version_id=${v}`,
        schema: RunSchema,
        keys: ["runs", experimentId, v],
        enabled,
    });
    const { objectQuery: metricsQ } = useGetResources<Metric>({
        url: `/metrics?experiment_id=${experimentId}&version_id=${v}`,
        schema: MetricSchema,
        keys: ["metrics", experimentId, v],
        enabled,
    });

    const report: ExperimentReport | null = resultsQ.data
        ? toExperimentReport(resultsQ.data)
        : null;

    return {
        versions,
        selectedVersionId,
        setSelectedVersionId: setPicked,
        report,
        runs: runsQ.data ?? [],
        metrics: metricsQ.data ?? [],
        cases: casesQ.data ?? [],
        noVersions: versionsQ.isSuccess && versions.length === 0,
        isLoading:
            versionsQ.isLoading ||
            casesQ.isLoading ||
            (enabled &&
                (resultsQ.isLoading ||
                    runsQ.isLoading ||
                    metricsQ.isLoading)),
        isError:
            versionsQ.isError ||
            casesQ.isError ||
            resultsQ.isError ||
            runsQ.isError ||
            metricsQ.isError,
        error:
            versionsQ.error ??
            casesQ.error ??
            resultsQ.error ??
            runsQ.error ??
            metricsQ.error ??
            null,
    };
}
