"use client";

import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/player-store";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const error = usePlayerStore((state) => state.error);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const previousTrack = usePlayerStore((state) => state.previousTrack);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const setRepeat = usePlayerStore((state) => state.setRepeat);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const hasTrack = Boolean(currentTrack);
  const statusLabel = error
    ? "Playback issue"
    : isBuffering
      ? "Buffering"
      : currentTrack?.genreLabel ?? "";

  return (
    <div className="border-t border-[#282828] bg-black px-4 py-2">
      <div className="mx-auto grid max-w-[1600px] items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(200px,0.7fr)]">
        {/* Track info */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-14 w-14 shrink-0 rounded-md",
              hasTrack ? "bg-[#282828]" : "bg-[#282828]",
            )}
            style={
              hasTrack && currentTrack?.coverUrl
                ? {
                    backgroundImage: `url(${currentTrack.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {currentTrack?.title ?? "Select a track"}
            </p>
            <p className="truncate text-xs text-[#b3b3b3]">
              {currentTrack?.artistName ?? "WaveStream"}
            </p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              disabled={!hasTrack}
              className={cn(
                "rounded-full p-1.5 transition-colors disabled:opacity-40",
                shuffle
                  ? "text-[#1ed760]"
                  : "text-[#b3b3b3] hover:text-white",
              )}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={previousTrack}
              aria-label="Previous track"
              disabled={!hasTrack}
              className="rounded-full p-1.5 text-[#b3b3b3] transition-colors hover:text-white disabled:opacity-40"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause track" : "Play track"}
              disabled={!hasTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:opacity-40"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              aria-label="Next track"
              disabled={!hasTrack}
              className="rounded-full p-1.5 text-[#b3b3b3] transition-colors hover:text-white disabled:opacity-40"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
              aria-label="Cycle repeat mode"
              disabled={!hasTrack}
              className={cn(
                "relative rounded-full p-1.5 transition-colors disabled:opacity-40",
                repeat !== "off"
                  ? "text-[#1ed760]"
                  : "text-[#b3b3b3] hover:text-white",
              )}
            >
              <Repeat className="h-4 w-4" />
              {repeat === "one" && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#1ed760] text-[6px] font-bold text-black">
                  1
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-xs text-[#b3b3b3]">
              {formatTime(hasTrack ? progress : 0)}
            </span>
            <Slider
              value={[hasTrack ? progress : 0]}
              max={duration || 1}
              step={1}
              onValueChange={(values) => setProgress(values[0] ?? 0)}
              disabled={!hasTrack}
            />
            <span className="w-10 text-xs text-[#b3b3b3]">
              {formatTime(hasTrack ? duration : 0)}
            </span>
          </div>
        </div>

        {/* Volume & extras */}
        <div className="hidden items-center justify-end gap-3 lg:flex">
          {statusLabel && (
            <Badge variant="outline" className="text-[10px]">
              {statusLabel}
            </Badge>
          )}
          <Select
            value={String(playbackRate)}
            onValueChange={(value) => setPlaybackRate(Number(value))}
            disabled={!hasTrack}
          >
            <SelectTrigger className="h-7 w-16 rounded-md bg-transparent px-2 text-xs shadow-none">
              <SelectValue placeholder="1x" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={toggleMute}
            aria-label="Mute"
            disabled={!hasTrack}
            className="rounded-full p-1 text-[#b3b3b3] transition-colors hover:text-white disabled:opacity-40"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="w-24">
            <Slider
              value={[muted ? 0 : Math.round(volume * 100)]}
              max={100}
              step={1}
              onValueChange={(values) => setVolume((values[0] ?? 0) / 100)}
              disabled={!hasTrack}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
