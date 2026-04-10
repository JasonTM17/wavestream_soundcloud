"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName?: string;
  entityLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  entityName,
  entityLabel = "item",
  dialogTitle,
  dialogDescription,
  confirmLabel,
  isPending = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const heading = dialogTitle ?? `Delete ${entityLabel}`;
  const description =
    dialogDescription ??
    (entityName
      ? `This will permanently remove "${entityName}" from the current view and any owner-managed collections.`
      : `This will permanently remove the selected ${entityLabel} from the current view and any owner-managed collections.`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
          Confirming this action should only be possible for the current owner or an authorized
          moderator. The component itself stays generic so the caller can enforce those rules.
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={isPending}>
            {isPending ? "Deleting..." : confirmLabel ?? `Delete ${entityLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
