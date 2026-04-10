"use client";

import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.4fr)_minmax(280px,0.85fr)] lg:px-6">
        <div className="flex items-center gap-3">
          <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br shadow-lg", currentTrack?.cover ?? "from-slate-700 to-slate-900")} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Now playing
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{currentTrack?.title ?? "Select a track"}</p>
              <Badge variant="soft">{currentTrack?.genre ?? "Queue ready"}</Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {currentTrack?.artist ?? "WaveStream demo queue"} · {queue.length} tracks
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleShuffle} aria-label="Toggle shuffle">
              <Shuffle className={cn("h-4 w-4", shuffle && "text-primary")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={previousTrack} aria-label="Previous track">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlay} aria-label={isPlaying ? "Pause track" : "Play track"}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={nextTrack} aria-label="Next track">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")} aria-label="Cycle repeat mode">
              <Repeat className={cn("h-4 w-4", repeat !== "off" && "text-primary")} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 text-right text-xs text-muted-foreground">
              {formatTime(progress)}
            </span>
            <Slider value={[progress]} max={duration} step={1} onValueChange={(values) => setProgress(values[0] ?? 0)} />
            <span className="w-12 text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleMute} aria-label="Mute">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-28">
              <Slider value={[muted ? 0 : Math.round(volume * 100)]} max={100} step={1} onValueChange={(values) => setVolume((values[0] ?? 0) / 100)} />
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 lg:block" />
          <Select value={String(playbackRate)} onValueChange={(value) => setPlaybackRate(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="1x" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
