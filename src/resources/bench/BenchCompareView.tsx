import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FolderTree } from "lucide-react";
import { useGetResource, useGetResources } from "@examen/crud";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/errors";
import {
    BenchSchema,
    VersionSchema,
    type Bench,
    type Version,
} from "../schemas";
import { fmt, gradeTint } from "../report/format";
import GradeDelta from "../report/GradeDelta";
import { buildBenchComparison, type ExperimentDiff } from "./benchCompare";
import { useBenchComparison } from "./useBenchComparison";

function versionLabel(v: Version, isLatest: boolean): string {
    return (
        (v.componentsHash ?? v.id ?? "").slice(0, 10) +
        (isLatest ? " · latest" : "")
    );
}

function VersionPicker({
    label,
    versions,
    value,
    onChange,
}: {
    label: string;
    versions: Version[];
    value: string | null;
    onChange: (id: string) => void;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Select value={value ?? undefined} onValueChange={onChange}>
                <SelectTrigger className="w-[220px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {versions.map((v, i) => (
                        <SelectItem key={v.id} value={v.id!}>
                            {versionLabel(v, i === 0)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}

/** A grade value as a tinted chip, or "—" when the version didn't run it. */
function GradeBadge({ grade }: { grade: number | null }) {
    if (grade == null) return <span className="text-muted-foreground">—</span>;
    return (
        <span
            className="inline-block rounded px-1.5 py-0.5 font-medium tabular-nums"
            style={{ backgroundColor: gradeTint(grade) }}
        >
            {fmt(grade)}
        </span>
    );
}

/**
 * Dedicated version-comparison screen for a bench (FE-2). Two version pickers —
 * persisted in the URL (?base=&cand=) so the diff is shareable and survives a
 * refresh — feed two bench projections, diffed experiment-by-experiment on grade
 * and rendered group-by-group, mirroring the overview's layout.
 */
export default function BenchCompareView() {
    const { id } = useParams<{ id: string }>();
    const benchId = id!;
    const [params, setParams] = useSearchParams();

    const { objectQuery: benchQ } = useGetResource<Bench>({
        url: `/benches/${benchId}`,
        schema: BenchSchema,
        enabled: !!id,
    });
    const bench = benchQ.data;

    // Same key as the overview, so versions are served from cache when arriving
    // from the bench page.
    const { objectQuery: versionsQ } = useGetResources<Version>({
        url: `/versions?bench_id=${benchId}`,
        schema: VersionSchema,
        keys: ["versions", "bench", benchId],
    });
    const versions = versionsQ.data ?? [];

    // Candidate defaults to the newest version; baseline to the next-older one.
    const candId = params.get("cand") ?? versions[0]?.id ?? null;
    const candIdx = versions.findIndex((v) => v.id === candId);
    const baseId =
        params.get("base") ??
        versions[candIdx + 1]?.id ??
        versions[candIdx - 1]?.id ??
        null;

    const setSide = (side: "base" | "cand", versionId: string) => {
        const next = new URLSearchParams(params);
        next.set(side, versionId);
        // Keep the counterpart explicit too, so a later default shift can't move it.
        next.set(side === "base" ? "cand" : "base", side === "base" ? (candId ?? "") : (baseId ?? ""));
        setParams(next, { replace: true });
    };

    const c = useBenchComparison(benchId, baseId, candId);

    return (
        <div className="flex w-full flex-col gap-6">
            <Button asChild variant="ghost" size="sm" className="self-start">
                <Link to={`/benches/${benchId}`}>
                    <ArrowLeft className="size-4" />
                    Bench
                </Link>
            </Button>

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Compare versions
                </h1>
                {bench?.name && (
                    <p className="text-sm text-muted-foreground">{bench.name}</p>
                )}
            </div>

            {versionsQ.isLoading ? (
                <Skeleton className="h-48 w-full" />
            ) : versionsQ.isError ? (
                <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(versionsQ.error)}
                </p>
            ) : versions.length < 2 ? (
                <p className="text-sm text-muted-foreground">
                    This bench needs at least two versions to compare.
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap items-end gap-4">
                        <VersionPicker
                            label="Baseline"
                            versions={versions}
                            value={baseId}
                            onChange={(v) => setSide("base", v)}
                        />
                        <ArrowRight className="mb-2 size-4 text-muted-foreground" />
                        <VersionPicker
                            label="Candidate"
                            versions={versions}
                            value={candId}
                            onChange={(v) => setSide("cand", v)}
                        />
                    </div>

                    {baseId === candId ? (
                        <p className="text-sm text-muted-foreground">
                            Pick two different versions to see a diff.
                        </p>
                    ) : c.isLoading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : c.isError ? (
                        <p className="text-sm text-destructive" role="alert">
                            {getErrorMessage(c.error)}
                        </p>
                    ) : c.baseline && c.candidate ? (
                        <ComparisonGroups
                            groups={buildBenchComparison(
                                c.baseline,
                                c.candidate,
                            )}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            One of the selected versions has no runs for this
                            bench.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

function ComparisonGroups({
    groups,
}: {
    groups: ReturnType<typeof buildBenchComparison>;
}) {
    if (groups.length === 0)
        return (
            <p className="text-sm text-muted-foreground">
                Neither version has experiments with runs.
            </p>
        );

    return (
        <div className="flex flex-col gap-3">
            {groups.map((g) => (
                <div key={g.key} className="flex flex-col gap-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <FolderTree className="size-3.5" />
                        {g.path.length
                            ? g.path.map((p) => p.name).join(" / ")
                            : "Bench root"}
                    </h4>
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Experiment</TableHead>
                                    <TableHead className="text-right">
                                        Baseline
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Candidate
                                    </TableHead>
                                    <TableHead className="w-24 text-right">
                                        Δ
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {g.experiments.map((e) => (
                                    <ExperimentDiffRow key={e.id} diff={e} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <span
                        className="inline-block size-3 rounded-sm"
                        style={{ backgroundColor: "hsl(140 65% 45% / 0.16)" }}
                    />
                    improved
                </span>
                <span className="inline-flex items-center gap-1">
                    <span
                        className="inline-block size-3 rounded-sm"
                        style={{ backgroundColor: "hsl(0 70% 50% / 0.16)" }}
                    />
                    regressed
                </span>
                <span>grade compared per experiment · Δ vs baseline</span>
            </div>
        </div>
    );
}

function ExperimentDiffRow({ diff }: { diff: ExperimentDiff }) {
    const tint =
        diff.better === true
            ? "hsl(140 65% 45% / 0.16)"
            : diff.better === false
              ? "hsl(0 70% 50% / 0.16)"
              : undefined;

    return (
        <TableRow>
            <TableCell className="font-medium">
                {diff.name || diff.key}
                {!diff.inBase && (
                    <span className="ml-1 text-xs text-green-600 dark:text-green-500">
                        new
                    </span>
                )}
                {!diff.inCand && (
                    <span className="ml-1 text-xs text-muted-foreground">
                        gone
                    </span>
                )}
            </TableCell>
            <TableCell className="text-right">
                <GradeBadge grade={diff.baseGrade} />
            </TableCell>
            <TableCell className="text-right" style={{ backgroundColor: tint }}>
                <GradeBadge grade={diff.candGrade} />
            </TableCell>
            <TableCell className="text-right">
                <GradeDelta values={[diff.baseGrade, diff.candGrade]} />
            </TableCell>
        </TableRow>
    );
}
