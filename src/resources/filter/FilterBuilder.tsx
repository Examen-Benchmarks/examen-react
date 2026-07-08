import { ListPlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    addChild,
    newGroup,
    newMatch,
    OPS,
    opNeedsValue,
    opSupported,
    removeNode,
    updateNode,
    type FilterNode,
    type GroupNode,
    type MatchNode,
    type Op,
} from "./filterExpr";
import { useAttributeKeys, useAttributeValues } from "./useAttributes";

/** Shared callbacks threaded through the tree so nodes edit the root by id. */
interface BuilderApi {
    benchId: string;
    keysListId: string;
    update: (id: string, patch: (n: FilterNode) => FilterNode) => void;
    remove: (id: string) => void;
    add: (groupId: string, child: FilterNode) => void;
}

function NotToggle({
    negated,
    onToggle,
}: {
    negated: boolean;
    onToggle: () => void;
}) {
    return (
        <Button
            type="button"
            size="sm"
            variant={negated ? "default" : "outline"}
            className="h-7 px-2 text-xs"
            onClick={onToggle}
            title="Negate"
        >
            NOT
        </Button>
    );
}

function MatchEditor({ node, api }: { node: MatchNode; api: BuilderApi }) {
    const { values } = useAttributeValues(api.benchId, node.key);
    const valuesListId = `vals-${node.id}`;
    const needsValue = opNeedsValue(node.op);
    const unsupported = !opSupported(node.op);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <NotToggle
                negated={node.negated}
                onToggle={() =>
                    api.update(node.id, (n) => ({ ...n, negated: !n.negated }))
                }
            />
            <Input
                list={api.keysListId}
                value={node.key}
                placeholder="key"
                className="h-8 w-44"
                onChange={(e) =>
                    api.update(node.id, (n) => ({ ...n, key: e.target.value }))
                }
            />
            <Select
                value={node.op}
                onValueChange={(v) =>
                    api.update(node.id, (n) => ({ ...n, op: v as Op }))
                }
            >
                <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {OPS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {needsValue && (
                <>
                    <Input
                        list={valuesListId}
                        value={node.value}
                        placeholder="value"
                        className="h-8 w-44"
                        onChange={(e) =>
                            api.update(node.id, (n) => ({
                                ...n,
                                value: e.target.value,
                            }))
                        }
                    />
                    <datalist id={valuesListId}>
                        {values.map((v) => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>
                </>
            )}
            {unsupported && (
                <span
                    className="text-xs text-amber-600 dark:text-amber-500"
                    title="The backend only filters on = today; other operators are saved but not applied yet."
                >
                    not applied yet
                </span>
            )}
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="ml-auto size-7"
                onClick={() => api.remove(node.id)}
                aria-label="Remove condition"
            >
                <X className="size-4" />
            </Button>
        </div>
    );
}

function GroupEditor({
    node,
    api,
    isRoot = false,
}: {
    node: GroupNode;
    api: BuilderApi;
    isRoot?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-lg border p-3",
                node.negated && "border-amber-500/60",
            )}
        >
            <div className="flex items-center gap-2">
                {!isRoot && (
                    <NotToggle
                        negated={node.negated}
                        onToggle={() =>
                            api.update(node.id, (n) => ({
                                ...n,
                                negated: !n.negated,
                            }))
                        }
                    />
                )}
                <Select
                    value={node.combinator}
                    onValueChange={(v) =>
                        api.update(node.id, (n) => ({
                            ...n,
                            combinator: v as GroupNode["combinator"],
                        }))
                    }
                >
                    <SelectTrigger className="h-8 w-[84px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="and">AND</SelectItem>
                        <SelectItem value="or">OR</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                    of the following
                </span>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => api.add(node.id, newMatch())}
                    >
                        <Plus className="size-3.5" />
                        Condition
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => api.add(node.id, newGroup())}
                    >
                        <ListPlus className="size-3.5" />
                        Group
                    </Button>
                    {!isRoot && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => api.remove(node.id)}
                            aria-label="Remove group"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 border-l pl-3">
                {node.children.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Empty group — add a condition or nested group.
                    </p>
                ) : (
                    node.children.map((c) =>
                        c.kind === "group" ? (
                            <GroupEditor key={c.id} node={c} api={api} />
                        ) : (
                            <MatchEditor key={c.id} node={c} api={api} />
                        ),
                    )
                )}
            </div>
        </div>
    );
}

/**
 * Recursive attribute-filter builder (FE-5). Edits a nested and/or/not + match
 * tree (the editor mirror of filter.Expr) and reports every change up via
 * onChange. Key/value suggestions come from the bench's attribute discovery;
 * serializing the tree to the wire form and applying it lives in the caller.
 */
export default function FilterBuilder({
    benchId,
    value,
    onChange,
}: {
    benchId: string;
    value: GroupNode;
    onChange: (root: GroupNode) => void;
}) {
    const { keys } = useAttributeKeys(benchId);
    const keysListId = `keys-${benchId}`;

    const api: BuilderApi = {
        benchId,
        keysListId,
        update: (id, patch) => onChange(updateNode(value, id, patch)),
        remove: (id) => onChange(removeNode(value, id)),
        add: (groupId, child) => onChange(addChild(value, groupId, child)),
    };

    return (
        <div className="flex flex-col gap-2">
            <datalist id={keysListId}>
                {keys.map((k) => (
                    <option key={k} value={k} />
                ))}
            </datalist>
            <GroupEditor node={value} api={api} isRoot />
        </div>
    );
}
