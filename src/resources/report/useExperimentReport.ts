import { useMemo, useState } from "react";
import { useGetResources } from "@examen/crud";
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
import { aggregateReport, type ExperimentReport } from "./aggregate";

/**
 * Fetches everything for an experiment's report and aggregates it client-side.
 * Flow: list versions (newest-first) → default to [0] → fetch runs + bulk
 * metrics + cases for that version → join & aggregate. Raw runs/metrics/cases
 * are returned too, so the sample drill-down reuses them with no extra request.
 */
export function useExperimentReport(experimentId: string) {
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

    const report = useMemo<ExperimentReport | null>(() => {
        if (!runsQ.data || !metricsQ.data || !casesQ.data) return null;
        return aggregateReport(runsQ.data, metricsQ.data, casesQ.data);
    }, [runsQ.data, metricsQ.data, casesQ.data]);

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
            (enabled && (runsQ.isLoading || metricsQ.isLoading)),
        isError:
            versionsQ.isError ||
            casesQ.isError ||
            runsQ.isError ||
            metricsQ.isError,
        error:
            versionsQ.error ??
            casesQ.error ??
            runsQ.error ??
            metricsQ.error ??
            null,
    };
}
