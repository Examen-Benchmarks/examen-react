import { AxiosError } from "axios";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { getObjects } from "../api/getObjects";
import { useCrudContext } from "../context/hooks";

export default function useGetResources<T>({
    url,
    schema,
    keys,
    refetchInterval,
    staleTime,
    gcTime,
    enabled,
}: {
    url: string;
    schema: z.ZodType<T>;
    keys?: string[];
    refetchInterval?: number;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
}) {
    const { baseUrl, timeoutMs } = useCrudContext();
    const objectQuery = useQuery<T[], AxiosError, T[], unknown[]>({
        queryKey: keys ? [url, ...keys] : [url],
        queryFn: () =>
            getObjects<T>({
                url,
                schema,
                baseUrl,
                timeoutMs,
            }),
        retry: false,
        refetchInterval: refetchInterval ?? false,
        staleTime,
        gcTime,
        enabled,
    });

    return { objectQuery };
}
