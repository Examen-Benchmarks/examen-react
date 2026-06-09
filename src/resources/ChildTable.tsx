import { useNavigate } from "react-router-dom";
import { useGetResources } from "@examen/crud";
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
import { registry, type ChildSection } from "./registry";
import ExperimentNotesHover from "./report/ExperimentNotesHover";
import ExperimentGradeCell from "./report/ExperimentGradeCell";

/**
 * One parent-scoped child list rendered on a detail page. Looks the child
 * resource up in the registry for its schema/columns, fetches `listUrl(parentId)`,
 * and links rows to the child's detail route when it has one.
 */
export default function ChildTable({
    section,
    parentId,
}: {
    section: ChildSection;
    parentId: string;
}) {
    const navigate = useNavigate();
    const child = registry[section.resource];
    const { objectQuery } = useGetResources({
        url: section.listUrl(parentId),
        schema: child.itemSchema,
        keys: [section.resource, parentId],
    });

    const items = objectQuery.data ?? [];
    const navigable = !!child.itemUrl;

    return (
        <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
                {section.heading}
                {objectQuery.data && (
                    <span className="ml-1 text-muted-foreground">
                        ({items.length})
                    </span>
                )}
            </h3>

            {objectQuery.isLoading ? (
                <Skeleton className="h-9 w-full" />
            ) : objectQuery.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(objectQuery.error)}
                </p>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No {section.heading.toLowerCase()}.
                </p>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {child.columns.map((c) => (
                                    <TableHead key={c.key}>
                                        {c.header}
                                    </TableHead>
                                ))}
                                {section.variant === "notes" && (
                                    <TableHead className="text-right">
                                        Grade
                                    </TableHead>
                                )}
                                {section.variant === "notes" && (
                                    <TableHead className="w-10" />
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow
                                    key={item.id ?? i}
                                    className={navigable ? "cursor-pointer" : undefined}
                                    onClick={
                                        navigable
                                            ? () =>
                                                  navigate(
                                                      `/${child.name}/${item.id}`,
                                                  )
                                            : undefined
                                    }
                                >
                                    {child.columns.map((c) => (
                                        <TableCell key={c.key}>
                                            {c.cell(item)}
                                        </TableCell>
                                    ))}
                                    {section.variant === "notes" &&
                                        item.id && (
                                            <TableCell className="text-right">
                                                <ExperimentGradeCell
                                                    experimentId={item.id}
                                                />
                                            </TableCell>
                                        )}
                                    {section.variant === "notes" &&
                                        item.id && (
                                            <TableCell className="w-10">
                                                <ExperimentNotesHover
                                                    experimentId={item.id}
                                                />
                                            </TableCell>
                                        )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </section>
    );
}
