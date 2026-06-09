// App-wide configuration.
//
// In dev, requests go to `/api/*` and Vite's proxy forwards them to the Go
// backend (stripping `/api`), keeping everything same-origin so the session
// cookie works without CORS. In prod, point this at the deployed API origin.
export const BASE_API_URL = "/api";
export const TIMEOUT_MS = 30_000;
