import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderTree } from "lucide-react";
import { useGetResource } from "@examen/crud";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { BenchSchema, type Bench, type Version } from "../schemas";
import { fmt, gradeTint } from "../report/format";
import { useBenchOverview, type CollectionGroup } from "./useBenchOverview";

function shortHash(v: Version): string {
    return (v.componentsHash ?? v.id ?? "").slice(0, 10);
}

export default function BenchView() {
    const { id } = useParams<{ id: string }>();
    const benchId = id!;
    const navigate = useNavigate();

    const { objectQuery: benchQ } = useGetResource<Bench>({
        url: `/benches/${benchId}`,
        schema: BenchSchema,
        enabled: !!id,
    });
    const bench = benchQ.data;

    const b = useBenchOverview(benchId);

    return (
        <div className="flex w-full flex-col gap-6">
            {bench?.projectId && (
                <Button asChild variant="ghost" size="sm" className="self-start">
                    <Link to={`/projects/${bench.projectId}`}>
                        <ArrowLeft className="size-4" />
                        Project
                    </Link>
                </Button>
            )}

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {bench?.name ?? "Bench"}
                </h1>
                {bench?.description && (
                    <p className="text-sm text-muted-foreground">
                        {bench.description}
                    </p>
                )}
            </div>

            {b.isLoading ? (
                <Skeleton className="h-48 w-full" />
            ) : b.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(b.error)}
                </p>
            ) : b.noVersions ? (
                <p className="text-sm text-muted-foreground">
                    No versions for this bench yet.
                </p>
            ) : (
                <>
                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold">Versions</h3>
                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">
                                            Runs
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Errors
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {b.rows.map(
                                        ({ version, results, isLoading }) => {
                                            const selected =
                                                version.id ===
                                                b.selectedVersionId;
                                            const rs = results?.run_summary;
                                            const errors = rs
                                                ? rs.failed + rs.errored
                                                : null;
                                            return (
                                                <TableRow
                                                    key={version.id}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        selected && "bg-muted",
                                                    )}
                                                    onClick={() =>
                                                        b.setSelectedVersionId(
                                                            version.id!,
                                                        )
                                                    }
                                                >
                                                    <TableCell className="font-mono text-xs">
                                                        {shortHash(version)}
                                                        {selected && (
                                                            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                                selected
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {version.createdAt?.toLocaleString() ??
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {isLoading
                                                            ? "…"
                                                            : (rs?.total ?? "—")}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {isLoading ? (
                                                            "…"
                                                        ) : errors == null ? (
                                                            "—"
                                                        ) : errors > 0 ? (
                                                            <span className="text-red-600 dark:text-red-500">
                                                                {errors}
                                                            </span>
                                                        ) : (
                                                            0
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>

                    <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold">Experiments</h3>
                        {b.selectedLoading ? (
                            <Skeleton className="h-40 w-full" />
                        ) : b.groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No experiments with runs at this version.
                            </p>
                        ) : (
                            b.groups.map((g) => (
                                <CollectionGroupBlock
                                    key={g.key}
                                    group={g}
                                    onExperimentClick={(expId) =>
                                        navigate(`/experiments/${expId}`)
                                    }
                                />
                            ))
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

/** One collection's experiments, under its breadcrumb heading. */
function CollectionGroupBlock({
    group,
    onExperimentClick,
}: {
    group: CollectionGroup;
    onExperimentClick: (experimentId: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FolderTree className="size-3.5" />
                {group.path.length
                    ? group.path.map((p) => p.name).join(" / ")
                    : "Bench root"}
            </h4>
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableBody>
                        {group.experiments.map((exp) => {
                            const grade = exp.grade.value;
                            const rs = exp.run_summary;
                            const errors = rs.failed + rs.errored;
                            return (
                                <TableRow
                                    key={exp.experiment.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        onExperimentClick(exp.experiment.id)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {exp.experiment.name ||
                                            exp.experiment.key}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {rs.total} runs
                                        {errors > 0 && (
                                            <span className="ml-1 text-red-600 dark:text-red-500">
                                                · {errors} err
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-20 text-right">
                                        {grade == null ? (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-block rounded px-1.5 py-0.5 font-medium tabular-nums"
                                                style={{
                                                    backgroundColor:
                                                        gradeTint(grade),
                                                }}
                                            >
                                                {fmt(grade)}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
