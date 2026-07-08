import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useApiClient } from "@examen/crud";

// Attribute discovery (backend #7), used to populate the filter builder's key and
// value suggestions. Both endpoints are bench-scoped and top-level only — nested
// component paths aren't enumerated yet, so a dotted key returns no suggestions
// (the user can still free-type it). Parsed off the wire; the responses have no
// snake_case keys to convert.

const KeysSchema = z.object({ keys: z.array(z.string()) });
const ValuesSchema = z.object({ key: z.string(), values: z.array(z.string()) });

/** Distinct top-level component keys across the bench's versions. */
export function useAttributeKeys(benchId: string) {
    const api = useApiClient();
    const q = useQuery({
        queryKey: ["attr-keys", benchId],
        queryFn: async () => {
            const res = await api.get(`/attributes/keys?bench_id=${benchId}`);
            return KeysSchema.parse(res.data);
        },
        enabled: !!benchId,
        staleTime: 5 * 60 * 1000,
    });
    return { keys: q.data?.keys ?? [], isLoading: q.isLoading };
}

/** Distinct values for one top-level key; idle until a key is set. */
export function useAttributeValues(benchId: string, key: string) {
    const api = useApiClient();
    const enabled = !!benchId && key.trim() !== "";
    const q = useQuery({
        queryKey: ["attr-values", benchId, key],
        queryFn: async () => {
            const res = await api.get(
                `/attributes/values?bench_id=${benchId}&key=${encodeURIComponent(key)}`,
            );
            return ValuesSchema.parse(res.data);
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
    return { values: q.data?.values ?? [], isLoading: q.isLoading };
}
