import { create } from "zustand";

import type { TrackCard } from "@/lib/wavestream-api";

export type RepeatMode = "off" | "one" | "all";

export type PlayerTrack = TrackCard;

type PlayerState = {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
  volume: number;
  muted: boolean;
  playbackRate: number;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: number;
  duration: number;
  seekTarget: number | null;
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
  syncProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setBuffering: (isBuffering: boolean) => void;
  setError: (error: string | null) => void;
  clearSeekTarget: () => void;
  handleTrackEnded: () => void;
};

const clampSeconds = (value: number, max?: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  if (max !== undefined && Number.isFinite(max) && max >= 0) {
    return Math.min(value, max);
  }

  return value;
};

const getTrackDuration = (track: PlayerTrack | null | undefined) =>
  clampSeconds(track?.durationSeconds ?? 0);

const getQueueIndex = (queue: PlayerTrack[], track: PlayerTrack | null) => {
  if (!track) {
    return -1;
  }

  return queue.findIndex((candidate) => candidate.id === track.id);
};

const getRandomQueueIndex = (queue: PlayerTrack[], currentIndex: number) => {
  if (queue.length <= 1) {
    return Math.max(currentIndex, 0);
  }

  const candidates = queue
    .map((_, index) => index)
    .filter((index) => index !== currentIndex);
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] ?? Math.max(currentIndex, 0);
};

const getNextQueueIndex = (
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
  shuffle: boolean,
) => {
  if (!queue.length) {
    return -1;
  }

  const currentIndex = getQueueIndex(queue, currentTrack);
  if (shuffle) {
    return getRandomQueueIndex(queue, currentIndex >= 0 ? currentIndex : 0);
  }

  return currentIndex >= 0 ? currentIndex + 1 : 0;
};

const getPreviousQueueIndex = (
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
  shuffle: boolean,
) => {
  if (!queue.length) {
    return -1;
  }

  const currentIndex = getQueueIndex(queue, currentTrack);
  if (shuffle) {
    return getRandomQueueIndex(queue, currentIndex >= 0 ? currentIndex : 0);
  }

  if (currentIndex > 0) {
    return currentIndex - 1;
  }

  return queue.length - 1;
};

const basePlayerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isBuffering: false,
  error: null,
  volume: 0.8,
  muted: false,
  playbackRate: 1,
  shuffle: false,
  repeat: "off" as RepeatMode,
  progress: 0,
  duration: 0,
  seekTarget: null,
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...basePlayerState,
  setQueue: (queue) =>
    set((state) => {
      if (!queue.length) {
        return { ...basePlayerState };
      }

      const retainedTrack =
        state.currentTrack &&
        queue.find((candidate) => candidate.id === state.currentTrack?.id);
      const nextTrack = retainedTrack ?? queue[0];
      const switchedTracks = nextTrack.id !== state.currentTrack?.id;

      return {
        queue,
        currentTrack: nextTrack,
        progress: switchedTracks ? 0 : clampSeconds(state.progress, state.duration),
        duration: switchedTracks ? getTrackDuration(nextTrack) : state.duration,
        error: null,
        isBuffering: false,
        seekTarget: switchedTracks ? 0 : state.seekTarget,
      };
    }),
  playTrack: (track) =>
    set((state) => {
      const queue = state.queue.some((candidate) => candidate.id === track.id)
        ? state.queue
        : [track, ...state.queue.filter((candidate) => candidate.id !== track.id)];
      const isSameTrack = state.currentTrack?.id === track.id;

      return {
        queue,
        currentTrack: track,
        isPlaying: true,
        isBuffering: true,
        error: null,
        progress: isSameTrack ? state.progress : 0,
        duration: isSameTrack ? state.duration : getTrackDuration(track),
        seekTarget: isSameTrack ? state.seekTarget : 0,
      };
    }),
  togglePlay: () =>
    set((state) =>
      state.currentTrack
        ? {
            isPlaying: !state.isPlaying,
            error: state.isPlaying ? state.error : null,
          }
        : {},
    ),
  nextTrack: () => {
    const { queue, currentTrack, shuffle } = get();
    const nextIndex = getNextQueueIndex(queue, currentTrack, shuffle);
    const nextTrack = nextIndex >= 0 ? queue[nextIndex] : null;

    if (!nextTrack) {
      return;
    }

    set({
      currentTrack: nextTrack,
      isPlaying: true,
      isBuffering: true,
      error: null,
      progress: 0,
      duration: getTrackDuration(nextTrack),
      seekTarget: 0,
    });
  },
  previousTrack: () => {
    const state = get();

    if (state.progress > 5 && state.currentTrack) {
      set({
        progress: 0,
        seekTarget: 0,
        error: null,
      });
      return;
    }

    const previousIndex = getPreviousQueueIndex(
      state.queue,
      state.currentTrack,
      state.shuffle,
    );
    const previousTrack = previousIndex >= 0 ? state.queue[previousIndex] : null;

    if (!previousTrack) {
      return;
    }

    set({
      currentTrack: previousTrack,
      isPlaying: true,
      isBuffering: true,
      error: null,
      progress: 0,
      duration: getTrackDuration(previousTrack),
      seekTarget: 0,
    });
  },
  setVolume: (volume) =>
    set({
      volume: Math.min(Math.max(volume, 0), 1),
      muted: volume <= 0 ? true : get().muted,
    }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setPlaybackRate: (playbackRate) =>
    set({
      playbackRate: Math.min(Math.max(playbackRate, 0.5), 2),
    }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  setRepeat: (repeat) => set({ repeat }),
  setProgress: (progress) =>
    set((state) => {
      const nextProgress = clampSeconds(progress, state.duration);
      return {
        progress: nextProgress,
        seekTarget: nextProgress,
      };
    }),
  syncProgress: (progress) =>
    set((state) => ({
      progress: clampSeconds(progress, state.duration || undefined),
    })),
  setDuration: (duration) =>
    set((state) => ({
      duration: clampSeconds(duration),
      progress: clampSeconds(state.progress, duration),
    })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setBuffering: (isBuffering) => set({ isBuffering }),
  setError: (error) =>
    set({
      error,
      isPlaying: error ? false : get().isPlaying,
      isBuffering: false,
    }),
  clearSeekTarget: () => set({ seekTarget: null }),
  handleTrackEnded: () => {
    const state = get();

    if (!state.currentTrack) {
      return;
    }

    if (state.repeat === "one") {
      set({
        isPlaying: true,
        isBuffering: true,
        error: null,
        progress: 0,
        seekTarget: 0,
      });
      return;
    }

    const nextIndex = getNextQueueIndex(state.queue, state.currentTrack, state.shuffle);
    const reachedEnd =
      !state.shuffle &&
      getQueueIndex(state.queue, state.currentTrack) === state.queue.length - 1;

    if (nextIndex < 0 || (!state.shuffle && reachedEnd && state.repeat === "off")) {
      set({
        isPlaying: false,
        isBuffering: false,
        progress: state.duration,
        seekTarget: null,
      });
      return;
    }

    const wrappedIndex =
      nextIndex >= state.queue.length && state.repeat === "all" ? 0 : nextIndex;
    const nextTrack =
      wrappedIndex >= 0 && wrappedIndex < state.queue.length
        ? state.queue[wrappedIndex]
        : null;

    if (!nextTrack) {
      set({
        isPlaying: false,
        isBuffering: false,
        progress: state.duration,
        seekTarget: null,
      });
      return;
    }

    set({
      currentTrack: nextTrack,
      isPlaying: true,
      isBuffering: true,
      error: null,
      progress: 0,
      duration: getTrackDuration(nextTrack),
      seekTarget: 0,
    });
  },
}));
