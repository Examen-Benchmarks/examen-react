import { Info } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExperimentReport } from "./useExperimentReport";

function reasonOf(context: unknown): string | undefined {
    if (context && typeof context === "object" && !Array.isArray(context)) {
        const r = (context as Record<string, unknown>).reason;
        if (typeof r === "string" && r.trim()) return r;
    }
    return undefined;
}

/**
 * The latest run's judge reasons for one experiment. Lives inside the hover-card
 * content so the fetch only fires when the card opens (Radix mounts content on
 * open) — the table stays cheap regardless of how many experiments it lists.
 */
function NotesContent({ experimentId }: { experimentId: string }) {
    const r = useExperimentReport(experimentId);

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
        <div className="flex flex-col gap-3">
            {r.report && (
                <p className="text-xs text-muted-foreground">
                    {r.report.runSummary.total} runs · latest run
                </p>
            )}

            {r.isLoading ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ) : r.noVersions ? (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No notes in the latest run.
                </p>
            ) : (
                <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
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
        </div>
    );
}

/** Circled-i trigger; hovering it reveals the experiment's latest judge notes. */
export default function ExperimentNotesHover({
    experimentId,
}: {
    experimentId: string;
}) {
    return (
        <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    aria-label="Latest notes"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Info className="size-4" />
                </button>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-96">
                <NotesContent experimentId={experimentId} />
            </HoverCardContent>
        </HoverCard>
    );
}
