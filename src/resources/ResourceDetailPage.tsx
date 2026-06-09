import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetResource } from "@examen/crud";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import type { Resource } from "./registry";

export default function ResourceDetailPage<T extends { id?: string }>({
    resource,
}: {
    resource: Resource<T>;
}) {
    const { id } = useParams<{ id: string }>();
    const { objectQuery } = useGetResource<T>({
        url: `${resource.path}/${id}`,
        schema: resource.itemSchema,
        enabled: !!id,
    });
    const item = objectQuery.data;

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
                    <CardTitle>
                        {item
                            ? String(item[resource.titleField] ?? resource.singular)
                            : resource.singular}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {objectQuery.isLoading ? (
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-5 w-2/3" />
                            ))}
                        </div>
                    ) : objectQuery.isError ? (
                        <p className="text-sm text-destructive" role="alert">
                            {getErrorMessage(objectQuery.error)}
                        </p>
                    ) : item ? (
                        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
                            {resource.columns.map((c) => (
                                <div key={c.key} className="contents">
                                    <dt className="text-muted-foreground">
                                        {c.header}
                                    </dt>
                                    <dd className="font-medium break-words">
                                        {c.cell(item)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
