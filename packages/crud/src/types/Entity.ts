import { z } from "zod";

/**
 * Base fields every Examen entity carries. Spread into a resource schema so the
 * concrete schemas (authored in the app, ideally generated from the OpenAPI)
 * stay DRY:
 *
 *   const ProjectSchema = z.object({
 *       ...entityFields,
 *       key: z.string().min(1).max(200),
 *       name: z.string().min(1).max(200),
 *   });
 *
 * Timestamps are coerced from the API's ISO strings into real `Date`s — the
 * rehydration the old class constructor did, now declarative. Everything is
 * optional so the same shape also describes a not-yet-persisted draft.
 */
export const entityFields = {
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
} as const;

/** Standalone schema for the base entity, when needed directly. */
export const EntitySchema = z.object(entityFields);
export type Entity = z.infer<typeof EntitySchema>;

/** An entity that also mirrors an id from an external system. */
export const externalEntityFields = {
    ...entityFields,
    externalId: z.string().optional(),
} as const;

export const ExternalEntitySchema = z.object(externalEntityFields);
export type ExternalEntity = z.infer<typeof ExternalEntitySchema>;
