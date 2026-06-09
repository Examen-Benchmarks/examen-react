import type { ReactNode } from "react";
import type { z } from "zod";
import type { FieldConfig } from "@/forms/fields";
import { ProjectSchema, ProjectCreateSchema, type Project } from "./schemas";

export interface ColumnDef<TItem> {
    key: string;
    header: string;
    cell: (item: TItem) => ReactNode;
}

/**
 * One declaration per resource. Generic list/create/detail pages read this —
 * adding a resource is authoring a schema + this descriptor, no new pages.
 *
 * API convention (top-level resources): list = POST/GET `path`, item = GET
 * `path/{id}`. Nested resources (benches under a project, …) will extend this
 * with a parent scope later.
 */
export interface Resource<TItem extends { id?: string }> {
    /** URL/route segment, e.g. "projects". */
    name: string;
    label: string;
    singular: string;
    /** API + route base path, e.g. "/projects". */
    path: string;
    itemSchema: z.ZodType<TItem>;
    createSchema: z.ZodObject<z.ZodRawShape>;
    createFields: FieldConfig[];
    columns: ColumnDef<TItem>[];
    /** Field shown as the row's primary link text. */
    titleField: keyof TItem & string;
}

function formatDate(d?: Date): string {
    return d ? d.toLocaleString() : "—";
}

export const projectsResource: Resource<Project> = {
    name: "projects",
    label: "Projects",
    singular: "Project",
    path: "/projects",
    itemSchema: ProjectSchema,
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
    titleField: "name",
    columns: [
        { key: "key", header: "Key", cell: (p) => p.key },
        { key: "name", header: "Name", cell: (p) => p.name },
        {
            key: "description",
            header: "Description",
            cell: (p) => p.description ?? "—",
        },
        {
            key: "createdAt",
            header: "Created",
            cell: (p) => formatDate(p.createdAt),
        },
    ],
};

/** Every CRUD-managed resource, for nav + routing. */
export const resources = [projectsResource];
