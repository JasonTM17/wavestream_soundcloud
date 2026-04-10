import { create } from "zustand";

import { demoQueue, type TrackPreview } from "@/lib/mock-data";

export type RepeatMode = "off" | "one" | "all";

export type PlayerTrack = TrackPreview;

type PlayerState = {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: number;
  duration: number;
  setQueue: (queue: PlayerTrack[]) => void;
  playTrack: (track: PlayerTrack) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setProgress: (progress: number) => void;
};

const DEFAULT_TRACK = demoQueue[0] ?? null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: DEFAULT_TRACK,
  queue: demoQueue,
  isPlaying: false,
  volume: 0.8,
  muted: false,
  playbackRate: 1,
  shuffle: false,
  repeat: "off",
  progress: 18,
  duration: 218,
  setQueue: (queue) => set({ queue, currentTrack: queue[0] ?? null }),
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!queue.length) return;
    const currentIndex = currentTrack
      ? queue.findIndex((track) => track.id === currentTrack.id)
      : -1;
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % queue.length : 0;
    set({ currentTrack: queue[nextIndex], isPlaying: true, progress: 0 });
  },
  previousTrack: () => {
    const { queue, currentTrack } = get();
    if (!queue.length) return;
    const currentIndex = currentTrack
      ? queue.findIndex((track) => track.id === currentTrack.id)
      : -1;
    const previousIndex =
      currentIndex > 0 ? currentIndex - 1 : Math.max(queue.length - 1, 0);
    set({ currentTrack: queue[previousIndex], isPlaying: true, progress: 0 });
  },
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set({ muted: !get().muted }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  toggleShuffle: () => set({ shuffle: !get().shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setProgress: (progress) => set({ progress }),
}));
