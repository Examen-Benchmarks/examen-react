import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { mutateObject } from "../api/mutateObject";
import type { IMutationProps } from "../types/MutationProps";
import { useCrudContext } from "../context/hooks";

export default function useMutateResource<P, R>({
    url,
    payload,
    schema,
    onSuccess,
    format,
    method,
}: IMutationProps<P, R>) {
    const { baseUrl, timeoutMs } = useCrudContext();
    const objectMutation = useMutation<R, AxiosError, P | void>({
        mutationFn: (dynamicPayload: P | void) =>
            mutateObject<P, R>({
                url,
                payload:
                    dynamicPayload !== undefined ? dynamicPayload : payload,
                schema,
                format,
                method: method,
                baseUrl,
                timeoutMs,
            }),
        onSuccess,
    });

    return { objectMutation };
}
