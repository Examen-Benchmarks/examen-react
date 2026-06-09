import type { ReactNode } from "react";
import type { z } from "zod";
import type { FieldConfig } from "@/forms/fields";
import {
    ProjectSchema,
    ProjectCreateSchema,
    BenchSchema,
    CollectionSchema,
    ExperimentSchema,
    CaseSchema,
    RunSchema,
    MetricSchema,
    type Project,
    type Bench,
    type Collection,
    type Experiment,
    type Case,
    type Run,
    type Metric,
} from "./schemas";

export interface ColumnDef<TItem> {
    key: string;
    header: string;
    cell: (item: TItem) => ReactNode;
}

/** A parent-scoped list rendered as a section on a detail page. */
export interface ChildSection {
    /** Registered resource name whose schema/columns render the rows. */
    resource: string;
    heading: string;
    /** Builds the (parent-scoped) list URL from the current entity's id. */
    listUrl: (parentId: string) => string;
}

/** A free-form JSON column shown as a formatted block on the detail page. */
export interface JsonSection<TItem> {
    heading: string;
    value: (item: TItem) => unknown;
}

/** Where a "back / up" link points, derived from the fetched entity. */
export interface ParentRef {
    resource: string;
    id: string;
}

export interface Resource<TItem extends { id?: string }> {
    name: string;
    label: string;
    singular: string;
    itemSchema: z.ZodType<TItem>;
    columns: ColumnDef<TItem>[];
    titleField: keyof TItem & string;
    /** GET-by-id URL. Present ⇒ the resource has a detail route (navigable). */
    itemUrl?: (id: string) => string;
    /** Top-level collection URL (GET list + POST create). Nav resources only. */
    listUrl?: string;
    /** Upward link target, read off the fetched entity. */
    parentLink?: (item: TItem) => ParentRef | null;
    /** Child lists shown on the detail page. */
    children?: ChildSection[];
    /** Free-form JSON columns shown on the detail page. */
    detailJson?: JsonSection<TItem>[];
    /** Create support (management resources). */
    createSchema?: z.ZodObject<z.ZodRawShape>;
    createFields?: FieldConfig[];
}

function fmtDate(d?: Date | null): string {
    return d ? d.toLocaleString() : "—";
}

const nameCol = <T extends { name?: string }>(): ColumnDef<T> => ({
    key: "name",
    header: "Name",
    cell: (i) => i.name ?? "—",
});
const keyCol = <T extends { key?: string }>(): ColumnDef<T> => ({
    key: "key",
    header: "Key",
    cell: (i) => i.key ?? "—",
});
const createdCol = <T extends { createdAt?: Date }>(): ColumnDef<T> => ({
    key: "createdAt",
    header: "Created",
    cell: (i) => fmtDate(i.createdAt),
});

// ── Resource definitions ──────────────────────────────────────────────────────

export const projects: Resource<Project> = {
    name: "projects",
    label: "Projects",
    singular: "Project",
    itemSchema: ProjectSchema,
    listUrl: "/projects",
    itemUrl: (id) => `/projects/${id}`,
    titleField: "name",
    columns: [
        keyCol(),
        nameCol(),
        { key: "description", header: "Description", cell: (p) => p.description ?? "—" },
        createdCol(),
    ],
    children: [
        {
            resource: "benches",
            heading: "Benches",
            listUrl: (id) => `/projects/${id}/benches`,
        },
    ],
    createSchema: ProjectCreateSchema,
    createFields: [
        {
            name: "key",
            label: "Key",
            placeholder: "unique-business-key",
            description: "Unique, immutable business key for this project.",
        },
        { name: "name", label: "Name", placeholder: "My project" },
        {
            name: "description",
            label: "Description",
            kind: "textarea",
            placeholder: "Optional description",
        },
    ],
};

export const benches: Resource<Bench> = {
    name: "benches",
    label: "Benches",
    singular: "Bench",
    itemSchema: BenchSchema,
    itemUrl: (id) => `/benches/${id}`,
    titleField: "name",
    parentLink: (b) => ({ resource: "projects", id: b.projectId }),
    columns: [
        keyCol(),
        nameCol(),
        { key: "description", header: "Description", cell: (b) => b.description ?? "—" },
        createdCol(),
    ],
    children: [
        {
            resource: "collections",
            heading: "Collections",
            listUrl: (id) => `/benches/${id}/collections`,
        },
        {
            resource: "experiments",
            heading: "Experiments",
            listUrl: (id) => `/benches/${id}/experiments`,
        },
    ],
};

