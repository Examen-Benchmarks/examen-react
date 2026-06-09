import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useGetResources } from "@examen/crud";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import type { Resource } from "./registry";

export default function ResourceListPage<T extends { id?: string }>({
    resource,
}: {
    resource: Resource<T>;
}) {
    const navigate = useNavigate();
    const { objectQuery } = useGetResources<T>({
        url: resource.listUrl!,
        schema: resource.itemSchema,
        keys: [resource.name],
    });

    const items = objectQuery.data ?? [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {resource.label}
                    </h1>
                    {objectQuery.data && (
                        <p className="text-sm text-muted-foreground">
                            {items.length} {items.length === 1 ? "item" : "items"}
                        </p>
                    )}
                </div>
                {resource.createSchema && (
                    <Button asChild>
                        <Link to={`/${resource.name}/new`}>
                            <Plus className="size-4" />
                            New {resource.singular}
                        </Link>
                    </Button>
                )}
            </div>

            {objectQuery.isLoading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            ) : objectQuery.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(objectQuery.error)}
                </p>
            ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No {resource.label.toLowerCase()} yet.
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {resource.columns.map((c) => (
                                    <TableHead key={c.key}>
                                        {c.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow
                                    key={item.id ?? i}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/${resource.name}/${item.id}`,
                                        )
                                    }
                                >
                                    {resource.columns.map((c) => (
                                        <TableCell key={c.key}>
                                            {c.cell(item)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
