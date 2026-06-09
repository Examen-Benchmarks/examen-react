import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type { AxiosError } from "axios";

export interface IQueryResult {
    queryResult: UseQueryResult<unknown, AxiosError>;
    customResponses?: Record<number, string>;
}

export interface IMutationResult<TData = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryResult: UseMutationResult<TData, AxiosError, any, unknown>;
    successMessage: string;
    customResponses?: Record<number, string>;
}
