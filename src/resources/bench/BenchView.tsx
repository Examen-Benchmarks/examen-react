import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowLeftRight,
    ChevronDown,
    Filter,
    FolderTree,
    X,
} from "lucide-react";
import { useGetResource } from "@examen/crud";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import { BenchSchema, type Bench } from "../schemas";
import { fmt, gradeTint } from "../report/format";
import VersionComponentsHover from "../report/VersionComponentsHover";
import GradeDelta from "../report/GradeDelta";
import FilterBuilder from "../filter/FilterBuilder";
import {
    countConditions,
    newRoot,
    serializeAttrs,
    toEditorRoot,
    toFilterExpr,
    type GroupNode,
} from "../filter/filterExpr";
import { useSavedViews, type SavedView } from "../filter/useSavedViews";
import { useBenchOverview, type CollectionGroup } from "./useBenchOverview";

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

    // Attribute filter (FE-5): the draft tree is edited locally; only Apply
    // commits its serialized form to `appliedAttrs`, which narrows the versions.
    const [filterRoot, setFilterRoot] = useState<GroupNode>(() => newRoot());
    const [appliedAttrs, setAppliedAttrs] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [viewName, setViewName] = useState("");
    // The saved view awaiting delete confirmation; null ⇒ dialog closed.
    const [deleteTarget, setDeleteTarget] = useState<SavedView | null>(null);

    const b = useBenchOverview(benchId, appliedAttrs);
    const sv = useSavedViews(benchId);

    // Loading a saved view populates the builder and applies it in one go.
    const loadView = (v: SavedView) => {
        const root = toEditorRoot(v.filter);
        setFilterRoot(root);
        setAppliedAttrs(serializeAttrs(root));
        setFilterOpen(true);
    };
    const saveView = async () => {
        const name = viewName.trim();
        if (!name) return;
        await sv.create({ name, benchId, filter: toFilterExpr(filterRoot) });
        setViewName("");
    };

    const pendingAttrs = serializeAttrs(filterRoot);
    const dirty = pendingAttrs !== appliedAttrs;
    const conditionCount = countConditions(filterRoot);
    // Keep the filter visible once there's something to filter or a filter is
    // applied — so a zero-result filter doesn't hide its own controls.
    const showFilter = b.rows.length > 0 || appliedAttrs !== null;

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

            <div className="flex flex-wrap items-start justify-between gap-4">
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
                {b.rows.length >= 2 && (
                    <Button asChild variant="outline" size="sm">
                        <Link to={`/benches/${benchId}/compare`}>
                            <ArrowLeftRight className="size-4" />
                            Compare versions
                        </Link>
                    </Button>
                )}
            </div>

            {b.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(b.error)}
                </p>
            ) : (
                <>
                    {showFilter && (
                        <section className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterOpen((o) => !o)}
                                className="flex items-center gap-1.5 self-start text-sm font-semibold"
                                aria-expanded={filterOpen}
                            >
                                <ChevronDown
                                    className={cn(
                                        "size-4 text-muted-foreground transition-transform",
                                        !filterOpen && "-rotate-90",
                                    )}
                                />
                                <Filter className="size-4 text-muted-foreground" />
                                Filter versions
                                {appliedAttrs && (
                                    <Badge variant="secondary">active</Badge>
                                )}
                            </button>

                            {filterOpen ? (
                                <div className="flex flex-col gap-3 rounded-lg border p-4">
                                    <FilterBuilder
                                        benchId={benchId}
                                        value={filterRoot}
                                        onChange={setFilterRoot}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setAppliedAttrs(pendingAttrs)
                                            }
                                            disabled={!dirty}
                                        >
                                            Apply filter
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setFilterRoot(newRoot());
                                                setAppliedAttrs(null);
                                            }}
                                            disabled={
                                                appliedAttrs === null &&
                                                conditionCount === 0
                                            }
                                        >
                                            Clear
                                        </Button>
                                        {dirty && appliedAttrs !== null && (
                                            <span className="text-xs text-muted-foreground">
                                                unapplied changes
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 border-t pt-3">
                                        {sv.listError && (
                                            <span className="text-xs text-destructive">
                                                Couldn't load saved views:{" "}
                                                {getErrorMessage(sv.listError)}
                                            </span>
                                        )}
                                        {!sv.isLoading &&
                                            !sv.listError &&
                                            sv.views.length === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    No saved views yet — build a
                                                    filter, name it, and save.
                                                </span>
                                            )}
                                        {sv.views.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Saved views
                                                </span>
                                                {sv.views.map((v) => (
                                                    <span
                                                        key={v.id}
                                                        className="inline-flex h-8 items-center gap-1 rounded-md border pr-1 pl-2.5 text-xs"
                                                    >
                                                        <button
                                                            type="button"
                                                            className="hover:underline"
                                                            title="Load this filter"
                                                            onClick={() =>
                                                                loadView(v)
                                                            }
                                                        >
                                                            {v.name}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label={`Delete saved view ${v.name}`}
                                                            title="Delete saved view"
                                                            className="rounded p-1 text-red-600 hover:bg-red-500/10 dark:text-red-500"
                                                            onClick={() =>
                                                                setDeleteTarget(v)
                                                            }
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                value={viewName}
                                                onChange={(e) =>
                                                    setViewName(e.target.value)
                                                }
                                                placeholder="Name this filter"
                                                className="h-8 w-48"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={saveView}
                                                disabled={
                                                    !viewName.trim() ||
                                                    conditionCount === 0
                                                }
                                            >
                                                Save view
                                            </Button>
                                            {(sv.createError ||
                                                sv.removeError) && (
                                                <span className="text-xs text-destructive">
                                                    {getErrorMessage(
                                                        sv.createError ??
                                                            sv.removeError,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                appliedAttrs && (
                                    <p className="text-xs text-muted-foreground">
                                        Filtered to versions matching{" "}
                                        {conditionCount} condition
                                        {conditionCount === 1 ? "" : "s"}.{" "}
                                        <button
                                            type="button"
                                            className="underline"
                                            onClick={() => {
                                                setFilterRoot(newRoot());
                                                setAppliedAttrs(null);
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </p>
                                )
                            )}
                        </section>
                    )}

                    {b.isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : b.rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {appliedAttrs
                                ? "No versions match this filter."
                                : "No versions for this bench yet."}
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
                                                    <TableCell className="text-xs">
                                                        <VersionComponentsHover
                                                            version={version}
                                                        />
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
                                    trendFor={b.gradeTrendFor}
                                    onExperimentClick={(expId) =>
                                        navigate(`/experiments/${expId}`)
                                    }
                                />
                            ))
                        )}
                    </section>
                        </>
                    )}
                </>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete saved view?"
                description={`“${deleteTarget?.name}” will be removed. This can’t be undone. Your current filter stays applied.`}
                confirmLabel="Delete view"
                onConfirm={async () => {
                    if (!deleteTarget?.id) return;
                    try {
                        await sv.remove(deleteTarget.id);
                        setDeleteTarget(null);
                    } catch {
                        // Stay open; the error shows in the panel.
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

/** One collection's experiments, under its breadcrumb heading. */
function CollectionGroupBlock({
    group,
    trendFor,
    onExperimentClick,
}: {
    group: CollectionGroup;
    trendFor: (experimentId: string) => (number | null)[];
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
                                    <TableCell className="w-24 text-right">
                                        <GradeDelta
                                            values={trendFor(exp.experiment.id)}
                                        />
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
