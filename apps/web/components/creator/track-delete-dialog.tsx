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

type TrackDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackTitle?: string;
  isPending?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function TrackDeleteDialog({
  open,
  onOpenChange,
  trackTitle,
  isPending = false,
  onConfirm,
}: TrackDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Delete track</DialogTitle>
          <DialogDescription>
            {trackTitle
              ? `This will remove "${trackTitle}" from your public catalog and dashboard analytics views.`
              : "This will remove the selected track from your public catalog and dashboard analytics views."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
          The delete is safe and owner-checked on the backend, but listeners will no longer be able
          to access this track from discovery or your profile.
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete track"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

