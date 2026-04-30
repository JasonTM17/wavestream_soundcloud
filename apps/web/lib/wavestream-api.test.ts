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
    expect(track.streamUrl).toBe("/api/media/tracks/track-1/stream");

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
    expect(discovery.featuredArtists).toHaveLength(0);
  });

  it("normalizes discovery payloads from backend feed keys", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.endsWith("/api/discovery/home")) {
        return new Response(
          JSON.stringify({
            data: {
              trending: [makeTrack({ id: "track-3", slug: "coastal-static", title: "Coastal Static" })],
              recentUploads: [
                makeTrack({
                  id: "track-4",
                  slug: "sunset-loop",
                  title: "Sunset Loop",
                  artist: {
                    id: "artist-2",
                    username: "solis",
                    displayName: "Solis Kim",
                    role: "creator",
                  },
                }),
              ],
              popularPlaylists: [makePlaylist({ id: "playlist-3", slug: "sunset-cuts", title: "Sunset Cuts" })],
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    const discovery = await apiModule.getDiscoveryResults();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(discovery.trendingTracks).toHaveLength(1);
    expect(discovery.newReleases).toHaveLength(1);
    expect(discovery.featuredPlaylists).toHaveLength(1);
    expect(discovery.featuredArtists).toHaveLength(0);
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

  it("unwraps nested paginated data for public track and playlist listings", async () => {
    const tracks = [makeTrack({ id: "track-ambient", slug: "blue-hour-tide", title: "Blue Hour Tide" })];
    const playlists = [makePlaylist({ id: "playlist-public", slug: "ambient-cuts", title: "Ambient Cuts" })];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.endsWith("/api/tracks?genre=ambient&limit=5")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              data: tracks,
              meta: { page: 1, limit: 5, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      if (url.endsWith("/api/playlists?ownerId=artist-1&limit=6")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              data: playlists,
              meta: { page: 1, limit: 6, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(apiModule.getTracks({ genre: "ambient", limit: 5 })).resolves.toEqual(tracks);
    await expect(apiModule.getPlaylists({ ownerId: "artist-1", limit: 6 })).resolves.toEqual(
      playlists,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
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

  it("resolves media urls against the API base without altering absolute urls", () => {
    expect(apiModule.resolveMediaUrl("/uploads/tracks/midnight-static.mp3")).toBe(
      "https://api.wavestream.test/uploads/tracks/midnight-static.mp3",
    );
    expect(apiModule.resolveMediaUrl("uploads/tracks/midnight-static.mp3")).toBe(
      "https://api.wavestream.test/uploads/tracks/midnight-static.mp3",
    );
    expect(apiModule.resolveMediaUrl("https://cdn.wavestream.test/tracks/midnight-static.mp3")).toBe(
      "https://cdn.wavestream.test/tracks/midnight-static.mp3",
    );
    expect(apiModule.resolveMediaUrl(null)).toBeNull();
  });

  it("records track plays against the encoded play endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { playCount: 1843 } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await expect(
      apiModule.recordTrackPlay("midnight static", {
        durationListened: 31,
        source: "player",
      }),
    ).resolves.toEqual({ playCount: 1843 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.wavestream.test/api/tracks/midnight%20static/play");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({
      durationListened: 31,
      source: "player",
    });
  });

  it("builds playlist helpers against the expected endpoints and payloads", async () => {
    const basePlaylist = makePlaylist({
      id: "playlist-1",
      slug: "night-sets",
      title: "Night Sets",
      description: "Late hour selections",
      isPublic: true,
      tracks: [{ id: "entry-1", position: 1, track: makeTrack(), addedAt: "2026-04-10T00:00:00.000Z" }],
    });
    const updatedPlaylist = makePlaylist({
      ...basePlaylist,
      title: "Night Sets Revised",
      description: "Updated late hour selections",
      isPublic: false,
    });
    const playlistWithSecondTrack = makePlaylist({
      ...updatedPlaylist,
      trackCount: 2,
      totalDuration: 620,
      tracks: [
        { id: "entry-1", position: 1, track: makeTrack(), addedAt: "2026-04-10T00:00:00.000Z" },
        {
          id: "entry-2",
          position: 2,
          track: makeTrack({ id: "track-2", slug: "afterglow", title: "Afterglow" }),
          addedAt: "2026-04-10T00:30:00.000Z",
        },
      ],
    });
    const reorderedPlaylist = makePlaylist({
      ...playlistWithSecondTrack,
      tracks: [
        {
          id: "entry-2",
          position: 1,
          track: makeTrack({ id: "track-2", slug: "afterglow", title: "Afterglow" }),
          addedAt: "2026-04-10T00:30:00.000Z",
        },
        { id: "entry-1", position: 2, track: makeTrack(), addedAt: "2026-04-10T00:00:00.000Z" },
      ],
    });
    const playlistAfterRemoval = makePlaylist({
      ...playlistWithSecondTrack,
      trackCount: 1,
      totalDuration: 245,
      tracks: [
        {
          id: "entry-2",
          position: 1,
          track: makeTrack({ id: "track-2", slug: "afterglow", title: "Afterglow" }),
          addedAt: "2026-04-10T00:30:00.000Z",
        },
      ],
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const method = init?.method ?? "GET";

      if (url.endsWith("/api/playlists/me") && method === "GET") {
        return new Response(JSON.stringify({ data: [basePlaylist] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists") && method === "POST") {
        return new Response(JSON.stringify({ success: true, data: basePlaylist }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists/playlist-1") && method === "PATCH") {
        return new Response(JSON.stringify({ success: true, data: updatedPlaylist }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists/playlist-1/tracks") && method === "POST") {
        return new Response(JSON.stringify({ success: true, data: playlistWithSecondTrack }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists/playlist-1/tracks/track-1") && method === "DELETE") {
        return new Response(JSON.stringify({ success: true, data: playlistAfterRemoval }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists/playlist-1/tracks/reorder") && method === "PATCH") {
        return new Response(JSON.stringify({ success: true, data: reorderedPlaylist }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      if (url.endsWith("/api/playlists/playlist-1") && method === "DELETE") {
        return new Response(JSON.stringify({ success: true, data: { deleted: true } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    await expect(apiModule.getMyPlaylists()).resolves.toEqual([basePlaylist]);
    await expect(
      apiModule.createPlaylist({
        title: "Night Sets",
        description: "Late hour selections",
        isPublic: true,
      }),
    ).resolves.toEqual(basePlaylist);
    await expect(
      apiModule.updatePlaylist("playlist-1", {
        title: "Night Sets Revised",
        description: "Updated late hour selections",
        isPublic: false,
      }),
    ).resolves.toEqual(updatedPlaylist);
    await expect(
      apiModule.addTrackToPlaylist("playlist-1", { trackId: "track-2" }),
    ).resolves.toEqual(playlistWithSecondTrack);
    await expect(apiModule.removeTrackFromPlaylist("playlist-1", "track-1")).resolves.toEqual(
      playlistAfterRemoval,
    );
    await expect(
      apiModule.reorderPlaylistTracks("playlist-1", {
        trackIds: ["track-2", "track-1"],
      }),
    ).resolves.toEqual(reorderedPlaylist);
    await expect(apiModule.deletePlaylist("playlist-1")).resolves.toEqual({ deleted: true });

    expect(fetchSpy).toHaveBeenCalledTimes(7);

    const [listCall, createCall, updateCall, addCall, removeCall, reorderCall, deleteCall] =
      fetchSpy.mock.calls;

    expect(listCall[0]).toBe("https://api.wavestream.test/api/playlists/me");
    expect(new Headers(listCall[1]?.headers).get("authorization")).toBeNull();

    expect(createCall[0]).toBe("https://api.wavestream.test/api/playlists");
    expect(createCall[1]?.method).toBe("POST");
    expect(JSON.parse(String(createCall[1]?.body))).toEqual({
      title: "Night Sets",
      description: "Late hour selections",
      isPublic: true,
    });

    expect(updateCall[0]).toBe("https://api.wavestream.test/api/playlists/playlist-1");
    expect(updateCall[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(updateCall[1]?.body))).toEqual({
      title: "Night Sets Revised",
      description: "Updated late hour selections",
      isPublic: false,
    });

    expect(addCall[0]).toBe("https://api.wavestream.test/api/playlists/playlist-1/tracks");
    expect(addCall[1]?.method).toBe("POST");
    expect(JSON.parse(String(addCall[1]?.body))).toEqual({ trackId: "track-2" });

    expect(removeCall[0]).toBe("https://api.wavestream.test/api/playlists/playlist-1/tracks/track-1");
    expect(removeCall[1]?.method).toBe("DELETE");
    expect(removeCall[1]?.body).toBeUndefined();

    expect(reorderCall[0]).toBe("https://api.wavestream.test/api/playlists/playlist-1/tracks/reorder");
    expect(reorderCall[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(reorderCall[1]?.body))).toEqual({
      trackIds: ["track-2", "track-1"],
    });

    expect(deleteCall[0]).toBe("https://api.wavestream.test/api/playlists/playlist-1");
    expect(deleteCall[1]?.method).toBe("DELETE");
    expect(deleteCall[1]?.body).toBeUndefined();
  });
});
