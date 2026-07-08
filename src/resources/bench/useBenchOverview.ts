import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useApiClient, useGetResources } from "@examen/crud";
import { VersionSchema, type Version } from "../schemas";
import { ResultsResponseSchema, type ResultsResponse } from "../report/results";

// Cap how many versions we project per bench load — each is one /results call.
const MAX_RECENT = 10;

// Field names below are snake_case because the bench projection is parsed
// straight off the wire (see report/results.ts) to keep its metric-keyed maps
// intact.
type ExperimentSection = ResultsResponse["experiments"][number];
type CollectionSeg = ExperimentSection["collection_path"][number];

export interface VersionRow {
    version: Version;
    /** The bench projection for this version (run counts live in run_summary). */
    results: ResultsResponse | null;
    isLoading: boolean;
}

/** Experiments sharing one collection breadcrumb, drawn as a group. */
export interface CollectionGroup {
    /** Stable key from the joined collection keys; "" ⇒ directly under the bench. */
    key: string;
    path: CollectionSeg[];
    experiments: ExperimentSection[];
}

function groupByCollection(results: ResultsResponse): CollectionGroup[] {
    const groups: CollectionGroup[] = [];
    const index = new Map<string, CollectionGroup>();
    for (const exp of results.experiments) {
        const key = exp.collection_path.map((c) => c.key).join("/");
        let g = index.get(key);
        if (!g) {
            g = { key, path: exp.collection_path, experiments: [] };
            index.set(key, g);
            groups.push(g);
        }
        g.experiments.push(exp);
    }
    return groups;
}

/**
 * Drives the bench overview. Lists the bench's versions (newest-first, now that
 * versions are bench-scoped), projects the recent ones via
 * GET /versions/{id}/results?bench_id= for run counts, and groups the selected
 * version's experiments by their collection breadcrumb. No client-side
 * aggregation — grades/counts come from the projection.
 */
export function useBenchOverview(benchId: string, attrs?: string | null) {
    const api = useApiClient();

    // When a filter is active, narrow the version list via ?attrs= and key the
    // query by it; with no filter the URL/key are unchanged, so the cache is
    // shared with the comparison screen's unfiltered version list.
    const { objectQuery: versionsQ } = useGetResources<Version>({
        url: attrs
            ? `/versions?bench_id=${benchId}&attrs=${encodeURIComponent(attrs)}`
            : `/versions?bench_id=${benchId}`,
        schema: VersionSchema,
        keys: attrs
            ? ["versions", "bench", benchId, attrs]
            : ["versions", "bench", benchId],
    });
    const versions = versionsQ.data ?? [];
    const recent = versions.slice(0, MAX_RECENT);

    const [picked, setPicked] = useState<string | null>(null);
    // Fall back to the newest version when the picked one isn't in the (possibly
    // filtered) list — e.g. a filter just hid it.
    const selectedVersionId =
        (picked && recent.some((v) => v.id === picked)
            ? picked
            : recent[0]?.id) ?? null;

    const resultsQs = useQueries({
        queries: recent.map((v) => ({
            queryKey: ["results", "bench", benchId, v.id],
            queryFn: async (): Promise<ResultsResponse> => {
                const res = await api.get(
                    `/versions/${v.id}/results?bench_id=${benchId}`,
                );
                return ResultsResponseSchema.parse(res.data);
            },
            enabled: !!v.id,
            retry: false,
        })),
    });

    const rows: VersionRow[] = recent.map((v, i) => ({
        version: v,
        results: resultsQs[i]?.data ?? null,
        isLoading: resultsQs[i]?.isLoading ?? false,
    }));

    const selectedIdx = recent.findIndex((v) => v.id === selectedVersionId);
    const selectedQ = selectedIdx >= 0 ? resultsQs[selectedIdx] : undefined;
    const selectedResults = selectedQ?.data ?? null;

    const resultsError = resultsQs.find((q) => q.error)?.error as
        | AxiosError
        | undefined;

    // Per-experiment grade trend across the recent versions (oldest→newest),
    // read straight off the already-fetched projections — no extra requests.
    // Truncated at the selected version so the delta reflects the version being
    // viewed vs its predecessor — not always the newest pair. The oldest
    // selected ⇒ a single point ⇒ no delta.
    const chronoRows = [...rows].reverse();
    const selChronoIdx = chronoRows.findIndex(
        (r) => r.version.id === selectedVersionId,
    );
    const gradeTrendFor = (experimentId: string): (number | null)[] => {
        const upTo =
            selChronoIdx >= 0
                ? chronoRows.slice(0, selChronoIdx + 1)
                : chronoRows;
        return upTo.map((r) => {
            const e = r.results?.experiments.find(
                (x) => x.experiment.id === experimentId,
            );
            return e ? e.grade.value : null;
        });
    };

    return {
        rows,
        gradeTrendFor,
        selectedVersionId,
        setSelectedVersionId: setPicked,
        groups: selectedResults ? groupByCollection(selectedResults) : [],
        noVersions: versionsQ.isSuccess && versions.length === 0,
        isLoading: versionsQ.isLoading,
        selectedLoading: selectedQ?.isLoading ?? false,
        isError: versionsQ.isError,
        error: versionsQ.error ?? resultsError ?? null,
    };
}
