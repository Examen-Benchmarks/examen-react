// @examen/crud — data core (UI-agnostic, Zod-based)
//
// Only the transport/data layer of the original package is kept here: the
// context provider, the React-Query data hooks, the axios helpers, the wire
// types, and the snake⇄camel utilities. The MUI-Joy list/selection/form UI
// from the source package is intentionally NOT copied — this app supplies its
// own widgets.
//
// Entities are described by Zod schemas, not classes: the data hooks take a
// `z.ZodType` and `schema.parse` both validates and rehydrates the response.
// Concrete entity schemas live in the app, composed from `entityFields`.

// context (transport + labels). Auth is the `examen_session` cookie — the
// axios client sends credentials automatically, so there is no token here.
export { CrudProvider } from "./context/CrudContext";
export { useCrudContext, useCrudT, useApiClient } from "./context/hooks";
export { type CrudContextValue } from "./context/context";
export {
    DEFAULT_LABELS,
    defaultT,
    type TFunction,
    type TOptions,
} from "./context/labels";

// hooks
export { default as useGetResource } from "./hooks/useGetResource";
export { default as useGetResources } from "./hooks/useGetResources";
export { default as useMutateResource } from "./hooks/useMutateResource";
export { default as useErrorMessage } from "./hooks/useErrorMessage";

// api
export * from "./api/axios";
export * from "./api/get";
export * from "./api/getObjects";
export * from "./api/mutateObject";

// entity schema helpers (composed by the app's concrete schemas)
export {
    entityFields,
    EntitySchema,
    externalEntityFields,
    ExternalEntitySchema,
} from "./types/Entity";
export type { Entity, ExternalEntity } from "./types/Entity";

// types
export type {
    IMutationProps,
    HTTPMethod,
    FormFormat,
} from "./types/MutationProps";
export type { UseStreamingQuery } from "./types/UseStreamingQuery";
export type { IQueryResult, IMutationResult } from "./types/QueryResult";
export type { ErrorComponentProps } from "./types/ErrorComponentProps";

// utility
export { camelToSnakeCase, snakeToCamelCase } from "./utility/functions";
