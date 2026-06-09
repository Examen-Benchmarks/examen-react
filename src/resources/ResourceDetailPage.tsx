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
import ChildTable from "./ChildTable";
import { registry, type Resource } from "./registry";

function isEmptyJson(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === "object" && Object.keys(value).length === 0)
        return true;
    return false;
}

export default function ResourceDetailPage<T extends { id?: string }>({
    resource,
}: {
    resource: Resource<T>;
}) {
    const { id } = useParams<{ id: string }>();
    const { objectQuery } = useGetResource<T>({
        url: resource.itemUrl!(id!),
        schema: resource.itemSchema,
        enabled: !!id,
    });
    const item = objectQuery.data;

    // Back link: to the parent entity if known, else the top-level list.
    let back: { to: string; label: string } | null = null;
    if (item && resource.parentLink) {
        const ref = resource.parentLink(item);
        if (ref) {
            const parent = registry[ref.resource];
            back = { to: `/${parent.name}/${ref.id}`, label: parent.singular };
        }
    } else if (resource.listUrl) {
        back = { to: `/${resource.name}`, label: resource.label };
    }

    const title = item
        ? `${resource.singular} · ${String(item[resource.titleField] ?? "")}`
        : resource.singular;

    return (
        <div className="flex w-full flex-col gap-6">
            {back && (
                <Button asChild variant="ghost" size="sm" className="self-start">
                    <Link to={back.to}>
                        <ArrowLeft className="size-4" />
                        {back.label}
                    </Link>
                </Button>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="break-words">{title}</CardTitle>
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

            {item &&
                resource.detailJson?.map((s) => {
                    const value = s.value(item);
                    if (isEmptyJson(value)) return null;
                    return (
                        <Card key={s.heading}>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {s.heading}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    );
                })}

            {item?.id &&
                resource.children?.map((section) => (
                    <ChildTable
                        key={section.resource + section.heading}
                        section={section}
                        parentId={item.id!}
                    />
                ))}
        </div>
    );
}
