import type { AxiosResponse, AxiosInstance, AxiosRequestConfig } from "axios";
import { createAxiosInstance } from "./axios";

import { camelToSnakeCase, snakeToCamelCase } from "../utility/functions";

import type { IMutationPropsWithCtx } from "../types/MutationProps";

const FORMAT_STRING_CORRESPONDENCE = {
    JSON: "application/json",
    FORM_DATA: "multipart/form-data",
    FORM_URLENCODED: "application/x-www-form-urlencoded",
    QUERY: "application/x-www-form-urlencoded",
};

export type MethodFunction = <
    T = never,
    R = AxiosResponse<T, never>,
    D = never,
>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
) => Promise<R>;

function methodCorrespondence({
    axiosInstance,
}: {
    axiosInstance: AxiosInstance;
}) {
    return {
        PATCH: axiosInstance.patch,
        POST: axiosInstance.post,
        PUT: axiosInstance.put,
        DELETE: axiosInstance.delete,
        GET: axiosInstance.get,
    };
}

export async function mutateObject<P, R>({
    payload,
    url,
    schema,
    format,
    method,
    baseUrl,
    timeoutMs,
}: IMutationPropsWithCtx<P, R>) {
    const axiosInstance = createAxiosInstance({ baseUrl, timeoutMs });
    const func = methodCorrespondence({ axiosInstance })[method];
    const formatString = FORMAT_STRING_CORRESPONDENCE[format];
    const headers: Record<string, string> = { "Content-Type": formatString };

    // Handle FormData separately - don't serialize it
    let requestData: unknown;
    if (payload !== undefined) {
        if (payload instanceof FormData) {
            requestData = payload;
        } else {
            requestData = camelToSnakeCase(
                JSON.parse(JSON.stringify(payload as Record<string, unknown>)),
            );
        }
    }

    return func<R>(url, requestData, {
        headers: headers,
    }).then((res: AxiosResponse<R>) => {
        if (schema === null) {
            return null as R;
        }
        return schema.parse(
            snakeToCamelCase(res.data as Record<string, never>),
        );
    });
}
