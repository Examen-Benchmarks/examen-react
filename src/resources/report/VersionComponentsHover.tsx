import { Fragment, type ReactNode } from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { Version } from "../schemas";

function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
    return (
        v != null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length > 0
    );
}

function formatLeaf(v: unknown): string {
    if (v == null) return "—";
    if (typeof v === "object") return JSON.stringify(v); // arrays / leftovers
    return String(v);
}

/**
 * Flattens nested objects to `a__b__c` leaf paths (arrays and primitives are
 * leaves), preserving order — so a deep components tuple reads as a flat list
 * of fields rather than a wall of nested JSON.
 */
function flatten(
    value: unknown,
    prefix = "",
    out: Array<[string, string]> = [],
): Array<[string, string]> {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
            flatten(v, prefix ? `${prefix}__${k}` : k, out);
        }
    } else {
        out.push([prefix, formatLeaf(value)]);
    }
    return out;
}

function shortHash(version: Version): string {
    return (version.componentsHash ?? version.id ?? "").slice(0, 10);
}

/**
 * Shows a version's short components-hash and reveals the full `components`
 * attribute tuple on hover — the hash alone isn't human-readable. Pass children
 * to use a custom trigger (e.g. an info icon); defaults to the hash with a
 * dotted underline. With no components, just renders the trigger, no card.
 */
export default function VersionComponentsHover({
    version,
    children,
}: {
    version: Version;
    children?: ReactNode;
}) {
    const components = version.components;
    const defaultTrigger = (
        <span className="font-mono">{shortHash(version)}</span>
    );

    if (!isNonEmptyObject(components)) {
        return <>{children ?? defaultTrigger}</>;
    }

    const trigger = children ?? (
        <span className="cursor-help font-mono underline decoration-dotted underline-offset-2">
            {shortHash(version)}
        </span>
    );

    return (
        <HoverCard openDelay={100} closeDelay={50}>
            <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
            <HoverCardContent align="start" className="w-96">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Version components
                    </p>
                    <dl className="grid max-h-80 grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 overflow-y-auto">
                        {flatten(components).map(([k, v]) => (
                            <Fragment key={k}>
                                <dt className="break-all font-mono text-[11px] text-muted-foreground">
                                    {k}
                                </dt>
                                <dd className="break-all font-mono text-xs">
                                    {v}
                                </dd>
                            </Fragment>
                        ))}
                    </dl>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
