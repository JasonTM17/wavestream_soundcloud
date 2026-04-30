"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { WaveformBar } from "@/components/player/waveform-bar";
import { useAuthSession } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";
import { usePlayerStore, type PlayerTrack } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { useToggleTrackReactionMutation } from "@/lib/wavestream-queries";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RepostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function TrackArtwork({
  track,
  className,
}: {
  track?: PlayerTrack | null;
  className?: string;
}) {
  return (
    <div
      className={cn("shrink-0 overflow-hidden rounded bg-muted", className)}
      style={
        track?.coverUrl
          ? {
              backgroundImage: `url(${track.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    />
  );
}

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function MiniPlayer() {
  const router = useRouter();
  const session = useAuthSession();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const error = usePlayerStore((state) => state.error);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const queue = usePlayerStore((state) => state.queue);
  const recentTracks = usePlayerStore((state) => state.recentTracks);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const previousTrack = usePlayerStore((state) => state.previousTrack);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setRepeat = usePlayerStore((state) => state.setRepeat);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const t = useT("player");
  const tCommon = useT("common");

  const hasTrack = Boolean(currentTrack);
  const [queueOpen, setQueueOpen] = React.useState(false);

  const [liked, setLiked] = React.useState(false);
  const [reposted, setReposted] = React.useState(false);
  React.useEffect(() => {
    setLiked(Boolean(currentTrack?.isLiked));
    setReposted(Boolean(currentTrack?.isReposted));
  }, [currentTrack?.id, currentTrack?.isLiked, currentTrack?.isReposted]);

  const likeMutation = useToggleTrackReactionMutation(currentTrack?.slug ?? "", "like");
  const repostMutation = useToggleTrackReactionMutation(currentTrack?.slug ?? "", "repost");

  const handleLike = React.useCallback(() => {
    if (!currentTrack) return;
    if (!session.isAuthenticated) {
      const next = `/track/${currentTrack.slug}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    const next = !liked;
    setLiked(next);
    likeMutation.mutate(next, { onError: () => setLiked((v) => !v) });
  }, [currentTrack, session.isAuthenticated, liked, likeMutation, router]);

  const handleRepost = React.useCallback(() => {
    if (!currentTrack) return;
    if (!session.isAuthenticated) {
      const next = `/track/${currentTrack.slug}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    const next = !reposted;
    setReposted(next);
    repostMutation.mutate(next, { onError: () => setReposted((v) => !v) });
  }, [currentTrack, session.isAuthenticated, reposted, repostMutation, router]);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const statusLabel = error ? t.error : isBuffering ? t.buffering : currentTrack?.genreLabel ?? "";
  const playbackRateLabel = `${playbackRate.toFixed(playbackRate % 1 === 0 ? 0 : 2)}x`;
  const activeQueueIndex = currentTrack
    ? queue.findIndex((track) => track.id === currentTrack.id)
    : -1;
  const visibleRecentTracks = recentTracks.filter(
    (track) =>
      track.id !== currentTrack?.id &&
      !queue.some((queuedTrack) => queuedTrack.id === track.id),
  );
  const canOpenDrawer = hasTrack || queue.length > 0 || visibleRecentTracks.length > 0;

  React.useEffect(() => {
    if (queueOpen && !canOpenDrawer) {
      setQueueOpen(false);
    }
  }, [canOpenDrawer, queueOpen]);

  const cyclePlaybackRate = () => {
    const nextRate =
      playbackRate >= 1.5 ? 1 : playbackRate >= 1.25 ? 1.5 : playbackRate >= 1 ? 1.25 : 1;
    setPlaybackRate(nextRate);
  };

  const cycleRepeat = () => {
    setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");
  };

  const queueToggleProps = {
    "aria-label": queueOpen ? t.closePlayer : t.toggleQueue,
    "aria-expanded": queueOpen,
    "aria-controls": "mini-player-drawer",
    disabled: !canOpenDrawer,
    onClick: () => setQueueOpen((value) => !value),
  };

  return (
    <div className="relative z-10 isolate" data-testid="mini-player">
      {queueOpen && (
        <div
          className="absolute bottom-full left-0 right-0 border-t border-border bg-card shadow-2xl"
          id="mini-player-drawer"
          data-testid="mini-player-drawer"
          role="region"
          aria-labelledby="mini-player-drawer-title"
        >
          <div className="mx-auto flex max-h-[calc(100vh-96px)] max-w-[1600px] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2
                  id="mini-player-drawer-title"
                  className="flex items-center gap-2 text-sm font-bold text-foreground"
                >
                  <ListMusic className="h-4 w-4 text-primary" />
                  {t.queue}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {currentTrack?.title ?? t.queueEmpty}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {queue.length > 0 && (
                  <IconButton
                    aria-label={t.clearQueue}
                    onClick={clearQueue}
                    className="h-10 min-w-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                )}
                <IconButton
                  aria-label={t.closePlayer}
                  onClick={() => setQueueOpen(false)}
                  className="h-10 min-w-10"
                >
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            <div className="grid min-h-0 gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="border-b border-border p-4 md:border-b-0 md:border-r">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t.nowPlaying}
                </p>
                <div
                  className="flex min-h-20 items-center gap-3 rounded-lg bg-muted/40 p-3"
                  data-testid="mini-player-current-track"
                >
                  <TrackArtwork track={currentTrack} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {currentTrack?.title ?? t.selectTrack}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currentTrack?.artistName ?? t.waveStream}
                    </p>
                    {statusLabel && (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {statusLabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3 md:hidden" aria-label={t.playbackControls}>
                  <div className="flex items-center justify-center gap-2">
                    <IconButton
                      onClick={toggleShuffle}
                      aria-label={t.toggleShuffle}
                      disabled={!hasTrack}
                      className={cn(shuffle && "text-primary")}
                    >
                      <Shuffle className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      onClick={previousTrack}
                      aria-label={t.previousTrack}
                      disabled={!hasTrack}
                    >
                      <SkipBack className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      onClick={togglePlay}
                      aria-label={isPlaying ? tCommon.pause : tCommon.play}
                      disabled={!hasTrack}
                      className="h-12 min-w-12 bg-primary text-primary-foreground hover:text-primary-foreground"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                    </IconButton>
                    <IconButton
                      onClick={nextTrack}
                      aria-label={t.nextTrack}
                      disabled={!hasTrack}
                    >
                      <SkipForward className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      onClick={cycleRepeat}
                      aria-label={t.cycleRepeat}
                      disabled={!hasTrack}
                      className={cn(repeat !== "off" && "text-primary")}
                    >
                      {repeat === "one" ? (
                        <Repeat1 className="h-4 w-4" />
                      ) : (
                        <Repeat className="h-4 w-4" />
                      )}
                    </IconButton>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-right text-[10px] tabular-nums text-muted-foreground">
                      {formatTime(hasTrack ? progress : 0)}
                    </span>
                    <WaveformBar
                      progress={progressPercent}
                      duration={duration}
                      onSeek={setProgress}
                      disabled={!hasTrack}
                      seed={currentTrack?.slug ?? "mobile"}
                      ariaLabel={t.waveformSeek}
                      className="h-9 flex-1"
                    />
                    <span className="w-9 text-[10px] tabular-nums text-muted-foreground">
                      {formatTime(hasTrack ? duration : 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3" aria-label={t.volumeControl}>
                    <IconButton
                      onClick={toggleMute}
                      aria-label={t.toggleMute}
                      disabled={!hasTrack}
                      className="h-10 min-w-10"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </IconButton>
                    <Slider
                      value={[muted ? 0 : Math.round(volume * 100)]}
                      max={100}
                      step={1}
                      onValueChange={(values) => setVolume((values[0] ?? 0) / 100)}
                      disabled={!hasTrack}
                      aria-label={t.volumeControl}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={cyclePlaybackRate}
                      disabled={!hasTrack}
                      aria-label={t.cyclePlaybackRate}
                      className="h-10 min-w-12 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    >
                      {playbackRateLabel}
                    </button>
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[46vh] md:max-h-80">
                <div className="space-y-4 p-4">
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t.upNext}
                      </p>
                      {activeQueueIndex >= 0 && queue.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {activeQueueIndex + 1}/{queue.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1" data-testid="mini-player-queue-list">
                      {queue.length ? (
                        queue.map((track, index) => {
                          const isActive = track.id === currentTrack?.id;
                          return (
                            <div
                              key={`${track.id}-${index}`}
                              className={cn(
                                "flex min-h-12 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                                isActive ? "bg-muted/70" : "hover:bg-muted/50",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => playQueueIndex(index)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              >
                                <TrackArtwork track={track} className="h-10 w-10" />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "truncate text-sm font-medium",
                                      isActive ? "text-primary" : "text-foreground",
                                    )}
                                  >
                                    {track.title}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {track.artistName}
                                  </p>
                                </div>
                              </button>
                              <IconButton
                                aria-label={`${t.removeFromQueue}: ${track.title}`}
                                onClick={() => removeFromQueue(track.id)}
                                className="h-10 min-w-10"
                              >
                                <X className="h-4 w-4" />
                              </IconButton>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-lg bg-muted/40 px-3 py-5 text-sm text-muted-foreground">
                          {t.queueEmpty}
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t.recentlyPlayed}
                    </p>
                    {visibleRecentTracks.length ? (
                      <div className="space-y-1">
                        {visibleRecentTracks.map((track) => (
                          <button
                            key={`recent-${track.id}`}
                            type="button"
                            onClick={() => playTrack(track)}
                            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                          >
                            <TrackArtwork track={track} className="h-10 w-10" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {track.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {track.artistName}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted/40 px-3 py-5 text-sm text-muted-foreground">
                        {t.emptyRecent}
                      </p>
                    )}
                  </section>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-card px-3 py-2 md:hidden" data-testid="mini-player-mobile">
        <div className="flex min-h-16 items-center gap-2">
          <Link
            href={currentTrack ? `/track/${currentTrack.slug}` : "#"}
            tabIndex={hasTrack ? 0 : -1}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <TrackArtwork track={currentTrack} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {currentTrack?.title ?? t.selectTrack}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentTrack?.artistName ?? t.waveStream}
              </p>
            </div>
          </Link>
          <IconButton
            onClick={togglePlay}
            aria-label={isPlaying ? tCommon.pause : tCommon.play}
            disabled={!hasTrack}
            className="h-11 min-w-11 bg-primary text-primary-foreground hover:text-primary-foreground"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </IconButton>
          <IconButton onClick={nextTrack} aria-label={t.nextTrack} disabled={!hasTrack}>
            <SkipForward className="h-4 w-4" />
          </IconButton>
          <IconButton
            {...queueToggleProps}
            data-testid="mini-player-queue-toggle"
            className={cn(queueOpen && "text-primary")}
          >
            <ListMusic className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="hidden border-t border-border bg-card px-3 py-2 md:block">
        <div className="mx-auto grid max-w-[1600px] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(180px,0.6fr)]">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={currentTrack ? `/track/${currentTrack.slug}` : "#"}
              tabIndex={hasTrack ? 0 : -1}
              className="group flex min-w-0 flex-1 items-center gap-2.5"
            >
              <TrackArtwork track={currentTrack} className="h-12 w-12" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {currentTrack?.title ?? t.selectTrack}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentTrack?.artistName ?? t.waveStream}
                </p>
              </div>
            </Link>
            {hasTrack && (
              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  onClick={handleLike}
                  aria-label={liked ? t.unlikeTrack : t.likeTrack}
                  className={cn("h-9 min-w-9", liked && "text-primary")}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                </IconButton>
                <IconButton
                  onClick={handleRepost}
                  aria-label={reposted ? t.removeRepost : t.repostTrack}
                  className={cn("h-9 min-w-9", reposted && "text-primary")}
                >
                  <RepostIcon className="h-4 w-4" />
                </IconButton>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-3" aria-label={t.playbackControls}>
              <IconButton
                onClick={toggleShuffle}
                aria-label={t.toggleShuffle}
                disabled={!hasTrack}
                className={cn("h-9 min-w-9", shuffle && "text-primary")}
              >
                <Shuffle className="h-4 w-4" />
              </IconButton>
              <IconButton
                onClick={previousTrack}
                aria-label={t.previousTrack}
                disabled={!hasTrack}
                className="h-9 min-w-9"
              >
                <SkipBack className="h-4 w-4" />
              </IconButton>
              <IconButton
                onClick={togglePlay}
                aria-label={isPlaying ? tCommon.pause : tCommon.play}
                disabled={!hasTrack}
                className={cn(
                  "h-9 min-w-9",
                  hasTrack
                    ? "bg-primary text-primary-foreground hover:scale-105 hover:text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </IconButton>
              <IconButton
                onClick={nextTrack}
                aria-label={t.nextTrack}
                disabled={!hasTrack}
                className="h-9 min-w-9"
              >
                <SkipForward className="h-4 w-4" />
              </IconButton>
              <IconButton
                onClick={cycleRepeat}
                aria-label={t.cycleRepeat}
                disabled={!hasTrack}
                className={cn("h-9 min-w-9", repeat !== "off" && "text-primary")}
              >
                {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </IconButton>
              <button
                type="button"
                onClick={cyclePlaybackRate}
                aria-label={t.cyclePlaybackRate}
                disabled={!hasTrack}
                className={cn(
                  "h-9 min-w-[2.8rem] rounded-full px-2 text-[11px] font-semibold transition-colors disabled:opacity-30",
                  playbackRate !== 1
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {playbackRateLabel}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-9 text-right text-[10px] tabular-nums text-muted-foreground">
                {formatTime(hasTrack ? progress : 0)}
              </span>
              <WaveformBar
                progress={progressPercent}
                duration={duration}
                onSeek={setProgress}
                disabled={!hasTrack}
                seed={currentTrack?.slug ?? "default"}
                ariaLabel={t.waveformSeek}
                className="h-8 flex-1"
              />
              <span className="w-9 text-[10px] tabular-nums text-muted-foreground">
                {formatTime(hasTrack ? duration : 0)}
              </span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-2 lg:flex">
            {statusLabel && (
              <span className="shrink-0 text-[10px] text-muted-foreground">{statusLabel}</span>
            )}
            {activeQueueIndex >= 0 && queue.length > 0 && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {activeQueueIndex + 1}/{queue.length}
              </span>
            )}
            <IconButton
              {...queueToggleProps}
              data-testid="mini-player-queue-toggle"
              className={cn("h-9 min-w-9", queueOpen && "text-primary")}
            >
              <ListMusic className="h-4 w-4" />
            </IconButton>
            <IconButton
              onClick={toggleMute}
              aria-label={t.toggleMute}
              disabled={!hasTrack}
              className="h-9 min-w-9"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </IconButton>
            <div className="w-20">
              <Slider
                value={[muted ? 0 : Math.round(volume * 100)]}
                max={100}
                step={1}
                onValueChange={(values) => setVolume((values[0] ?? 0) / 100)}
                disabled={!hasTrack}
                aria-label={t.volumeControl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
