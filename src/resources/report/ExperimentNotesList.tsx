import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExperimentReport } from "./useExperimentReport";

type ExperimentItem = { id?: string; name?: string; key?: string };

function reasonOf(context: unknown): string | undefined {
    if (context && typeof context === "object" && !Array.isArray(context)) {
        const r = (context as Record<string, unknown>).reason;
        if (typeof r === "string" && r.trim()) return r;
    }
    return undefined;
}

function fmt(n: number): string {
    return Number(n.toFixed(2)).toString();
}

/** One experiment card showing its latest run's judge reasons (no columns). */
function ExperimentNotesCard({ experiment }: { experiment: ExperimentItem }) {
    const r = useExperimentReport(experiment.id!);

    // Latest run of the default (latest) version, by created_at.
    const latestRun = [...r.runs].sort(
        (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    )[0];
    const notes = latestRun
        ? r.metrics
              .filter((m) => m.runId === latestRun.id)
              .map((m) => ({ name: m.name, reason: reasonOf(m.context) }))
              .filter((n): n is { name: string; reason: string } =>
                  Boolean(n.reason),
              )
        : [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">
                    <Link
                        to={`/experiments/${experiment.id}`}
                        className="hover:underline"
                    >
                        {experiment.name || experiment.key}
                    </Link>
                </CardTitle>
                {r.report && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {r.report.grade != null && (
                            <Badge variant="secondary">
                                Grade {fmt(r.report.grade)}
                            </Badge>
                        )}
                        <span>{r.report.runSummary.total} runs</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {r.isLoading ? (
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ) : r.noVersions ? (
                    <p className="text-sm text-muted-foreground">
                        No runs yet.
                    </p>
                ) : notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No notes in the latest run.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {notes.map((n, i) => (
                            <li key={i} className="text-sm">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {n.name}
                                </span>
                                <p className="mt-0.5">{n.reason}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function ExperimentNotesList({
    items,
}: {
    items: ExperimentItem[];
}) {
    return (
        <div className="flex flex-col gap-3">
            {items
                .filter((e) => e.id)
                .map((e) => (
                    <ExperimentNotesCard key={e.id} experiment={e} />
                ))}
        </div>
    );
}
