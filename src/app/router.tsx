import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import RequireAuth from "@/auth/RequireAuth";
import LoginPage from "@/auth/LoginPage";
import AppShell from "@/components/AppShell";
import ResourceListPage from "@/resources/ResourceListPage";
import ResourceCreatePage from "@/resources/ResourceCreatePage";
import ResourceDetailPage from "@/resources/ResourceDetailPage";
import { navResources, detailResources } from "@/resources/registry";

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
                                        to={`/${navResources[0].name}`}
                                        replace
                                    />
                                ),
                            },
                            // Top-level list (+ create) for nav resources.
                            ...navResources.flatMap((r) => [
                                {
                                    path: r.name,
                                    element: <ResourceListPage resource={r} />,
                                },
                                ...(r.createSchema
                                    ? [
                                          {
                                              path: `${r.name}/new`,
                                              element: (
                                                  <ResourceCreatePage
                                                      resource={r}
                                                  />
                                              ),
                                          },
                                      ]
                                    : []),
                            ]),
                            // Flat detail route for every navigable resource.
                            ...detailResources.map((r) => ({
                                path: `${r.name}/:id`,
                                element: <ResourceDetailPage resource={r} />,
                            })),
                        ],
                    },
                ],
            },
        ],
    },
]);
