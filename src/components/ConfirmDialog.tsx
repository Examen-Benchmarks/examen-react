import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * Generic confirm-before-destroying dialog. Open when `open` is true; the caller
 * owns the target and closes via `onCancel`. `onConfirm` may throw/reject — the
 * dialog stays open so the caller can surface the error and let them retry.
 */
export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Delete",
    pendingLabel = "Deleting…",
    pending = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    pendingLabel?: string;
    pending?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={pending}
                        onClick={onConfirm}
                    >
                        {pending ? pendingLabel : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
