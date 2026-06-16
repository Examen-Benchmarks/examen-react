import { useState } from "react";
import { Copy, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SchemaForm } from "@/forms/SchemaForm";
import { getErrorMessage } from "@/lib/errors";
import {
    CreateApiKeyInputSchema,
    type ApiKey,
    type CreatedApiKey,
} from "./schemas";
import { useApiKeys } from "./useApiKeys";

function fmtDate(d?: Date | null): string {
    return d ? d.toLocaleString() : "—";
}

export default function ApiKeysPage() {
    const {
        keys,
        isLoading,
        isError,
        error,
        create,
        createError,
        revoke,
        revokingId,
    } = useApiKeys();

    const [open, setOpen] = useState(false);
    // While the dialog is open, holds the freshly-minted key (shown once, since
    // the secret is unrecoverable after). Null ⇒ the dialog shows the form.
    const [created, setCreated] = useState<CreatedApiKey | null>(null);
    // The key awaiting revoke confirmation; null ⇒ the confirm dialog is closed.
    const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

    // Reset to the form state whenever the dialog closes.
    const onOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) setCreated(null);
    };

    const copyKey = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(created.key);
            toast.success("API key copied to clipboard");
        } catch {
            toast.error("Couldn’t copy — select and copy the key manually");
        }
    };

    const confirmRevoke = async () => {
        const k = revokeTarget;
        if (!k) return;
        try {
            await revoke(k.id);
            toast.success(`Revoked “${k.name}”`);
            setRevokeTarget(null);
        } catch (e) {
            // Keep the dialog open so they can retry.
            toast.error(getErrorMessage(e));
        }
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    API keys
                </h1>
                <p className="text-sm text-muted-foreground">
                    Authenticate the CLI and CI against the Examen API. Each key
                    belongs to your account and carries your access.
                </p>
            </div>

            <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Your keys</h2>
                    <Button onClick={() => onOpenChange(true)}>
                        <Plus className="size-4" />
                        Create key
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : isError ? (
                    <p className="text-sm text-destructive" role="alert">
                        {getErrorMessage(error)}
                    </p>
                ) : keys.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No API keys yet.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Prefix</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last used</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.map((k) => {
                                    const revoked = !!k.revokedAt;
                                    return (
                                        <TableRow key={k.id}>
                                            <TableCell className="font-medium">
                                                {k.name}
                                            </TableCell>
                                            <TableCell>
                                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                    {k.prefix}…
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {fmtDate(k.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {fmtDate(k.lastUsedAt)}
                                            </TableCell>
                                            <TableCell>
                                                {revoked ? (
                                                    <Badge variant="outline">
                                                        Revoked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    disabled={
                                                        revoked ||
                                                        revokingId === k.id
                                                    }
                                                    onClick={() =>
                                                        setRevokeTarget(k)
                                                    }
                                                    aria-label={`Revoke ${k.name}`}
                                                    title="Revoke"
                                                >
                                                    {revokingId === k.id ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="size-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </section>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    {created ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShieldAlert className="size-4 text-amber-600 dark:text-amber-500" />
                                    Save your API key
                                </DialogTitle>
                                <DialogDescription>
                                    This is the only time the full key for “
                                    {created.name}” is shown. Store it somewhere
                                    safe — you won’t be able to see it again.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="relative">
                                <Input
                                    readOnly
                                    value={created.key}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="pr-10 font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={copyKey}
                                    aria-label="Copy API key"
                                    title="Copy"
                                    className="absolute right-1 top-1/2 -translate-y-1/2"
                                >
                                    <Copy className="size-4" />
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="secondary"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>New API key</DialogTitle>
                                <DialogDescription>
                                    Give it a name so you can recognise it later.
                                </DialogDescription>
                            </DialogHeader>
                            <SchemaForm
                                schema={CreateApiKeyInputSchema}
                                fields={[
                                    {
                                        name: "name",
                                        label: "Name",
                                        placeholder: "CI, laptop, …",
                                    },
                                ]}
                                submitLabel="Create key"
                                submitError={
                                    createError
                                        ? getErrorMessage(createError)
                                        : null
                                }
                                onSubmit={async (values) => {
                                    setCreated(await create(values));
                                }}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!revokeTarget}
                onOpenChange={(next) => {
                    if (!next) setRevokeTarget(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke API key?</DialogTitle>
                        <DialogDescription>
                            “{revokeTarget?.name}” will stop working immediately
                            and any client using it will lose access. This can’t
                            be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRevokeTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={revokingId === revokeTarget?.id}
                            onClick={confirmRevoke}
                        >
                            {revokingId === revokeTarget?.id
                                ? "Revoking…"
                                : "Revoke key"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
