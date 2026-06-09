import { z } from "zod";

// Wire shapes are snake_case; the core camel-cases before parsing, so these
// schemas describe the camelCased result.

/** GET /auth/me — the current principal. */
export const MeSchema = z.object({
    userId: z.string(),
    isAdmin: z.boolean(),
    via: z.string(),
});
export type Me = z.infer<typeof MeSchema>;

/** POST /auth/login response body (the cookie is set via Set-Cookie). */
export const LoginResultSchema = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    isAdmin: z.boolean(),
});
export type LoginResult = z.infer<typeof LoginResultSchema>;

/** POST /auth/login request body. */
export const LoginInputSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;
