import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import FullPageLoader from "@/components/FullPageLoader";

/** Route guard: gates protected routes on a live session (`/auth/me`). */
export default function RequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullPageLoader />;
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }
    return <Outlet />;
}
