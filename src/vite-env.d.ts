/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API base URL the browser calls (default "/api", the dev proxy prefix). */
    readonly VITE_API_BASE_URL?: string;
    /** Request timeout in ms for the data layer (default 30000). */
    readonly VITE_API_TIMEOUT_MS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
