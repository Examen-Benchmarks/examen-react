import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import { useGetResource } from "@examen/crud";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/errors";
import {
    ExperimentSchema,
    type Experiment,
    type Metric,
    type Run,
} from "../schemas";
import { type ExperimentReport } from "./results";
import { fmt, gradeTint, scoreTint } from "./format";
import { useExperimentReport } from "./useExperimentReport";
import EvolutionSection from "./EvolutionSection";
import VersionComponentsHover from "./VersionComponentsHover";
import RunsTable from "./RunsTable";
import RunsDrilldown, { type Drill } from "./RunsDrilldown";

export default function ExperimentView() {
    const { id } = useParams<{ id: string }>();
    const experimentId = id!;
    const { objectQuery: expQ } = useGetResource<Experiment>({
        url: `/experiments/${experimentId}`,
        schema: ExperimentSchema,
        enabled: !!id,
    });
    const r = useExperimentReport(experimentId);
    const [drill, setDrill] = useState<Drill>(null);

    const experiment = expQ.data;
    const selectedVersion = r.versions.find(
        (v) => v.id === r.selectedVersionId,
    );

    return (
        <div className="flex w-full flex-col gap-6">
            {experiment?.benchId && (
                <Button asChild variant="ghost" size="sm" className="self-start">
                    <Link to={`/benches/${experiment.benchId}`}>
                        <ArrowLeft className="size-4" />
                        Bench
                    </Link>
                </Button>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {experiment?.name ?? "Experiment"}
                    </h1>
                    {r.report && (
                        <p className="text-sm text-muted-foreground">
                            {r.report.runSummary.total} runs ·{" "}
                            <span className="text-green-600 dark:text-green-500">
                                {r.report.runSummary.ok} ok
                            </span>{" "}
                            ·{" "}
                            <span className="text-red-600 dark:text-red-500">
                                {r.report.runSummary.errored} errored
                            </span>{" "}
                            · {fmt(r.report.runSummary.succeededPct)}% succeeded
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {r.report?.grade != null && (
                        <div
                            className="rounded-md border px-3 py-1.5 text-center"
                            style={{ backgroundColor: gradeTint(r.report.grade) }}
                        >
                            <div className="text-xs text-muted-foreground">
                                Grade
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                                {fmt(r.report.grade)}
                            </div>
                        </div>
                    )}
                    {r.versions.length > 0 && r.selectedVersionId && (
                        <Select
                            value={r.selectedVersionId}
                            onValueChange={r.setSelectedVersionId}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {r.versions.map((v, i) => (
                                    <SelectItem key={v.id} value={v.id!}>
                                        {(v.componentsHash ?? v.id!).slice(0, 10)}
                                        {i === 0 ? " · latest" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {selectedVersion && (
                        <VersionComponentsHover version={selectedVersion}>
                            <span
                                className="inline-flex size-8 cursor-help items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                                aria-label="Version components"
                                title="Version components"
                            >
                                <Info className="size-4" />
                            </span>
                        </VersionComponentsHover>
                    )}
                </div>
            </div>

            {r.isLoading ? (
                <Skeleton className="h-64 w-full" />
            ) : r.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(r.error)}
                </p>
            ) : r.noVersions ? (
                <p className="text-sm text-muted-foreground">
                    No versions with runs yet for this experiment.
                </p>
            ) : r.report ? (
                <>
                    <EvolutionSection
                        experimentId={experimentId}
                        selectedVersionId={r.selectedVersionId}
                        onSelectVersion={(vid) => r.setSelectedVersionId(vid)}
                    />

                    <section className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold">
                            Cases · mean per case, expand for runs
                        </h3>
                        <div className="overflow-hidden rounded-lg border">
                            <MeansMatrix
                                report={r.report}
                                runs={r.runs}
                                metrics={r.metrics}
                                onRunClick={(run, title) =>
                                    setDrill({ title, runs: [run] })
                                }
                            />
                        </div>
                    </section>
                </>
            ) : null}

            <RunsDrilldown
                drill={drill}
                onClose={() => setDrill(null)}
                metrics={r.metrics}
            />
        </div>
    );
}

/**
 * Case × metric matrix of means (the experiment summary), where each case row
 * expands in place to reveal its individual runs — so the aggregate and the raw
 * runs live in one drillable table instead of two disconnected ones. All runs
 * are already loaded, so expanding just filters client-side. Single-expand.
 */
function MeansMatrix({
    report,
    runs,
    metrics,
    onRunClick,
}: {
    report: ExperimentReport;
    runs: Run[];
    metrics: Metric[];
    onRunClick: (run: Run, title: string) => void;
}) {
    const [openId, setOpenId] = useState<string | null>(null);
    const colSpan = report.metrics.length + 2;

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-background">
                            Case
                        </TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        {report.metrics.map((m) => (
                            <TableHead key={m.key} className="text-right">
                                {m.name}
                                <span className="ml-1 text-muted-foreground">
                                    {m.kind}
                                </span>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {report.cases.map((row) => {
                        // One run means nothing to expand into — a single-row
                        // sub-table is just noise. Keep those rows flat.
                        const expandable = row.runCount > 1;
                        const open = expandable && openId === row.case.id;
                        return (
                            <Fragment key={row.case.id}>
                                <TableRow
                                    className={cn(expandable && "cursor-pointer")}
                                    onClick={
                                        expandable
                                            ? () =>
                                                  setOpenId(
                                                      open ? null : row.case.id,
                                                  )
                                            : undefined
                                    }
                                >
                                    <TableCell className="sticky left-0 bg-background font-medium">
                                        <span className="flex items-center gap-1.5">
                                            {expandable ? (
                                                <ChevronRight
                                                    className={cn(
                                                        "size-4 shrink-0 text-muted-foreground transition-transform",
                                                        open && "rotate-90",
                                                    )}
                                                />
                                            ) : (
                                                <span className="size-4 shrink-0" />
                                            )}
                                            <Link
                                                to={`/cases/${row.case.id}`}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="hover:underline"
                                            >
                                                {row.case.name || row.case.key}
                                            </Link>
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {row.runCount}
                                        {row.erroredCount > 0 && (
                                            <span className="ml-1 text-red-600 dark:text-red-500">
                                                ({row.erroredCount} err)
                                            </span>
                                        )}
                                    </TableCell>
                                    {report.metrics.map((m) => {
                                        const cell = row.cells[m.key];
                                        if (!cell)
                                            return (
                                                <TableCell
                                                    key={m.key}
                                                    className="text-right text-muted-foreground"
                                                >
                                                    —
                                                </TableCell>
                                            );
                                        return (
                                            <TableCell
                                                key={m.key}
                                                className="text-right tabular-nums"
                                                style={{
                                                    backgroundColor: scoreTint(
                                                        cell.mean,
                                                        m.kind,
                                                    ),
                                                }}
                                                title={`mean ${fmt(cell.mean)} · n=${cell.n} · σ=${cell.stddev == null ? "—" : fmt(cell.stddev)} · [${fmt(cell.min)}, ${fmt(cell.max)}]`}
                                            >
                                                {fmt(cell.mean)}
                                                <span className="ml-1 text-xs text-muted-foreground">
                                                    (n={cell.n})
                                                </span>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                                {open && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={colSpan}
                                            className="bg-muted/30 p-0"
                                        >
                                            <div className="p-2 pl-8">
                                                <RunsTable
                                                    runs={runs.filter(
                                                        (run) =>
                                                            run.caseId ===
                                                            row.case.id,
                                                    )}
                                                    metrics={metrics}
                                                    cases={[row.case]}
                                                    showCaseColumn={false}
                                                    onRunClick={onRunClick}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        );
                    })}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className="sticky left-0 bg-background font-medium">
                            All
                        </TableCell>
                        <TableCell />
                        {report.metrics.map((m) => {
                            const agg = report.metricAggregates[m.key];
                            return (
                                <TableCell
                                    key={m.key}
                                    className="text-right font-medium tabular-nums"
                                >
                                    {agg ? fmt(agg.mean) : "—"}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}
