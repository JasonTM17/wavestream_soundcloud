import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TrackCard } from "@/lib/wavestream-api";

export type RepeatMode = "off" | "one" | "all";

export type PlayerTrack = TrackCard;

type PlayerState = {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  recentTracks: PlayerTrack[];
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
  clearQueue: () => void;
  removeFromQueue: (trackId: string) => void;
  playQueueIndex: (index: number) => void;
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
  recentTracks: [],
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

const createBasePlayerState = () => ({
  ...basePlayerState,
});

const pushRecentTrack = (recentTracks: PlayerTrack[], track: PlayerTrack) => {
  const nextRecentTracks = [
    track,
    ...recentTracks.filter((candidate) => candidate.id !== track.id),
  ];

  return nextRecentTracks.slice(0, 8);
};

const dedupeTracks = (tracks: PlayerTrack[]) => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.id)) {
      return false;
    }
    seen.add(track.id);
    return true;
  });
};

const resetPlaybackSurface = (state: PlayerState) => ({
  ...createBasePlayerState(),
  recentTracks: state.recentTracks,
  volume: state.volume,
  muted: state.muted,
  playbackRate: state.playbackRate,
  shuffle: state.shuffle,
  repeat: state.repeat,
});

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...createBasePlayerState(),
      setQueue: (queue) =>
        set((state) => {
          const nextQueue = dedupeTracks(queue);

          if (!nextQueue.length) {
            return resetPlaybackSurface(state);
          }

          const retainedTrack =
            state.currentTrack &&
            nextQueue.find((candidate) => candidate.id === state.currentTrack?.id);
          const nextTrack = retainedTrack ?? nextQueue[0];
          const switchedTracks = nextTrack.id !== state.currentTrack?.id;

          return {
            queue: nextQueue,
            currentTrack: nextTrack,
            recentTracks: state.recentTracks,
            progress: switchedTracks ? 0 : clampSeconds(state.progress, state.duration),
            duration: switchedTracks ? getTrackDuration(nextTrack) : state.duration,
            error: null,
            isBuffering: false,
            seekTarget: switchedTracks ? 0 : state.seekTarget,
            isPlaying: switchedTracks ? false : state.isPlaying,
          };
        }),
      clearQueue: () =>
        set((state) => ({
          ...resetPlaybackSurface(state),
          recentTracks: state.recentTracks,
        })),
      removeFromQueue: (trackId) =>
        set((state) => {
          const currentIndex = getQueueIndex(state.queue, state.currentTrack);
          const nextQueue = state.queue.filter((track) => track.id !== trackId);

          if (!nextQueue.length) {
            return resetPlaybackSurface(state);
          }

          if (state.currentTrack?.id !== trackId) {
            return { queue: nextQueue };
          }

          const nextTrack = nextQueue[currentIndex] ?? null;

          if (!nextTrack) {
            return {
              queue: nextQueue,
              currentTrack: null,
              isPlaying: false,
              isBuffering: false,
              error: null,
              progress: 0,
              duration: 0,
              seekTarget: null,
            };
          }

          return {
            queue: nextQueue,
            currentTrack: nextTrack,
            recentTracks: pushRecentTrack(state.recentTracks, nextTrack),
            isPlaying: state.isPlaying,
            isBuffering: state.isPlaying,
            error: null,
            progress: 0,
            duration: getTrackDuration(nextTrack),
            seekTarget: 0,
          };
        }),
      playQueueIndex: (index) => {
        const { queue } = get();
        const nextTrack = Number.isInteger(index) ? queue[index] : null;

        if (!nextTrack) {
          return;
        }

        get().playTrack(nextTrack);
      },
      playTrack: (track) =>
        set((state) => {
          const queue = dedupeTracks(
            state.queue.some((candidate) => candidate.id === track.id)
              ? state.queue
              : [track, ...state.queue],
          );
          const isSameTrack = state.currentTrack?.id === track.id;

          return {
            queue,
            currentTrack: track,
            recentTracks: isSameTrack
              ? state.recentTracks
              : pushRecentTrack(state.recentTracks, track),
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
          recentTracks: pushRecentTrack(get().recentTracks, nextTrack),
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
          recentTracks: pushRecentTrack(state.recentTracks, previousTrack),
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
          recentTracks: pushRecentTrack(state.recentTracks, nextTrack),
          isPlaying: true,
          isBuffering: true,
          error: null,
          progress: 0,
          duration: getTrackDuration(nextTrack),
          seekTarget: 0,
        });
      },
    }),
    {
      name: "wavestream-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        recentTracks: state.recentTracks,
        volume: state.volume,
        muted: state.muted,
        playbackRate: state.playbackRate,
        shuffle: state.shuffle,
        repeat: state.repeat,
        progress: state.progress,
        duration: state.duration,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<PlayerState>),
        queue: dedupeTracks((persistedState as Partial<PlayerState>)?.queue ?? []),
        recentTracks: dedupeTracks(
          (persistedState as Partial<PlayerState>)?.recentTracks ?? [],
        ),
        isPlaying: false,
        isBuffering: false,
        error: null,
        seekTarget: null,
      }),
    },
  ),
);
