import { TrackPrivacy, TrackStatus } from "@wavestream/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaylistSummary, TrackSummary } from "./wavestream-api";

type ApiModule = typeof import("./wavestream-api");

let apiModule: ApiModule;

const makeTrack = (overrides: Partial<TrackSummary> = {}): TrackSummary =>
  ({
    id: "track-1",
    slug: "midnight-drive",
    title: "Midnight Drive",
    description: "Late night synth pulse",
    coverUrl: null,
    duration: 245,
    playCount: 1842,
    likeCount: 120,
    repostCount: 16,
    commentCount: 9,
    artist: {
      id: "artist-1",
      username: "luna",
      displayName: "Luna Echo",
      role: "creator",
    },
    genre: {
      id: "genre-1",
      name: "Synthwave",
      slug: "synthwave",
    },
    file: {
      id: "file-1",
      streamUrl: "/api/tracks/track-1/stream",
    },
    tags: [{ id: "tag-1", name: "night", slug: "night" }],
    ...overrides,
  }) as TrackSummary;

const makePlaylist = (
  overrides: Partial<PlaylistSummary> = {},
): PlaylistSummary =>
  ({
    id: "playlist-1",
    slug: "night-sets",
    title: "Night Sets",
    description: "Late hour selections",
    isPublic: true,
    trackCount: 2,
    totalDuration: 620,
    owner: {
      id: "artist-1",
      username: "luna",
      displayName: "Luna Echo",
      role: "creator",
    },
    tracks: [{ id: "entry-1", position: 1, track: makeTrack(), addedAt: "2026-04-10T00:00:00.000Z" }],
    ...overrides,
  }) as PlaylistSummary;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.wavestream.test");
  apiModule = await import("./wavestream-api");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("wavestream api helpers", () => {
  it("maps track and playlist summaries into card-friendly structures", () => {
    const track = apiModule.toTrackCard(makeTrack({ coverUrl: "/covers/midnight.jpg" }));
    const playlist = apiModule.toPlaylistCard(
      makePlaylist({
        coverUrl: null,
        tracks: [{ id: "entry-1", position: 1, track: makeTrack({ coverUrl: "/covers/midnight.jpg" }), addedAt: "2026-04-10T00:00:00.000Z" }],
      }),
    );

    expect(track.durationLabel).toBe("4:05");
    expect(track.playsLabel).toBe("1.8K");
    expect(track.artistHandle).toBe("@luna");
    expect(track.tags).toEqual(["night"]);
    expect(track.streamUrl).toBe("/api/tracks/track-1/stream");

    expect(playlist.coverUrl).toBe("/covers/midnight.jpg");
    expect(playlist.totalDurationLabel).toBe("10:20");
    expect(playlist.trackCount).toBe(2);
    expect(playlist.tracks).toHaveLength(1);
  });

  it("falls back to track and playlist listings when discovery is unavailable", async () => {
    const tracks = [
      makeTrack({ id: "track-1", slug: "midnight-drive" }),
      makeTrack({
        id: "track-2",
        slug: "afterglow",
        title: "Afterglow",
        playCount: 956,
        artist: {
          id: "artist-1",
          username: "luna",
          displayName: "Luna Echo",
          role: "creator",
        },
      }),
    ];
    const playlists = [
      makePlaylist({
        id: "playlist-2",
        slug: "night-sets",
        title: "Night Sets",
        owner: {
          id: "artist-1",
          username: "luna",
          displayName: "Luna Echo",
          role: "creator",
        },
      }),
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.endsWith("/api/discovery/home")) {
        return new Response(JSON.stringify({ message: "Not ready" }), {
          status: 503,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/tracks?limit=12")) {
        return new Response(JSON.stringify(tracks), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists?limit=6")) {
        return new Response(JSON.stringify(playlists), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    const discovery = await apiModule.getDiscoveryResults();

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(discovery.trendingTracks).toHaveLength(2);
    expect(discovery.newReleases).toHaveLength(2);
    expect(discovery.featuredPlaylists).toHaveLength(1);
    expect(discovery.featuredArtists).toHaveLength(1);
    expect(discovery.featuredArtists[0]?.username).toBe("luna");
  });

  it("builds multipart track upload form data with optional fields and repeated tags", () => {
    const formData = apiModule.buildCreateTrackFormData({
      audioFile: new File(["audio"], "midnight-static.wav", { type: "audio/wav" }),
      coverImage: new File(["cover"], "midnight-static.png", { type: "image/png" }),
      title: "Midnight Static",
      description: "Late night synth pulse",
      genre: "Electronic",
      tags: ["night", " synth ", ""],
      privacy: TrackPrivacy.UNLISTED,
      status: TrackStatus.DRAFT,
      allowDownloads: false,
      commentsEnabled: true,
    });

    expect(formData.get("title")).toBe("Midnight Static");
    expect(formData.get("description")).toBe("Late night synth pulse");
    expect(formData.get("genre")).toBe("Electronic");
    expect(formData.getAll("tags")).toEqual(["night", "synth"]);
    expect(formData.get("privacy")).toBe(TrackPrivacy.UNLISTED);
    expect(formData.get("status")).toBe(TrackStatus.DRAFT);
    expect(formData.get("allowDownloads")).toBe("false");
    expect(formData.get("commentsEnabled")).toBe("true");
    expect(formData.get("audioFile")).toBeInstanceOf(File);
    expect(formData.get("coverImage")).toBeInstanceOf(File);
  });

  it("builds partial update payloads without leaking undefined fields", () => {
    const payload = apiModule.buildUpdateTrackPayload({
      title: "Afterglow",
      description: null,
      tags: ["late-night", "demo"],
      allowDownloads: true,
      commentsEnabled: false,
      privacy: TrackPrivacy.PRIVATE,
    });

    expect(payload).toEqual({
      title: "Afterglow",
      description: null,
      tags: ["late-night", "demo"],
      allowDownloads: true,
      commentsEnabled: false,
      privacy: TrackPrivacy.PRIVATE,
    });
    expect("genre" in payload).toBe(false);
    expect("status" in payload).toBe(false);
  });
});
