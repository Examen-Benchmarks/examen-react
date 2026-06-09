import {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useGetResource, useMutateResource } from "@examen/crud";
import {
    MeSchema,
    LoginResultSchema,
    type Me,
    type LoginInput,
    type LoginResult,
} from "./schemas";

const ME_KEY = "/auth/me";

interface AuthState {
    user: Me | null;
    /** True only during the initial session check. */
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (input: LoginInput) => Promise<LoginResult>;
    logout: () => Promise<unknown>;
    loginPending: boolean;
    loginError: AxiosError | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    // The session probe. A 401 (no/expired cookie) lands in the error state —
    // that simply means "logged out", not a crash.
    const { objectQuery: me } = useGetResource<Me>({
        url: ME_KEY,
        schema: MeSchema,
        staleTime: 5 * 60 * 1000,
    });

    const invalidateMe = () =>
        queryClient.invalidateQueries({ queryKey: [ME_KEY] });

    const { objectMutation: loginMutation } = useMutateResource<
        LoginInput,
        LoginResult
    >({
        url: "/auth/login",
        method: "POST",
        format: "JSON",
        schema: LoginResultSchema,
        onSuccess: (data) => {
            // Seed `me` from the login result so the guard sees an authenticated
            // user immediately (no redirect race while `/auth/me` refetches),
            // then reconcile against the server.
            queryClient.setQueryData<Me>([ME_KEY], {
                userId: data.userId,
                isAdmin: data.isAdmin,
                via: "session",
            });
            invalidateMe();
        },
    });

    const { objectMutation: logoutMutation } = useMutateResource<
        void,
        null
    >({
        url: "/auth/logout",
        method: "POST",
        format: "JSON",
        schema: null,
        onSuccess: () => {
            queryClient.clear();
        },
    });

    const value = useMemo<AuthState>(
        () => ({
            user: me.data ?? null,
            isLoading: me.isLoading,
            isAuthenticated: !!me.data && !me.isError,
            login: (input) => loginMutation.mutateAsync(input),
            logout: () => logoutMutation.mutateAsync(),
            loginPending: loginMutation.isPending,
            loginError: loginMutation.error,
        }),
        [
            me.data,
            me.isLoading,
            me.isError,
            loginMutation,
            logoutMutation,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
