import { afterEach, describe, expect, it, vi } from "vitest";

import { usePlayerStore } from "./player-store";

const queue = [
  {
    id: "track-1",
    slug: "midnight-drive",
    title: "Midnight Drive",
    description: "Late night synth pulse",
    coverUrl: null,
    durationLabel: "4:05",
    playsLabel: "1.8K",
    artistName: "Luna Echo",
    artistHandle: "@luna",
    artist: {
      id: "artist-1",
      username: "luna",
      displayName: "Luna Echo",
      role: "creator" as const,
    },
    genreLabel: "Synthwave",
    streamUrl: "/api/tracks/track-1/stream",
    downloadUrl: null,
    likeCount: 120,
    repostCount: 16,
    commentCount: 9,
    isLiked: false,
    isReposted: false,
    isFollowingArtist: false,
    tags: ["night"],
  },
  {
    id: "track-2",
    slug: "afterglow",
    title: "Afterglow",
    description: "Neon after hours",
    coverUrl: null,
    durationLabel: "3:12",
    playsLabel: "956",
    artistName: "Mira Pulse",
    artistHandle: "@mira",
    artist: {
      id: "artist-2",
      username: "mira",
      displayName: "Mira Pulse",
      role: "creator" as const,
    },
    genreLabel: "Ambient",
    streamUrl: "/api/tracks/track-2/stream",
    downloadUrl: null,
    likeCount: 87,
    repostCount: 9,
    commentCount: 4,
    isLiked: false,
    isReposted: false,
    isFollowingArtist: false,
    tags: ["dawn"],
  },
];

const resetPlayerState = () =>
  usePlayerStore.setState({
    currentTrack: null,
    queue: [],
    recentTracks: [],
    isPlaying: false,
    volume: 0.8,
    muted: false,
    playbackRate: 1,
    shuffle: false,
    repeat: "off",
    progress: 18,
    duration: 218,
    isBuffering: false,
    error: null,
    seekTarget: null,
  });

afterEach(() => {
  resetPlayerState();
  usePlayerStore.persist.clearStorage();
});

