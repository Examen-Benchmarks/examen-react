import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import type { Metric, Run } from "../schemas";
import { fmt } from "./format";

export type Drill = { title: string; runs: Run[] } | null;

function extractJudge(context: unknown): { reply?: string; reason?: string } {
    if (context && typeof context === "object" && !Array.isArray(context)) {
        const o = context as Record<string, unknown>;
        return {
            reply: typeof o.reply === "string" ? o.reply : undefined,
            reason: typeof o.reason === "string" ? o.reason : undefined,
        };
    }
    return {};
}

/** Side panel: the selected run(s) with each metric's value + judge reasoning. */
export default function RunsDrilldown({
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
