import { z } from "zod";
import { entityFields } from "@examen/crud";

/**
 * A Project as returned by the API: the shared entity fields + the
 * business key / name / description. Composed from `entityFields` so the
 * id and (coerced) timestamps stay consistent across resources.
 */
export const ProjectSchema = z.object({
    ...entityFields,
    userId: z.string().optional(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullish(),
});
export type Project = z.infer<typeof ProjectSchema>;

/**
 * The create payload — only the client-supplied fields. `user_id` is the
 * authenticated caller server-side, never sent from here.
 */
export const ProjectCreateSchema = z.object({
    key: z.string().min(1, "Key is required").max(200),
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(2000).optional(),
});
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
