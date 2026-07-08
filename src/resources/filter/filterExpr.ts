import { z } from "zod";

// Mirrors the backend filter.Expr AST (examen-backend/filter/filter.go). The
// wire form is a recursive tree: a node is exactly one of and/or/not/match. The
// zero value {} is the identity (matches everything = unfiltered).
//
// Ops: the AST declares all six, but the backend only COMPILES `eq` today
// (others return 400 "operator not supported yet"). We expose them all in the
// builder per the chosen design, flagging the unsupported ones in the UI.

// ── Wire model ────────────────────────────────────────────────────────────────

export type Op = "eq" | "neq" | "re" | "nre" | "exists" | "nexists";

export interface Match {
    path: string[];
    op: Op;
    value?: string; // unused for exists/nexists
}

export interface Expr {
    and?: Expr[];
    or?: Expr[];
    not?: Expr;
    match?: Match;
}

export const ExprSchema: z.ZodType<Expr> = z.lazy(() =>
    z.object({
        and: z.array(ExprSchema).optional(),
        or: z.array(ExprSchema).optional(),
        not: ExprSchema.optional(),
        match: z
            .object({
                path: z.array(z.string()),
                op: z.enum(["eq", "neq", "re", "nre", "exists", "nexists"]),
                value: z.string().optional(),
            })
            .optional(),
    }),
);

export const OPS: { value: Op; label: string }[] = [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "re", label: "=~" },
    { value: "nre", label: "!~" },
    { value: "exists", label: "exists" },
    { value: "nexists", label: "!exists" },
];

/** exists/nexists are unary — no value field. */
export function opNeedsValue(op: Op): boolean {
    return op !== "exists" && op !== "nexists";
}

/** Only eq is wired through to SQL on the backend today. */
export function opSupported(op: Op): boolean {
    return op === "eq";
}

// ── Editor model (carries ids for stable React keys + in-place editing) ────────

export type Combinator = "and" | "or";

export interface MatchNode {
    id: string;
    kind: "match";
    negated: boolean;
    /** Top-level key; a dotted "a.b" is split into a nested path on serialize. */
    key: string;
    op: Op;
    value: string;
}

export interface GroupNode {
    id: string;
    kind: "group";
    negated: boolean;
    combinator: Combinator;
    children: FilterNode[];
}

export type FilterNode = GroupNode | MatchNode;

let counter = 0;
const nextId = () => `n${++counter}`;

export function newMatch(): MatchNode {
    return { id: nextId(), kind: "match", negated: false, key: "", op: "eq", value: "" };
}

export function newGroup(combinator: Combinator = "and"): GroupNode {
    return { id: nextId(), kind: "group", negated: false, combinator, children: [] };
}

/** A fresh root: an AND group seeded with one empty condition. */
export function newRoot(): GroupNode {
    const g = newGroup("and");
    g.children = [newMatch()];
    return g;
}

const keyToPath = (key: string): string[] =>
    key.split(".").map((s) => s.trim()).filter(Boolean);

const pathToKey = (path: string[]): string => path.join(".");

// ── Editor → wire ─────────────────────────────────────────────────────────────

/** A match is only emitted once it has a key (and a value when the op needs one). */
function nodeToExpr(node: FilterNode): Expr | null {
    if (node.kind === "match") {
        const path = keyToPath(node.key);
        if (path.length === 0) return null;
        if (opNeedsValue(node.op) && node.value.trim() === "") return null;
        const match: Match = { path, op: node.op };
        if (opNeedsValue(node.op)) match.value = node.value;
        const e: Expr = { match };
        return node.negated ? { not: e } : e;
    }
    const kids = node.children
        .map(nodeToExpr)
        .filter((e): e is Expr => e !== null);
    if (kids.length === 0) return null;
    // A single child needs no and/or wrapper (and([x]) ≡ x) — keeps JSON tidy.
    const inner: Expr =
        kids.length === 1
            ? kids[0]
            : node.combinator === "or"
              ? { or: kids }
              : { and: kids };
    return node.negated ? { not: inner } : inner;
}

export function toFilterExpr(root: GroupNode): Expr {
    return nodeToExpr(root) ?? {};
}

export function isIdentity(e: Expr): boolean {
    return !e.and && !e.or && !e.not && !e.match;
}

/** Serialized JSON for the ?attrs= query param, or null when the filter is empty. */
export function serializeAttrs(root: GroupNode): string | null {
    const e = toFilterExpr(root);
    return isIdentity(e) ? null : JSON.stringify(e);
}

/** Count of complete (emittable) leaf conditions — for the active-filter badge. */
export function countConditions(node: FilterNode): number {
    if (node.kind === "match") {
        const path = keyToPath(node.key);
        if (path.length === 0) return 0;
        if (opNeedsValue(node.op) && node.value.trim() === "") return 0;
        return 1;
    }
    return node.children.reduce((n, c) => n + countConditions(c), 0);
}

// ── Wire → editor (loading a saved view, FE-6) ────────────────────────────────

function exprToNode(e: Expr): FilterNode {
    if (e.not) {
        const inner = exprToNode(e.not);
        inner.negated = !inner.negated;
        return inner;
    }
    if (e.match) {
        return {
            id: nextId(),
            kind: "match",
            negated: false,
            key: pathToKey(e.match.path),
            op: e.match.op,
            value: e.match.value ?? "",
        };
    }
    if (e.or || e.and) {
        const combinator: Combinator = e.or ? "or" : "and";
        const children = (e.or ?? e.and ?? []).map(exprToNode);
        return { id: nextId(), kind: "group", negated: false, combinator, children };
    }
    return newGroup("and");
}

/** Builds an editor root from a wire Expr; a bare leaf is wrapped in a group. */
export function toEditorRoot(e: Expr): GroupNode {
    if (isIdentity(e)) return newRoot();
    const node = exprToNode(e);
    if (node.kind === "group") return node;
    const g = newGroup("and");
    g.children = [node];
    return g;
}

// ── Immutable tree edits (by id) ──────────────────────────────────────────────

export function updateNode(
    root: GroupNode,
    id: string,
    patch: (n: FilterNode) => FilterNode,
): GroupNode {
    const rec = (node: FilterNode): FilterNode => {
        if (node.id === id) return patch(node);
        if (node.kind === "group")
            return { ...node, children: node.children.map(rec) };
        return node;
    };
    return rec(root) as GroupNode;
}

export function removeNode(root: GroupNode, id: string): GroupNode {
    const rec = (node: GroupNode): GroupNode => ({
        ...node,
        children: node.children
            .filter((c) => c.id !== id)
            .map((c) => (c.kind === "group" ? rec(c) : c)),
    });
    return rec(root);
}

export function addChild(
    root: GroupNode,
    groupId: string,
    child: FilterNode,
): GroupNode {
    return updateNode(root, groupId, (n) =>
        n.kind === "group" ? { ...n, children: [...n.children, child] } : n,
    ) as GroupNode;
}
