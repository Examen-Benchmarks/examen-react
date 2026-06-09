import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMutateResource } from "@examen/crud";
import { SchemaForm } from "@/forms/SchemaForm";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Resource } from "./registry";

export default function ResourceCreatePage<T extends { id?: string }>({
    resource,
}: {
    resource: Resource<T>;
}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { objectMutation } = useMutateResource<Record<string, unknown>, T>({
        url: resource.listUrl!,
        method: "POST",
        format: "JSON",
        schema: resource.itemSchema,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [resource.listUrl] });
            toast.success(`${resource.singular} created`);
            navigate(`/${resource.name}`);
        },
    });

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <Button asChild variant="ghost" size="sm" className="self-start">
                <Link to={`/${resource.name}`}>
                    <ArrowLeft className="size-4" />
                    {resource.label}
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>New {resource.singular}</CardTitle>
                </CardHeader>
                <CardContent>
                    <SchemaForm
                        schema={resource.createSchema!}
                        fields={resource.createFields}
                        submitLabel={`Create ${resource.singular}`}
                        onSubmit={(values) =>
                            objectMutation.mutateAsync(
                                values as Record<string, unknown>,
                            )
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
