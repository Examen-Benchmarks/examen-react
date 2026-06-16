import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useApiClient, useGetResources, useMutateResource } from "@examen/crud";
import {
    ApiKeySchema,
    CreatedApiKeySchema,
    type ApiKey,
    type CreateApiKeyInput,
    type CreatedApiKey,
} from "./schemas";

// The list query key — useGetResources keys off the bare url when no extra keys
// are given, so this is what create/revoke invalidate.
const API_KEYS_KEY = ["/api-keys"] as const;

/**
 * The API-keys admin data layer: list the current user's keys, mint a new one
 * (POST returns the plaintext secret once), and revoke by id. Mutations
 * invalidate the list so it stays in sync.
 */
export function useApiKeys() {
    const api = useApiClient();
    const qc = useQueryClient();
    const invalidate = () =>
        qc.invalidateQueries({ queryKey: API_KEYS_KEY });

    const { objectQuery: listQ } = useGetResources<ApiKey>({
        url: "/api-keys",
        schema: ApiKeySchema,
    });

    const { objectMutation: createMutation } = useMutateResource<
        CreateApiKeyInput,
        CreatedApiKey
    >({
        url: "/api-keys",
        method: "POST",
        format: "JSON",
        schema: CreatedApiKeySchema,
        onSuccess: invalidate,
    });

    // Revoke targets a per-id url, which useMutateResource's fixed url can't
    // express — so it goes through the raw client.
    const revokeMutation = useMutation<void, AxiosError, string>({
        mutationFn: async (id) => {
            await api.delete(`/api-keys/${id}`);
        },
        onSuccess: invalidate,
    });

    return {
        keys: listQ.data ?? [],
        isLoading: listQ.isLoading,
        isError: listQ.isError,
        error: listQ.error,
        create: (input: CreateApiKeyInput) => createMutation.mutateAsync(input),
        createError: createMutation.error,
        revoke: (id: string) => revokeMutation.mutateAsync(id),
        /** Id of the key currently being revoked, for a per-row spinner. */
        revokingId: revokeMutation.isPending
            ? (revokeMutation.variables ?? null)
            : null,
    };
}
