"use client";

import * as React from "react";
import { ListMusic, Plus, Music4 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type PlaylistPick = {
  id: string;
  title: string;
  description?: string | null;
  trackCount?: number;
  totalDurationLabel?: string;
  isPublic?: boolean;
  coverUrl?: string | null;
};

export type AddToPlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackTitle: string;
  trackArtistName?: string;
  trackDescription?: string;
  playlists: PlaylistPick[];
  selectedPlaylistId?: string;
  defaultSelectedPlaylistId?: string;
  isPending?: boolean;
  confirmLabel?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onSelectedPlaylistIdChange?: (playlistId: string) => void;
  onConfirm: (playlistId: string) => Promise<void> | void;
  onCreatePlaylist?: () => void;
};

function useControllableSelection(
  controlledValue: string | undefined,
  defaultValue: string | undefined,
  onChange?: (playlistId: string) => void,
) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const value = controlledValue ?? internalValue;
  const setValue = React.useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [controlledValue, onChange],
  );

  return [value, setValue] as const;
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  trackTitle,
  trackArtistName,
  trackDescription,
  playlists,
  selectedPlaylistId,
  defaultSelectedPlaylistId,
  isPending = false,
  confirmLabel = "Add to playlist",
  emptyStateTitle = "No playlists yet",
  emptyStateDescription = "Create a playlist first, then add this track to it.",
  onSelectedPlaylistIdChange,
  onConfirm,
  onCreatePlaylist,
}: AddToPlaylistDialogProps) {
  const firstPlaylistId = playlists[0]?.id;
  const [selection, setSelection] = useControllableSelection(
    selectedPlaylistId,
    defaultSelectedPlaylistId ?? firstPlaylistId,
    onSelectedPlaylistIdChange,
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (selection || !firstPlaylistId) {
      return;
    }

    setSelection(firstPlaylistId);
  }, [firstPlaylistId, open, selection, setSelection]);

  const hasPlaylists = playlists.length > 0;
  const selectedPlaylist = playlists.find((playlist) => playlist.id === selection) ?? null;

  const handleConfirm = () => {
    if (!selection) {
      return;
    }

    void onConfirm(selection);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,42rem)]">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-black">
            <ListMusic className="h-5 w-5" />
          </div>
          <DialogTitle>Add to playlist</DialogTitle>
          <DialogDescription>
            Add <span className="font-medium text-foreground">{trackTitle}</span>
            {trackArtistName ? ` by ${trackArtistName}` : ""} to one of your saved playlists.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-[hsl(var(--muted))] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-black">
              <Music4 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{trackTitle}</p>
              <p className="text-sm text-muted-foreground">
                {trackDescription ?? "Choose a destination playlist and the page can refresh the collection immediately after confirmation."}
              </p>
            </div>
          </div>
        </div>

        {hasPlaylists ? (
          <ScrollArea className="h-[22rem] pr-3">
            <div className="space-y-3">
              {playlists.map((playlist) => {
                const isSelected = playlist.id === selection;
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => setSelection(playlist.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-md border-none p-4 text-left transition-colors",
                      isSelected
                        ? "bg-[hsl(var(--accent))] text-white"
                        : "bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]",
                    )}
                  >
                    <div
                      className="h-14 w-14 rounded-md bg-[hsl(var(--accent))] shrink-0"
                      style={
                        playlist.coverUrl
                          ? {
                              backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.18), rgba(7, 11, 24, 0.48)), url(${playlist.coverUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{playlist.title}</p>
                        <Badge variant={playlist.isPublic ? "soft" : "outline"}>
                          {playlist.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {playlist.description ?? "No description yet."}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {playlist.trackCount ?? 0} tracks
                      </Badge>
                      {playlist.totalDurationLabel ? (
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {playlist.totalDurationLabel}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-md bg-[hsl(var(--muted))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white">
                <Plus className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{emptyStateTitle}</p>
                <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {onCreatePlaylist ? (
            <Button type="button" variant="outline" onClick={onCreatePlaylist} disabled={isPending}>
              <Plus className="h-4 w-4" />
              Create playlist
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Close
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending || !selection}>
            {isPending ? "Adding..." : confirmLabel}
          </Button>
        </DialogFooter>

        {selectedPlaylist ? (
          <p className="text-xs text-muted-foreground">
            Selected destination: <span className="font-medium text-foreground">{selectedPlaylist.title}</span>
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

