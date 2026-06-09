import { AxiosError } from "axios";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { getObject } from "../api/get";
import { useCrudContext } from "../context/hooks";

export default function useGetResource<T>({
    url,
    schema,
    refetchInterval,
    staleTime,
    gcTime,
    enabled,
}: {
    url: string;
    schema: z.ZodType<T>;
    refetchInterval?: number;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
}) {
    const { baseUrl, timeoutMs } = useCrudContext();
    const objectQuery = useQuery<T, AxiosError, T, readonly unknown[]>({
        queryKey: [url],
        queryFn: () =>
            getObject({
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
