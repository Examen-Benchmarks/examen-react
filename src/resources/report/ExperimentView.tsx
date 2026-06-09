import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetResource } from "@examen/crud";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/errors";
import {
    ExperimentSchema,
    type Case,
    type Experiment,
    type Metric,
    type Run,
} from "../schemas";
import { normalizeScore, type ExperimentReport } from "./aggregate";
import { useExperimentReport } from "./useExperimentReport";

function fmt(n: number): string {
    return Number(n.toFixed(2)).toString();
}

/** Red→green tint for a score-like cell, or undefined for non-score kinds. */
function scoreTint(value: number, kind: string): string | undefined {
    const t = normalizeScore(value, kind);
    if (t == null) return undefined;
    const c = Math.max(0, Math.min(1, t));
    return `hsl(${c * 120} 65% 45% / 0.18)`;
}

function gradeTint(grade: number): string {
    const c = Math.max(0, Math.min(1, grade));
    return `hsl(${c * 120} 65% 45% / 0.22)`;
}

type Drill = { title: string; runs: Run[] } | null;

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
    const ready = !r.isLoading && !r.isError && !r.noVersions && r.report;

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
            ) : ready && r.report ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Summary · mean per case
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MeansMatrix
                                report={r.report}
                                onCaseClick={(c) =>
                                    setDrill({
                                        title: c.name || c.key || "Case",
                                        runs: r.runs.filter(
                                            (run) => run.caseId === c.id,
                                        ),
                                    })
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                All runs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RunsTable
                                report={r.report}
                                runs={r.runs}
                                metrics={r.metrics}
                                cases={r.cases}
                                onRunClick={(run, title) =>
                                    setDrill({ title, runs: [run] })
                                }
                            />
                        </CardContent>
                    </Card>
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

function MeansMatrix({
    report,
    onCaseClick,
}: {
    report: ExperimentReport;
    onCaseClick: (c: Case) => void;
}) {
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
                    {report.cases.map((row) => (
                        <TableRow
                            key={row.case.id}
                            className="cursor-pointer"
                            onClick={() => onCaseClick(row.case)}
                        >
                            <TableCell className="sticky left-0 bg-background font-medium">
                                {row.case.name || row.case.key}
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
                                        title={`mean ${fmt(cell.mean)} · n=${cell.n} · σ=${fmt(cell.stddev)} · [${fmt(cell.min)}, ${fmt(cell.max)}]`}
                                    >
                                        {fmt(cell.mean)}
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            (n={cell.n})
                                        </span>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
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

function RunsTable({
    report,
    runs,
    metrics,
    cases,
    onRunClick,
}: {
    report: ExperimentReport;
    runs: Run[];
    metrics: Metric[];
    cases: Case[];
    onRunClick: (run: Run, title: string) => void;
}) {
    // Per-run metric lookup, and run rows grouped by case (in case order).
    const metricsByRun = useMemo(() => {
        const map = new Map<string, Map<string, number>>();
        for (const m of metrics) {
            const inner = map.get(m.runId) ?? new Map<string, number>();
            inner.set(m.key, m.value);
            map.set(m.runId, inner);
        }
        return map;
    }, [metrics]);

    const rows = useMemo(() => {
        const out: { run: Run; caseName: string; index: number }[] = [];
        for (const c of cases) {
            const caseRuns = runs
                .filter((run) => run.caseId === c.id)
                .sort(
                    (a, b) =>
                        (a.createdAt?.getTime() ?? 0) -
                        (b.createdAt?.getTime() ?? 0),
                );
            caseRuns.forEach((run, i) =>
                out.push({
                    run,
                    caseName: c.name || c.key || "Case",
                    index: i + 1,
                }),
            );
        }
        return out;
    }, [runs, cases]);

    if (rows.length === 0)
        return (
            <p className="text-sm text-muted-foreground">No runs.</p>
        );

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-background">
                            Case
                        </TableHead>
                        <TableHead>#</TableHead>
                        <TableHead>Status</TableHead>
                        {report.metrics.map((m) => (
                            <TableHead key={m.key} className="text-right">
                                {m.name}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(({ run, caseName, index }) => {
                        const vals = run.id ? metricsByRun.get(run.id) : undefined;
                        const ok = run.status === "succeeded";
                        return (
                            <TableRow
                                key={run.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    onRunClick(run, `${caseName} · run ${index}`)
                                }
                            >
                                <TableCell className="sticky left-0 bg-background font-medium">
                                    {caseName}
                                </TableCell>
                                <TableCell className="tabular-nums text-muted-foreground">
                                    {index}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            ok ? "secondary" : "destructive"
                                        }
                                    >
                                        {run.status}
                                    </Badge>
                                </TableCell>
                                {report.metrics.map((m) => {
                                    const v = vals?.get(m.key);
                                    if (v == null)
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
                                                    v,
                                                    m.kind,
                                                ),
                                            }}
                                        >
                                            {fmt(v)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function extractJudge(context: unknown): {
    reply?: string;
    reason?: string;
} {
    if (context && typeof context === "object" && !Array.isArray(context)) {
        const o = context as Record<string, unknown>;
        return {
            reply: typeof o.reply === "string" ? o.reply : undefined,
            reason: typeof o.reason === "string" ? o.reason : undefined,
        };
    }
    return {};
}

function RunsDrilldown({
    drill,
    onClose,
    metrics,
}: {
    drill: Drill;
    onClose: () => void;
    metrics: Metric[];
}) {
    const runs = drill?.runs ?? [];

    return (
        <Sheet open={!!drill} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>{drill?.title}</SheetTitle>
                    <SheetDescription>
                        {runs.length} run{runs.length === 1 ? "" : "s"} · judge
                        reasoning per metric
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5 px-4 pb-8">
                    {runs.map((run, i) => {
                        const runMetrics = metrics.filter(
                            (m) => m.runId === run.id,
                        );
                        const ok = run.status === "succeeded";
                        return (
                            <div
                                key={run.id ?? i}
                                className="flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge
                                        variant={ok ? "secondary" : "destructive"}
                                    >
                                        {run.status}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        run {i + 1}
                                    </span>
                                </div>

                                {run.errorMessage && (
                                    <p className="rounded-md bg-destructive/10 p-2 font-mono text-xs text-destructive">
                                        {run.errorMessage}
                                    </p>
                                )}

                                {runMetrics.map((m) => {
                                    const { reply, reason } = extractJudge(
                                        m.context,
                                    );
                                    return (
                                        <div
                                            key={m.id}
                                            className="flex flex-col gap-1"
                                        >
                                            <div className="flex items-baseline gap-2 text-sm">
                                                <span className="font-medium">
                                                    {m.name}
                                                </span>
                                                <span className="tabular-nums">
                                                    = {fmt(m.value)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {m.kind}
                                                </span>
                                            </div>
                                            {reply && (
                                                <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground italic">
                                                    {reply}
                                                </blockquote>
                                            )}
                                            {reason && (
                                                <p className="text-sm">
                                                    {reason}
                                                </p>
                                            )}
                                            {!reply && !reason && (
                                                <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                                                    {JSON.stringify(
                                                        m.context,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
