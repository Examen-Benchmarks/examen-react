import type { AxiosResponse } from "axios";
import { z } from "zod";
import { createAxiosInstance } from "./axios";
import { snakeToCamelCase } from "../utility/functions";

/**
 * Fetches a single object and validates/parses it through `schema`. The wire
 * is snake_case; we camel-case it first, then `schema.parse` both validates
 * and rehydrates (e.g. `z.coerce.date()` turns timestamp strings into Dates).
 */
export async function getObject<T>({
    url,
    schema,
    baseUrl,
    timeoutMs,
}: {
    url: string;
    schema: z.ZodType<T>;
    baseUrl: string;
    timeoutMs?: number;
}): Promise<T> {
    const instance = createAxiosInstance({ baseUrl, timeoutMs });
    const response: AxiosResponse = await instance.get(url);
    return schema.parse(
        snakeToCamelCase(response.data as Record<string, never>),
    );
}
