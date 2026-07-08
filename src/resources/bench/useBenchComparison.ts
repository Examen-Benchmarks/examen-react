import { useQueries } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useApiClient } from "@examen/crud";
import { ResultsResponseSchema, type ResultsResponse } from "../report/results";

/**
 * Projects two versions of a bench for a side-by-side diff (FE-2). Each side is
 * GET /versions/{id}/results?bench_id=, which returns every experiment at that
 * version in one call. Query keys mirror useBenchOverview's, so a version already
 * loaded for the overview is served from cache rather than refetched. The diffing
 * lives in benchCompare.ts — this hook just fetches the two sides.
 */
export function useBenchComparison(
    benchId: string,
    baselineId: string | null,
    candidateId: string | null,
) {
    const api = useApiClient();

    const qs = useQueries({
        queries: [baselineId, candidateId].map((vid) => ({
            queryKey: ["results", "bench", benchId, vid ?? ""],
            queryFn: async (): Promise<ResultsResponse> => {
                const res = await api.get(
                    `/versions/${vid}/results?bench_id=${benchId}`,
                );
                return ResultsResponseSchema.parse(res.data);
            },
            enabled: !!vid,
            retry: false,
        })),
    });

    const [baseQ, candQ] = qs;

    return {
        baseline: baseQ.data ?? null,
        candidate: candQ.data ?? null,
        isLoading:
            (!!baselineId && baseQ.isLoading) ||
            (!!candidateId && candQ.isLoading),
        isError: baseQ.isError || candQ.isError,
        error: (baseQ.error ?? candQ.error ?? null) as AxiosError | null,
    };
}
