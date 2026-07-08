import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { z } from "zod";
import {
    entityFields,
    useApiClient,
    useGetResources,
    useMutateResource,
} from "@examen/crud";
import { ExprSchema, type Expr } from "./filterExpr";

// Saved views (FE-6): a user's named attribute filters for a bench. Owner is
// inferred server-side, so we never send a user id. `filter` is a filter.Expr;
// its keys (and/or/not/match/…) aren't snake_case, so the core's case
// conversion round-trips it untouched.
export const SavedViewSchema = z.object({
    ...entityFields,
    userId: z.string(),
    benchId: z.string(),
    name: z.string(),
    filter: ExprSchema,
});
export type SavedView = z.infer<typeof SavedViewSchema>;

export interface CreateSavedViewInput {
    name: string;
    benchId: string;
    filter: Expr;
}

/** List/create/delete the current user's saved views for one bench. */
export function useSavedViews(benchId: string) {
    const api = useApiClient();
    const qc = useQueryClient();
    // useGetResources keys off [url, ...keys] — so with no extra keys the query
    // key is just [url], and that's exactly what create/delete must invalidate.
    const url = `/saved-views?bench_id=${benchId}`;
    const invalidate = () => qc.invalidateQueries({ queryKey: [url] });

    const { objectQuery: listQ } = useGetResources<SavedView>({
        url,
        schema: SavedViewSchema,
    });

    const { objectMutation: createMutation } = useMutateResource<
        CreateSavedViewInput,
        SavedView
    >({
        url: "/saved-views",
        method: "POST",
        format: "JSON",
        schema: SavedViewSchema,
        onSuccess: invalidate,
    });

    // Per-id url, which useMutateResource's fixed url can't express.
    const removeMutation = useMutation<void, AxiosError, string>({
        mutationFn: async (id) => {
            await api.delete(`/saved-views/${id}`);
        },
        onSuccess: invalidate,
    });

    return {
        views: listQ.data ?? [],
        isLoading: listQ.isLoading,
        listError: listQ.error,
        create: (input: CreateSavedViewInput) =>
            createMutation.mutateAsync(input),
        createError: createMutation.error,
        remove: (id: string) => removeMutation.mutateAsync(id),
        removeError: removeMutation.error,
    };
}
