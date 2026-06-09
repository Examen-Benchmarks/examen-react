import type { ReactElement } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WidgetKind } from "./fields";

export interface WidgetProps {
    id: string;
    invalid: boolean;
    placeholder?: string;
    readOnly?: boolean;
    registration: UseFormRegisterReturn;
}

/**
 * The single place a field `kind` becomes a concrete input. Swap the design
 * system here (these are shadcn/ui components) and every schema-driven form
 * changes with it — the forms themselves never name an input component.
 */
export const widgetRegistry: Record<
    WidgetKind,
    (p: WidgetProps) => ReactElement
> = {
    text: (p) => (
        <Input
            id={p.id}
            type="text"
            aria-invalid={p.invalid}
            placeholder={p.placeholder}
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
    email: (p) => (
        <Input
            id={p.id}
            type="email"
            aria-invalid={p.invalid}
            placeholder={p.placeholder}
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
    password: (p) => (
        <Input
            id={p.id}
            type="password"
            aria-invalid={p.invalid}
            placeholder={p.placeholder}
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
    number: (p) => (
        <Input
            id={p.id}
            type="number"
            aria-invalid={p.invalid}
            placeholder={p.placeholder}
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
    textarea: (p) => (
        <Textarea
            id={p.id}
            rows={4}
            aria-invalid={p.invalid}
            placeholder={p.placeholder}
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
    checkbox: (p) => (
        <input
            id={p.id}
            type="checkbox"
            className="size-4 rounded border border-input accent-primary"
            readOnly={p.readOnly}
            {...p.registration}
        />
    ),
};
