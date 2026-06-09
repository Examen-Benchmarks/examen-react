import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import RequireAuth from "@/auth/RequireAuth";
import LoginPage from "@/auth/LoginPage";
import AppShell from "@/components/AppShell";
import ResourceListPage from "@/resources/ResourceListPage";
import ResourceCreatePage from "@/resources/ResourceCreatePage";
import ResourceDetailPage from "@/resources/ResourceDetailPage";
import { resources } from "@/resources/registry";

/** AuthProvider lives inside the router so every route can read `useAuth`. */
function AuthRoot() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
}

export const router = createBrowserRouter([
    {
        element: <AuthRoot />,
        children: [
            { path: "/login", element: <LoginPage /> },
            {
                element: <RequireAuth />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                index: true,
                                element: (
                                    <Navigate
                                        to={`/${resources[0].name}`}
                                        replace
                                    />
                                ),
                            },
                            ...resources.flatMap((r) => [
                                {
                                    path: r.name,
                                    element: <ResourceListPage resource={r} />,
                                },
                                {
                                    path: `${r.name}/new`,
                                    element: (
                                        <ResourceCreatePage resource={r} />
                                    ),
                                },
                                {
                                    path: `${r.name}/:id`,
                                    element: (
                                        <ResourceDetailPage resource={r} />
                                    ),
                                },
                            ]),
                        ],
                    },
                ],
            },
        ],
    },
]);
