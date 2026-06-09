import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetResource, useGetResources } from "@examen/crud";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import {
    CaseSchema,
    RunSchema,
    MetricSchema,
    type Case,
    type Run,
    type Metric,
} from "../schemas";
import RunsTable from "./RunsTable";
import RunsDrilldown, { type Drill } from "./RunsDrilldown";

function hasJson(value: unknown): boolean {
    return (
        value != null &&
        !(typeof value === "object" && Object.keys(value).length === 0)
    );
}

export default function CaseView() {
    const { id } = useParams<{ id: string }>();
    const caseId = id!;

    const { objectQuery: caseQ } = useGetResource<Case>({
        url: `/cases/${caseId}`,
        schema: CaseSchema,
        enabled: !!id,
    });
    const { objectQuery: runsQ } = useGetResources<Run>({
        url: `/runs?case_id=${caseId}`,
        schema: RunSchema,
        keys: ["runs", "case", caseId],
        enabled: !!id,
    });
    const { objectQuery: metricsQ } = useGetResources<Metric>({
        url: `/metrics?case_id=${caseId}`,
        schema: MetricSchema,
        keys: ["metrics", "case", caseId],
        enabled: !!id,
    });

    const [drill, setDrill] = useState<Drill>(null);

    const theCase = caseQ.data;
    const runs = runsQ.data ?? [];
    const metrics = metricsQ.data ?? [];
    const isLoading = caseQ.isLoading || runsQ.isLoading || metricsQ.isLoading;
    const isError = caseQ.isError || runsQ.isError || metricsQ.isError;

    return (
        <div className="flex w-full flex-col gap-6">
            {theCase?.experimentId && (
                <Button asChild variant="ghost" size="sm" className="self-start">
                    <Link to={`/experiments/${theCase.experimentId}`}>
                        <ArrowLeft className="size-4" />
                        Experiment
                    </Link>
                </Button>
            )}

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {theCase?.name || theCase?.key || "Case"}
                </h1>
                {theCase?.description && (
                    <p className="text-sm text-muted-foreground">
                        {theCase.description}
                    </p>
                )}
            </div>

            {theCase && hasJson(theCase.payload) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                            {JSON.stringify(theCase.payload, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : isError ? (
                        <p className="text-sm text-destructive" role="alert">
                            {getErrorMessage(
                                caseQ.error ?? runsQ.error ?? metricsQ.error,
                            )}
                        </p>
                    ) : theCase ? (
                        <RunsTable
                            runs={runs}
                            metrics={metrics}
                            cases={[theCase]}
                            showCaseColumn={false}
                            onRunClick={(run, title) =>
                                setDrill({ title, runs: [run] })
                            }
                        />
                    ) : null}
                </CardContent>
            </Card>

            <RunsDrilldown
                drill={drill}
                onClose={() => setDrill(null)}
                metrics={metrics}
            />
        </div>
    );
}
