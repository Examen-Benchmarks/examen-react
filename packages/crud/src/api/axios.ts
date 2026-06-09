import axios, { type AxiosInstance } from "axios";

export interface CreateAxiosInstanceOptions {
    baseUrl: string;
    timeoutMs?: number;
}

/**
 * Builds an axios instance for the package's requests. Authentication is the
 * `examen_session` HttpOnly cookie, so `withCredentials` is on and there is no
 * Authorization header to set — the browser attaches the cookie itself. Cheap
 * and synchronous (no token to await).
 */
export function createAxiosInstance({
    baseUrl,
    timeoutMs = 30000,
}: CreateAxiosInstanceOptions): AxiosInstance {
    return axios.create({
        baseURL: baseUrl,
        timeout: timeoutMs,
        withCredentials: true,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
}
