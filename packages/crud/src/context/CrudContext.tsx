import { useMemo, type ReactNode } from "react";
import { defaultT, type TFunction } from "./labels";
import { CrudContext, type CrudContextValue } from "./context";

interface CrudProviderProps {
    baseUrl: string;
    timeoutMs?: number;
    /** Optional override for the label resolver (e.g. react-i18next's `t`). */
    t?: TFunction;
    children: ReactNode;
}

/**
 * Wraps the app once, supplying the package with everything it can't infer:
 * where to send requests and (optionally) how to translate the labels it
 * renders. Authentication rides on the `examen_session` cookie — the axios
 * client sends credentials automatically, so there is no token to thread
 * through here. All other ergonomics — `useApiClient`, `useCrudT`, the data
 * hooks — read from this context.
 */
export function CrudProvider({
    baseUrl,
    timeoutMs = 30000,
    t,
    children,
}: CrudProviderProps) {
    const value = useMemo<CrudContextValue>(
        () => ({ baseUrl, timeoutMs, t: t ?? defaultT }),
        [baseUrl, timeoutMs, t],
    );
    return (
        <CrudContext.Provider value={value}>{children}</CrudContext.Provider>
    );
}
