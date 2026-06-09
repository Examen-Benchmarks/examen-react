import type { AxiosResponse } from "axios";
import { z } from "zod";
import { createAxiosInstance } from "./axios";
import { snakeToCamelCase } from "../utility/functions";

/**
 * Fetches a list endpoint. The Examen API returns a bare JSON array (no
 * pagination envelope), so we camel-case the payload and validate it as
 * `z.array(schema)` — yielding a plain `T[]` of parsed items.
 */
export async function getObjects<T>({
    url,
    schema,
    baseUrl,
    timeoutMs,
}: {
    url: string;
    schema: z.ZodType<T>;
    baseUrl: string;
    timeoutMs?: number;
}): Promise<T[]> {
    const instance = createAxiosInstance({ baseUrl, timeoutMs });
    const res: AxiosResponse = await instance.get(url);
    return z
        .array(schema)
        .parse(snakeToCamelCase(res.data as Record<string, never>));
}
