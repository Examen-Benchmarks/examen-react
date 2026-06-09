import type { AxiosError } from "axios";

export interface ErrorComponentProps {
    error: AxiosError | null;
    customResponses?: Record<number, string> | null | undefined;
}
