import type { AxiosError } from "axios";
import { useCrudT } from "../context/hooks";

/**
 * Hook that resolves an error message from an AxiosError.
 *
 * Resolution order:
 * 1. Custom responses map (keyed by HTTP status code)
 * 2. Backend `detail` field (used as a translation key via `customErrors.<detail>`)
 * 3. Translated HTTP status code (`errors.http.<code>`)
 * 4. Generic fallback (`errors.unknown`)
 */
export default function useErrorMessage(
    error: AxiosError | null | undefined,
    customResponses?: Record<number, string> | null,
): string {
    const t = useCrudT();

    if (!error) return "";

    const statusCode = error.response?.status;

    // 1. Caller-provided custom response for this status code
    if (statusCode && customResponses?.[statusCode]) {
        return customResponses[statusCode];
    }

    // 2. Backend "detail" field → use as translation key
    const detail = (error.response?.data as Record<string, unknown>)?.code;
    if (detail && typeof detail === "string") {
        const translated = t(`customErrors.${detail}`, { defaultValue: "" });
        if (translated) return translated;
        // If the detail string itself is readable, return it directly
        return detail;
    }

    // 3. Translated HTTP status code
    if (statusCode) {
        const httpMessage = t(`errors.http.${statusCode}`, {
            defaultValue: "",
        });
        if (httpMessage) return httpMessage;
    }

    // 4. Fallback
    return t("errors.unknown");
}
