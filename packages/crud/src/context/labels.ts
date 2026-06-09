/**
 * Built-in English labels for everything the package renders itself. Consumers
 * can override the resolver entirely by passing a `t` function to the provider,
 * or rely on these defaults.
 *
 * Pluralization follows the i18next convention: a key plus optional `_one`
 * (count === 1) and `_other` (everything else) variants. If no variant is
 * defined, the base key is used.
 */
export const DEFAULT_LABELS: Record<string, string> = {
    // generic
    "errors.title": "Error",
    "errors.unknown": "An unknown error occurred",
    "errors.http.400": "Bad request",
    "errors.http.401": "Authentication required",
    "errors.http.403": "Forbidden",
    "errors.http.404": "Not found",
    "errors.http.408": "Request timed out",
    "errors.http.409": "Conflict",
    "errors.http.422": "Invalid data",
    "errors.http.429": "Too many requests",
    "errors.http.500": "Server error",
    "errors.http.502": "Bad gateway",
    "errors.http.503": "Service unavailable",
    "errors.http.504": "Gateway timeout",
    "forms.cancel": "Cancel",
    "forms.confirm": "Confirm",
    // list chrome
    "list.actions": "Actions",
    "list.filters": "Filters",
    "list.select": "Select",
    // selection
    "selection.allMatchingSelected": "All {{count}} items selected",
    "selection.clear": "Clear",
    "selection.more": "More",
    "selection.selectAllMatching": "Select all {{count}}",
    "selection.selected": "{{count}} selected",
    "selection.togglePage": "Toggle page selection",
    "selection.toggleRow": "Toggle row selection",
};

export type TOptions = {
    count?: number;
    defaultValue?: string;
    [key: string]: unknown;
};

export type TFunction = (key: string, options?: TOptions) => string;

function interpolate(template: string, options?: TOptions): string {
    if (!options) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
        options[key] !== undefined ? String(options[key]) : `{{${key}}}`,
    );
}

/**
 * Default resolver. Looks up the key (with i18next-style `_one`/`_other`
 * pluralization when `count` is provided), interpolates `{{var}}` placeholders,
 * and falls back to `options.defaultValue` (or the raw key) when nothing
 * matches.
 */
export const defaultT: TFunction = (key, options) => {
    if (options?.count !== undefined) {
        const variant =
            options.count === 1 ? `${key}_one` : `${key}_other`;
        if (DEFAULT_LABELS[variant] !== undefined) {
            return interpolate(DEFAULT_LABELS[variant], options);
        }
    }
    const template = DEFAULT_LABELS[key];
    if (template === undefined) {
        return options?.defaultValue ?? key;
    }
    return interpolate(template, options);
};
