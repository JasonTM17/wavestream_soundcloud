"use client";

import * as React from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/lib/player-store";
import {
  formatCompactNumber,
  formatDuration,
  toTrackCard,
  type TrackSummary,
} from "@/lib/wavestream-api";

type LandingHeroPlayButtonProps = {
  spotlightTrack: TrackSummary | null;
  queueTracks: TrackSummary[];
};

function getPlayableQueue(
  spotlightTrack: TrackSummary | null,
  queueTracks: TrackSummary[],
) {
  const source = queueTracks.length ? queueTracks : spotlightTrack ? [spotlightTrack] : [];
  const seen = new Set<string>();

  return source
    .filter((track) => {
      if (seen.has(track.id)) {
        return false;
      }

      seen.add(track.id);
      return true;
    })
    .map((track) => toTrackCard(track));
}

export function LandingHeroPlayButton({
  spotlightTrack,
  queueTracks,
}: LandingHeroPlayButtonProps) {
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);

  const playableQueue = React.useMemo(
    () => getPlayableQueue(spotlightTrack, queueTracks),
    [queueTracks, spotlightTrack],
  );
  const spotlightCard = React.useMemo(
    () => (spotlightTrack ? toTrackCard(spotlightTrack) : playableQueue[0] ?? null),
    [playableQueue, spotlightTrack],
  );

  const isActiveTrack = currentTrack?.id === spotlightCard?.id;
  const buttonLabel = !spotlightCard
    ? "No live track"
    : isActiveTrack
      ? isBuffering
        ? "Buffering spotlight"
        : isPlaying
          ? "Pause spotlight"
          : "Resume spotlight"
      : "Play spotlight";
  const statusLabel = !spotlightCard
    ? "Seeded public audio will appear here once discovery data is available."
    : `${spotlightTrack?.artist.displayName ?? spotlightCard.artistName} / ${formatDuration(
        spotlightTrack?.duration ?? spotlightCard.durationSeconds ?? 0,
      )} / ${formatCompactNumber(spotlightTrack?.playCount ?? 0)} plays`;

  const handlePlay = () => {
    if (!spotlightCard) {
      return;
    }

    if (isActiveTrack) {
      togglePlay();
      return;
    }

    if (playableQueue.length) {
      setQueue(playableQueue);
    }

    playTrack(spotlightCard);
  };

  return (
    <div className="w-full space-y-3">
      <Button
        size="lg"
        className="w-full"
        onClick={handlePlay}
        disabled={!spotlightCard}
      >
        {isActiveTrack && isBuffering ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : isActiveTrack && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {buttonLabel}
      </Button>
      <div className="flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Badge variant={spotlightCard ? "soft" : "outline"}>
          {isActiveTrack ? (isPlaying ? "Now playing" : "Ready in player") : "Live spotlight"}
        </Badge>
        <span className="text-xs">{statusLabel}</span>
      </div>
    </div>
  );
}

