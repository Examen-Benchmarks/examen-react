import { z } from "zod";

// API keys are per-user secrets for programmatic access (CLI, CI). The wire is
// snake_case; the core camel-cases before parsing, so these schemas describe
// the camelCased payloads.

/** GET /api-keys item — the safe view; never the secret or its hash. */
export const ApiKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    prefix: z.string(),
    createdAt: z.coerce.date(),
    lastUsedAt: z.coerce.date().nullish(),
    revokedAt: z.coerce.date().nullish(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

/** POST /api-keys request body. */
export const CreateApiKeyInputSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;

/**
 * POST /api-keys response — the ONLY time the plaintext `key` is returned. It
 * is not stored and cannot be recovered later, so the UI must surface it once.
 */
export const CreatedApiKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    prefix: z.string(),
    key: z.string(),
    createdAt: z.coerce.date(),
});
export type CreatedApiKey = z.infer<typeof CreatedApiKeySchema>;
