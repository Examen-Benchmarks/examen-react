import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { fmt, isScoreKind, normalizeScore } from "./format";
import { useExperimentEvolution } from "./useExperimentEvolution";
import EvolutionChart, { type ChartSeries } from "./EvolutionChart";

// Distinct hues for the per-metric lines; the grade uses the primary colour.
const METRIC_COLORS = [
    "#10b981",
    "#f59e0b",
    "#06b6d4",
    "#a855f7",
    "#84cc16",
    "#ec4899",
];

/**
 * The experiment's grade (and score-like metric means) trended across its
 * versions, newest on the right. Self-hiding: renders nothing until there are
 * at least two graded versions, so single-version experiments stay clean.
 * Clicking a point selects that version for the report below.
 */
export default function EvolutionSection({
    experimentId,
    selectedVersionId,
    onSelectVersion,
}: {
    experimentId: string;
    selectedVersionId: string | null;
    onSelectVersion: (versionId: string) => void;
}) {
    const ev = useExperimentEvolution(experimentId);

    if (ev.isLoading) return <Skeleton className="h-56 w-full" />;
    if (ev.isError)
        return (
            <p className="text-sm text-destructive" role="alert">
                {getErrorMessage(ev.error)}
            </p>
        );
    // Nothing graded anywhere ⇒ no trend to speak of.
    if (!ev.hasData) return null;

    // One version can't trend yet — but show the section so it's discoverable.
    if (ev.points.length < 2) {
        return (
            <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                    Evolution · grade across versions
                </h3>
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Only one version so far — the trend chart appears once this
                    experiment has runs at a second version.
                </p>
            </section>
        );
    }

    const labels = ev.points.map((p) => p.hash);
    const subLabels = ev.points.map((p) => p.createdAt?.toLocaleDateString());

    // Only score-like metrics share the 0..1 axis; others (latency, counts…)
    // would need their own units, so they're left off this trend.
    const scoreMetrics = ev.metrics.filter((m) => isScoreKind(m.kind));

    const series: ChartSeries[] = [
        {
            key: "__grade__",
            label: "Grade",
            color: "var(--primary)",
            emphasis: true,
            values: ev.points.map((p) => p.grade),
        },
        ...scoreMetrics.map((m, i) => ({
            key: m.key,
            label: m.name,
            color: METRIC_COLORS[i % METRIC_COLORS.length],
            values: ev.points.map((p) => {
                const raw = p.metricMeans[m.key];
                return raw == null ? null : normalizeScore(raw, m.kind);
            }),
        })),
    ];

    const selectedIndex = ev.points.findIndex(
        (p) => p.versionId === selectedVersionId,
    );

    return (
        <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
                Evolution · grade across versions
            </h3>
            <div className="rounded-lg border p-4">
                <EvolutionChart
                    labels={labels}
                    subLabels={subLabels}
                    series={series}
                    selectedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
                    onPointClick={(i) => onSelectVersion(ev.points[i].versionId)}
                    formatValue={fmt}
                />
            </div>
        </section>
    );
}
