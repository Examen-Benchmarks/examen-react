import { z } from "zod";

export type HTTPMethod = "PATCH" | "POST" | "PUT" | "DELETE" | "GET";
export type FormFormat = "JSON" | "FORM_DATA" | "FORM_URLENCODED" | "QUERY";

export interface IMutationProps<P, R> {
    url: string;
    payload?: P;
    /** Schema used to parse the response. `null` for endpoints with no body. */
    schema: z.ZodType<R> | null;
    onSuccess?: (data: R) => void;
    format: FormFormat;
    method: HTTPMethod;
}

export interface IMutationPropsWithCtx<P, R> extends IMutationProps<P, R> {
    baseUrl: string;
    timeoutMs?: number;
}