describe("player store", () => {
  it("loads a queue and advances through tracks with wraparound", () => {
    const store = usePlayerStore.getState();
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    store.setQueue(queueWithDuration);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
    expect(usePlayerStore.getState().progress).toBe(0);

    store.nextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().progress).toBe(0);

    store.nextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");

    store.previousTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
  });

  it("deduplicates queue entries and can play a queue index directly", () => {
    const queueWithDuplicate = [
      { ...queue[0], durationSeconds: 245 },
      { ...queue[0], durationSeconds: 245 },
      { ...queue[1], durationSeconds: 192 },
    ];

    usePlayerStore.getState().setQueue(queueWithDuplicate);
    expect(usePlayerStore.getState().queue.map((track) => track.id)).toEqual([
      "track-1",
      "track-2",
    ]);

    usePlayerStore.getState().playQueueIndex(1);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().recentTracks.map((track) => track.id)).toEqual(["track-2"]);

    usePlayerStore.getState().playQueueIndex(99);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
  });

  it("clears queue while preserving recents and playback preferences", () => {
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    usePlayerStore.getState().setQueue(queueWithDuration);
    usePlayerStore.getState().playTrack(queueWithDuration[1]);
    usePlayerStore.getState().setVolume(0.45);
    usePlayerStore.getState().setPlaybackRate(1.25);
    usePlayerStore.getState().setRepeat("all");
    usePlayerStore.getState().clearQueue();

    expect(usePlayerStore.getState().currentTrack).toBeNull();
    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().recentTracks.map((track) => track.id)).toEqual(["track-2"]);
    expect(usePlayerStore.getState().volume).toBe(0.45);
    expect(usePlayerStore.getState().playbackRate).toBe(1.25);
    expect(usePlayerStore.getState().repeat).toBe("all");
  });

  it("removes queue tracks and advances from the current track when possible", () => {
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    usePlayerStore.getState().setQueue(queueWithDuration);
    usePlayerStore.getState().playTrack(queueWithDuration[0]);
    usePlayerStore.getState().removeFromQueue("track-1");

    expect(usePlayerStore.getState().queue.map((track) => track.id)).toEqual(["track-2"]);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().progress).toBe(0);

    usePlayerStore.getState().removeFromQueue("track-2");
    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().currentTrack).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it("stops playback but keeps remaining queue when removing the current last track", () => {
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    usePlayerStore.getState().setQueue(queueWithDuration);
    usePlayerStore.getState().playTrack(queueWithDuration[1]);
    usePlayerStore.getState().removeFromQueue("track-2");

    expect(usePlayerStore.getState().queue.map((track) => track.id)).toEqual(["track-1"]);
    expect(usePlayerStore.getState().currentTrack).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().duration).toBe(0);
  });

  it("tracks seek targets, buffering, and repeated playback states", () => {
    const store = usePlayerStore.getState();
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    store.setQueue(queueWithDuration);
    store.setProgress(63);
    expect(usePlayerStore.getState().progress).toBe(63);
    expect(usePlayerStore.getState().seekTarget).toBe(63);

    store.setDuration(42);
    expect(usePlayerStore.getState().duration).toBe(42);
    expect(usePlayerStore.getState().progress).toBe(42);

    store.setBuffering(true);
    expect(usePlayerStore.getState().isBuffering).toBe(true);

    store.setError("Playback was blocked");
    expect(usePlayerStore.getState().error).toBe("Playback was blocked");
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().isBuffering).toBe(false);

    store.setRepeat("one");
    store.handleTrackEnded();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().isBuffering).toBe(true);
    expect(usePlayerStore.getState().progress).toBe(0);
    expect(usePlayerStore.getState().seekTarget).toBe(0);

    store.setRepeat("all");
    store.nextTrack();
    store.handleTrackEnded();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
    expect(usePlayerStore.getState().progress).toBe(0);
    expect(usePlayerStore.getState().seekTarget).toBe(0);
  });

  it("chooses a different track when shuffle is enabled", () => {
    const store = usePlayerStore.getState();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    store.setQueue([
      { ...queue[0], durationSeconds: 245 },
      { ...queue[1], durationSeconds: 192 },
    ]);
    store.toggleShuffle();
    store.nextTrack();

    expect(usePlayerStore.getState().shuffle).toBe(true);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");

    randomSpy.mockRestore();
  });

  it("toggles playback controls and preserves the selected track", () => {
    const store = usePlayerStore.getState();
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    store.setQueue(queueWithDuration);
    store.playTrack(queueWithDuration[1]);
    store.togglePlay();
    store.setVolume(0.5);
    store.toggleMute();
    store.setPlaybackRate(1.25);
    store.toggleShuffle();
    store.setRepeat("all");
    store.setProgress(83);

    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().volume).toBe(0.5);
    expect(usePlayerStore.getState().muted).toBe(true);
    expect(usePlayerStore.getState().playbackRate).toBe(1.25);
    expect(usePlayerStore.getState().shuffle).toBe(true);
    expect(usePlayerStore.getState().repeat).toBe("all");
    expect(usePlayerStore.getState().progress).toBe(83);
  });

  it("persists queue, playback progress, and user controls without forcing autoplay", () => {
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    usePlayerStore.getState().setQueue(queueWithDuration);
    usePlayerStore.getState().playTrack(queueWithDuration[1]);
    usePlayerStore.getState().setVolume(0.35);
    usePlayerStore.getState().setPlaybackRate(1.25);
    usePlayerStore.getState().setRepeat("all");
    usePlayerStore.getState().syncProgress(71);

    const persistedRaw = localStorage.getItem("wavestream-player");
    expect(persistedRaw).toBeTruthy();

    const persisted = JSON.parse(String(persistedRaw)) as {
      state?: {
        currentTrack?: { id?: string };
        queue?: Array<{ id: string }>;
        recentTracks?: Array<{ id: string }>;
        volume?: number;
        playbackRate?: number;
        repeat?: string;
        progress?: number;
      };
    };

    expect(persisted.state?.currentTrack?.id).toBe("track-2");
    expect(persisted.state?.queue?.map((track) => track.id)).toEqual(["track-1", "track-2"]);
    expect(persisted.state?.recentTracks?.map((track) => track.id)).toEqual(["track-2"]);
    expect(persisted.state?.volume).toBe(0.35);
    expect(persisted.state?.playbackRate).toBe(1.25);
    expect(persisted.state?.repeat).toBe("all");
    expect(persisted.state?.progress).toBe(71);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("keeps a deduplicated recently played list when switching tracks", () => {
    const queueWithDuration = queue.map((track, index) => ({
      ...track,
      durationSeconds: index === 0 ? 245 : 192,
    }));

    usePlayerStore.getState().setQueue(queueWithDuration);
    usePlayerStore.getState().playTrack(queueWithDuration[0]);
    usePlayerStore.getState().playTrack(queueWithDuration[1]);
    usePlayerStore.getState().playTrack(queueWithDuration[0]);

    expect(usePlayerStore.getState().recentTracks.map((track) => track.id)).toEqual([
      "track-1",
      "track-2",
    ]);
  });
});
