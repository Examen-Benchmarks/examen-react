import { AxiosError } from "axios";

/**
 * Best-effort human message from an unknown error. Huma (the Go API) returns
 * RFC-7807 problem bodies — `{ title, detail, status, errors }` — so prefer
 * `detail`, then `title`, then the axios/JS message.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { detail?: string; title?: string }
            | undefined;
        return (
            data?.detail ??
            data?.title ??
            error.message ??
            "Request failed"
        );
    }
    if (error instanceof Error) return error.message;
    return "Something went wrong";
}
