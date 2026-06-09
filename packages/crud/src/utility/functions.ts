type PlainObject = Record<string, unknown>;

function isObject(item: unknown): item is PlainObject {
    return item !== null && typeof item === "object" && !Array.isArray(item);
}

export function snakeToCamelCase<T extends Record<string, never>>(
    obj: Record<string, never>,
): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => snakeToCamelCase(item)) as unknown as T;
    } else if (isObject(obj)) {
        return Object.entries(obj).reduce(
            (acc, [key, value]) => {
                const camelCaseKey = key.replace(/(_\w)/g, (m) =>
                    m[1].toUpperCase(),
                );
                acc[camelCaseKey] =
                    isObject(value) || Array.isArray(value)
                        ? snakeToCamelCase(value)
                        : value;
                return acc;
            },
            {} as Record<string, never>,
        ) as T;
    }
    return obj;
}

export function camelToSnakeCase<T extends Record<string, unknown>>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => camelToSnakeCase(item)) as unknown as T;
    } else if (isObject(obj)) {
        return Object.entries(obj).reduce(
            (acc, [key, value]) => {
                const snakeCaseKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                acc[snakeCaseKey] =
                    isObject(value) || Array.isArray(value)
                        ? camelToSnakeCase(value as Record<string, unknown>)
                        : value;
                return acc;
            },
            {} as Record<string, unknown>,
        ) as T;
    }
    return obj;
}
