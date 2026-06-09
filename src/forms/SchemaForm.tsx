import { useMemo, useState } from "react";
import {
    useForm,
    type DefaultValues,
    type FieldValues,
    type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { resolveFields, type FieldConfig } from "./fields";
import { widgetRegistry } from "./widgets";

interface SchemaFormProps<S extends z.ZodObject<z.ZodRawShape>> {
    schema: S;
    /** Per-field UI hints + order. Omit to render every field as text. */
    fields?: FieldConfig[];
    onSubmit: (values: z.infer<S>) => Promise<unknown> | unknown;
    defaultValues?: DefaultValues<z.infer<S>>;
    submitLabel?: string;
    /** External (e.g. mutation) error to surface above the submit button. */
    submitError?: string | null;
}

/**
 * Renders a form from a Zod object schema: validation via `zodResolver`, fields
 * resolved from the schema (+ hints) and drawn through the widget registry.
 * It owns no resource logic — `onSubmit` is whatever the caller wants (a
 * mutation, an auth call, …).
 *
 * Internally the form is typed loosely (`FieldValues`) because the schema is a
 * generic parameter; the public surface stays precisely typed off `S`.
 */
export function SchemaForm<S extends z.ZodObject<z.ZodRawShape>>({
    schema,
    fields,
    onSubmit,
    defaultValues,
    submitLabel = "Save",
    submitError,
}: SchemaFormProps<S>) {
    const form = useForm<FieldValues>({
        resolver: zodResolver(schema) as unknown as Resolver<FieldValues>,
        defaultValues: defaultValues as DefaultValues<FieldValues>,
    });
    const resolved = useMemo(
        () => resolveFields(schema, fields),
        [schema, fields],
    );
    const [formError, setFormError] = useState<string | null>(null);

    const submit = form.handleSubmit(async (values) => {
        setFormError(null);
        try {
            await onSubmit(values as z.infer<S>);
        } catch (e) {
            setFormError(getErrorMessage(e));
        }
    });

    const shownError = submitError ?? formError;

    return (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {resolved.map((f) => {
                const error = form.formState.errors[f.name];
                const registration = form.register(
                    f.name,
                    f.kind === "number" ? { valueAsNumber: true } : undefined,
                );
                return (
                    <div key={f.name} className="grid gap-1.5">
                        <Label htmlFor={f.name}>
                            {f.label}
                            {f.required && (
                                <span className="text-destructive"> *</span>
                            )}
                        </Label>
                        {widgetRegistry[f.kind]({
                            id: f.name,
                            invalid: !!error,
                            placeholder: f.placeholder,
                            readOnly: f.readOnly,
                            registration,
                        })}
                        {f.description && (
                            <p className="text-xs text-muted-foreground">
                                {f.description}
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-destructive">
                                {String(error.message)}
                            </p>
                        )}
                    </div>
                );
            })}

            {shownError && (
                <p className="text-sm text-destructive" role="alert">
                    {shownError}
                </p>
            )}

            <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="self-start"
            >
                {form.formState.isSubmitting ? "Saving…" : submitLabel}
            </Button>
        </form>
    );
}