export const collections: Resource<Collection> = {
    name: "collections",
    label: "Collections",
    singular: "Collection",
    itemSchema: CollectionSchema,
    itemUrl: (id) => `/collections/${id}`,
    titleField: "name",
    parentLink: (c) =>
        c.parentId
            ? { resource: "collections", id: c.parentId }
            : { resource: "benches", id: c.benchId },
    columns: [keyCol(), nameCol(), createdCol()],
    children: [
        {
            resource: "collections",
            heading: "Sub-collections",
            listUrl: (id) => `/collections/${id}/children`,
        },
    ],
};

export const experiments: Resource<Experiment> = {
    name: "experiments",
    label: "Experiments",
    singular: "Experiment",
    itemSchema: ExperimentSchema,
    itemUrl: (id) => `/experiments/${id}`,
    titleField: "name",
    parentLink: (e) => ({ resource: "benches", id: e.benchId }),
    columns: [
        keyCol(),
        nameCol(),
        { key: "description", header: "Description", cell: (e) => e.description ?? "—" },
        createdCol(),
    ],
    children: [
        {
            resource: "cases",
            heading: "Cases",
            listUrl: (id) => `/experiments/${id}/cases`,
        },
    ],
};

export const cases: Resource<Case> = {
    name: "cases",
    label: "Cases",
    singular: "Case",
    itemSchema: CaseSchema,
    itemUrl: (id) => `/cases/${id}`,
    titleField: "name",
    parentLink: (c) => ({ resource: "experiments", id: c.experimentId }),
    columns: [
        keyCol(),
        nameCol(),
        {
            key: "inputSummary",
            header: "Input",
            cell: (c) => c.inputSummary ?? "—",
        },
        createdCol(),
    ],
    children: [
        {
            resource: "runs",
            heading: "Runs",
            listUrl: (id) => `/runs?case_id=${id}`,
        },
    ],
    detailJson: [{ heading: "Payload", value: (c) => c.payload }],
};

export const runs: Resource<Run> = {
    name: "runs",
    label: "Runs",
    singular: "Run",
    itemSchema: RunSchema,
    itemUrl: (id) => `/runs/${id}`,
    titleField: "status",
    parentLink: (r) => ({ resource: "cases", id: r.caseId }),
    columns: [
        { key: "status", header: "Status", cell: (r) => r.status },
        { key: "startedAt", header: "Started", cell: (r) => fmtDate(r.startedAt) },
        {
            key: "finishedAt",
            header: "Finished",
            cell: (r) => fmtDate(r.finishedAt),
        },
        {
            key: "outputSummary",
            header: "Output",
            cell: (r) => r.outputSummary ?? "—",
        },
    ],
    children: [
        {
            resource: "metrics",
            heading: "Metrics",
            listUrl: (id) => `/runs/${id}/metrics`,
        },
    ],
    detailJson: [{ heading: "Trace", value: (r) => r.trace }],
};

export const metrics: Resource<Metric> = {
    name: "metrics",
    label: "Metrics",
    singular: "Metric",
    itemSchema: MetricSchema,
    // No itemUrl: there's no GET /metrics/{id} — metrics are a read-only leaf
    // shown inline on a run. So rows aren't clickable and there's no route.
    titleField: "name",
    columns: [
        nameCol(),
        { key: "kind", header: "Kind", cell: (m) => m.kind },
        { key: "value", header: "Value", cell: (m) => m.value },
        keyCol(),
    ],
};

/** All resources, keyed by name — child sections resolve through this. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, Resource<any>> = {
    projects,
    benches,
    collections,
    experiments,
    cases,
    runs,
    metrics,
};

/** Resources reachable from the sidebar nav (have a top-level list). */
export const navResources = [projects];

/** Resources with a detail route (anything navigable by id). */
export const detailResources = Object.values(registry).filter(
    (r) => r.itemUrl,
);
