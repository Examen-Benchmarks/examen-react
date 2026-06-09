import { createContext } from "react";
import type { TFunction } from "./labels";

export interface CrudContextValue {
    /** Base URL for the package's HTTP client. */
    baseUrl: string;
    /** Request timeout in ms. */
    timeoutMs: number;
    /** Label resolver. Defaults to the built-in English labels. */
    t: TFunction;
}

export const CrudContext = createContext<CrudContextValue | null>(null);
