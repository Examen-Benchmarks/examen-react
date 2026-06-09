import { useContext, useMemo } from "react";
import type { AxiosInstance } from "axios";
import { createAxiosInstance } from "../api/axios";
import { CrudContext, type CrudContextValue } from "./context";
import type { TFunction } from "./labels";

export function useCrudContext(): CrudContextValue {
    const ctx = useContext(CrudContext);
    if (!ctx) {
        throw new Error(
            "useCrudContext must be used inside a <CrudProvider>. Wrap your app with one and pass at least `baseUrl`.",
        );
    }
    return ctx;
}

/** Label resolver — `t(key, { count, ...vars })`. */
export function useCrudT(): TFunction {
    return useCrudContext().t;
}

/**
 * A memoized axios instance bound to the provider's `baseUrl`/`timeoutMs`,
 * useful when calling the api helpers directly. Auth rides on the session
 * cookie (`withCredentials`), so the instance is safe to build once and reuse.
 */
export function useApiClient(): AxiosInstance {
    const { baseUrl, timeoutMs } = useCrudContext();
    return useMemo(
        () => createAxiosInstance({ baseUrl, timeoutMs }),
        [baseUrl, timeoutMs],
    );
}
