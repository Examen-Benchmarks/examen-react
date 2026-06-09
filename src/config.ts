// App-wide configuration, sourced from env (see .env.example / .env.dev).
//
// In dev, requests go to `/api/*` and Vite's proxy forwards them to the Go
// backend (stripping `/api`), keeping everything same-origin so the session
// cookie works without CORS. In prod, set VITE_API_BASE_URL to the deployed
// API origin.
export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const TIMEOUT_MS = Number(
    import.meta.env.VITE_API_TIMEOUT_MS ?? 30_000,
);
