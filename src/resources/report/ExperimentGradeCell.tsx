import { Skeleton } from "@/components/ui/skeleton";
import { useExperimentReport } from "./useExperimentReport";

/** Red→green tint for a 0..1 grade. */
function gradeTint(grade: number): string {
    const c = Math.max(0, Math.min(1, grade));
    return `hsl(${c * 120} 65% 45% / 0.18)`;
}

/**
 * The per-experiment headline grade, shown inline on the bench's Experiments
 * table. Fetches the experiment's latest-version report; React Query shares the
 * result with the notes hover, so opening the hover doesn't refetch.
 */
export default function ExperimentGradeCell({
    experimentId,
}: {
    experimentId: string;
}) {
    const r = useExperimentReport(experimentId);

    if (r.isLoading) return <Skeleton className="ml-auto h-5 w-10" />;
    if (r.report?.grade == null)
        return <span className="text-muted-foreground">—</span>;

    const grade = r.report.grade;
    return (
        <span
            className="inline-block rounded px-1.5 py-0.5 font-medium tabular-nums"
            style={{ backgroundColor: gradeTint(grade) }}
        >
            {Number(grade.toFixed(2))}
        </span>
    );
}
