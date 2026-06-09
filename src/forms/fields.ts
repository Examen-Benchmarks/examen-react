import { z } from "zod";

/**
 * The set of input kinds the widget registry knows how to render. Mapping a
 * kind to a concrete component happens once, in `widgets.tsx` — so adding a
 * resource is just declaring its fields, never re-wiring inputs.
 */
export type WidgetKind =
    | "text"
    | "textarea"
    | "email"
    | "password"
    | "number"
    | "checkbox";

/** Per-field UI hints. Validation/required-ness comes from the Zod schema. */
export interface FieldConfig {
    name: string;
    label?: string;
    kind?: WidgetKind;
    placeholder?: string;
    description?: string;
    readOnly?: boolean;
}

export interface ResolvedField extends Required<Omit<FieldConfig, "description">> {
    description?: string;
    required: boolean;
}

/** "createdAt" -> "Created At", "key" -> "Key". */
export function humanize(name: string): string {
    const spaced = name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type ObjectSchema = z.ZodObject<z.ZodRawShape>;

/**
 * Turns a Zod object schema (+ optional per-field hints) into an ordered list
 * of field descriptors the form can render. Field order follows `configs` when
 * given, otherwise the schema's own key order. Requiredness is probed
 * version-robustly: a field is optional iff it accepts `undefined`.
 */
export function resolveFields(
    schema: ObjectSchema,
    configs?: FieldConfig[],
): ResolvedField[] {
    const shape = schema.shape;
    const byName = new Map((configs ?? []).map((c) => [c.name, c]));
    const order = configs?.length ? configs.map((c) => c.name) : Object.keys(shape);

    return order
        .filter((name) => name in shape)
        .map((name) => {
            const cfg = byName.get(name) ?? { name };
            // `.shape` values are typed as zod-core internals; treat as ZodType.
            const fieldSchema = shape[name] as z.ZodType;
            const required = !fieldSchema.safeParse(undefined).success;
            return {
                name,
                label: cfg.label ?? humanize(name),
                kind: cfg.kind ?? "text",
                placeholder: cfg.placeholder ?? "",
                readOnly: cfg.readOnly ?? false,
                description: cfg.description,
                required,
            };
        });
}
