import { AxiosError } from "axios";

export interface UseStreamingQuery<TData> {
	data: TData;
	error: AxiosError;
	isFetching: boolean;
	isError: boolean;
	isStreaming: boolean;
	refetch: () => void;
}
