import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FolderKanban, Key, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { navResources } from "@/resources/registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="grid min-h-svh grid-cols-[14rem_1fr]">
            <aside className="flex flex-col border-r bg-sidebar p-4 text-sidebar-foreground">
                <div className="mb-6 px-2 text-lg font-semibold tracking-tight">
                    Examen
                </div>
                <nav className="flex flex-col gap-1">
                    {navResources.map((r) => (
                        <NavLink
                            key={r.name}
                            to={`/${r.name}`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "hover:bg-sidebar-accent/50",
                                )
                            }
                        >
                            <FolderKanban className="size-4" />
                            {r.label}
                        </NavLink>
                    ))}
                </nav>

                <nav className="mt-2 flex flex-col gap-1 border-t pt-2">
                    <NavLink
                        to="/api-keys"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "hover:bg-sidebar-accent/50",
                            )
                        }
                    >
                        <Key className="size-4" />
                        API keys
                    </NavLink>
                </nav>
            </aside>

            <div className="flex min-w-0 flex-col">
                <header className="flex h-14 items-center justify-end gap-3 border-b px-6">
                    {user?.isAdmin && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="size-3.5" />
                            Admin
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={onLogout}>
                        <LogOut className="size-4" />
                        Sign out
                    </Button>
                </header>
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
