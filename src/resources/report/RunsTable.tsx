import { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Case, Metric, Run } from "../schemas";
import { fmt, scoreTint } from "./format";

interface Column {
    key: string;
    name: string;
    kind: string;
}

/**
 * The shared per-run scores table: one row per run (grouped by case), every
 * metric as a tinted score cell. Used both for an experiment's "All runs" and
 * for a single case's runs, so runs look identical everywhere.
 */
export default function RunsTable({
    runs,
    metrics,
    cases,
    showCaseColumn = true,
    onRunClick,
}: {
    runs: Run[];
    metrics: Metric[];
    cases: Case[];
    showCaseColumn?: boolean;
    onRunClick: (run: Run, title: string) => void;
}) {
    const columns = useMemo<Column[]>(() => {
        const map = new Map<string, Column>();
        for (const m of metrics) {
            if (!map.has(m.key))
                map.set(m.key, { key: m.key, name: m.name, kind: m.kind });
        }
        return [...map.values()];
    }, [metrics]);

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
        return <p className="text-sm text-muted-foreground">No runs.</p>;

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {showCaseColumn && (
                            <TableHead className="sticky left-0 bg-background">
                                Case
                            </TableHead>
                        )}
                        <TableHead>#</TableHead>
                        <TableHead>Status</TableHead>
                        {columns.map((m) => (
                            <TableHead key={m.key} className="text-right">
                                {m.name}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(({ run, caseName, index }) => {
                        const vals = run.id
                            ? metricsByRun.get(run.id)
                            : undefined;
                        const ok = run.status === "succeeded";
                        return (
                            <TableRow
                                key={run.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    onRunClick(
                                        run,
                                        `${caseName} · run ${index}`,
                                    )
                                }
                            >
                                {showCaseColumn && (
                                    <TableCell className="sticky left-0 bg-background font-medium">
                                        {caseName}
                                    </TableCell>
                                )}
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
                                {columns.map((m) => {
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
