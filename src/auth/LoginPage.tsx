import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { SchemaForm } from "@/forms/SchemaForm";
import { LoginInputSchema } from "./schemas";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";

export default function LoginPage() {
    const { login, isAuthenticated, loginError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/";

    if (isAuthenticated) return <Navigate to={from} replace />;

    return (
        <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>Examen dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <SchemaForm
                        schema={LoginInputSchema}
                        fields={[
                            {
                                name: "email",
                                kind: "email",
                                placeholder: "you@example.com",
                            },
                            { name: "password", kind: "password" },
                        ]}
                        submitLabel="Sign in"
                        submitError={
                            loginError ? getErrorMessage(loginError) : null
                        }
                        onSubmit={async (values) => {
                            await login(values);
                            navigate(from, { replace: true });
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
