import type {
  DiscoveryResults,
  GenreSummary,
  PlaylistSummary,
  TrackSummary,
  UserSummary,
} from "@/lib/wavestream-api";
import { SERVER_API_URL } from "@/lib/server-api";

type DiscoveryPayload = Partial<DiscoveryResults> | { data?: Partial<DiscoveryResults> };
type GenresPayload = GenreSummary[] | { data?: GenreSummary[] };
type TracksPayload = TrackSummary[] | { data?: TrackSummary[] };
type PlaylistsPayload = PlaylistSummary[] | { data?: PlaylistSummary[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const asArray = <T,>(payload: unknown, key?: string) => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (key && isRecord(payload) && Array.isArray(payload[key])) {
    return payload[key] as T[];
  }

  return [];
};

async function fetchPublicJson(path: string) {
  try {
    const response = await fetch(`${SERVER_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return null;
    }

    return response.json().catch(() => null);
  } catch {
    return null;
  }
}

function normalizeDiscovery(payload: DiscoveryPayload | null): DiscoveryResults | null {
  if (!payload) {
    return null;
  }

  const source = isRecord(payload) && "data" in payload && isRecord(payload.data) ? payload.data : payload;

  return {
    trendingTracks: asArray<TrackSummary>(source, "trendingTracks"),
    newReleases: asArray<TrackSummary>(source, "newReleases"),
    featuredPlaylists: asArray<PlaylistSummary>(source, "featuredPlaylists"),
    featuredArtists: asArray<UserSummary>(source, "featuredArtists"),
    genres: asArray<GenreSummary>(source, "genres"),
  };
}

function normalizeGenres(payload: GenresPayload | null) {
  if (!payload) {
    return [];
  }

  return asArray<GenreSummary>(payload, "data");
}

async function fetchPublicDiscoveryFallback(genres: GenreSummary[] = []): Promise<DiscoveryResults> {
  const [tracksPayload, playlistsPayload] = await Promise.all([
    fetchPublicJson("/api/tracks?limit=12"),
    fetchPublicJson("/api/playlists?limit=6"),
  ]);

  const tracks = asArray<TrackSummary>(tracksPayload as TracksPayload | null, "data");
  const playlists = asArray<PlaylistSummary>(playlistsPayload as PlaylistsPayload | null, "data");
  const featuredArtists = new Map<string, UserSummary>();

  tracks.forEach((track) => {
    featuredArtists.set(track.artist.id, track.artist);
  });

  return {
    trendingTracks: tracks,
    newReleases: tracks.slice(0, 6),
    featuredPlaylists: playlists,
    featuredArtists: Array.from(featuredArtists.values()).slice(0, 6),
    genres,
  };
}

export async function getPublicLandingData(): Promise<DiscoveryResults> {
  const [discoveryPayload, genresPayload] = await Promise.all([
    fetchPublicJson("/api/discovery/home"),
    fetchPublicJson("/api/genres"),
  ]);

  const discovery = normalizeDiscovery(discoveryPayload as DiscoveryPayload | null);
  const genres = normalizeGenres(genresPayload as GenresPayload | null);

  if (discovery) {
    return {
      ...discovery,
      genres: genres.length ? genres : discovery.genres,
    };
  }

  const fallback = await fetchPublicDiscoveryFallback(genres);
  return {
    ...fallback,
    genres: genres.length ? genres : fallback.genres,
  };
}
