import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ArtistPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "ghost-artist" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth-store", () => ({
  useAuthSession: () => ({
    isAuthenticated: false,
    isBooting: false,
    user: null,
  }),
}));

vi.mock("@/lib/player-store", () => ({
  usePlayerStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      currentTrack: null,
      isPlaying: false,
      setQueue: vi.fn(),
      playTrack: vi.fn(),
      togglePlay: vi.fn(),
    }),
}));

vi.mock("@/lib/wavestream-queries", () => ({
  useArtistProfileQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      isFollowing: false,
      user: {
        id: "artist-1",
        username: "ghost-artist",
        displayName: "Ghost Artist",
        bio: null,
        followerCount: 0,
      },
    },
  }),
  useTracksQuery: () => ({
    isLoading: false,
    data: [],
  }),
  usePublicPlaylistsQuery: () => ({
    isLoading: false,
    data: [],
  }),
  useToggleFollowMutation: () => ({
    mutate: vi.fn(),
  }),
  useCreateReportMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useT: (namespace: string) => {
    const copy = {
      artist: {
        notFound: "Artist not found.",
        notFoundDesc: "This artist does not exist or their profile is private.",
        uploadedTracks: "Uploaded tracks",
        playlists: "Playlists",
        noTracks: "This artist has no tracks yet.",
        noPlaylists: "This artist has no playlists yet.",
        followers: "followers",
      },
      common: {
        discover: "Discover",
        tracks: "tracks",
        plays: "plays",
        play: "Play",
        report: "Report",
        follow: "Follow",
        following: "Following",
        somethingWentWrong: "Something went wrong.",
      },
      dialogs: {
        reportSubmitted: "Report submitted.",
      },
    } as const;

    return copy[namespace as keyof typeof copy];
  },
}));

vi.mock("@/components/reports/report-dialog", () => ({
  ReportDialog: () => null,
}));

describe("ArtistPage public empty states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders no public tracks and no public playlists states cleanly", () => {
    render(<ArtistPage />);

    expect(screen.getByText("Uploaded tracks")).toBeVisible();
    expect(screen.getByText("Playlists")).toBeVisible();
    expect(screen.getByText("This artist has no tracks yet.")).toBeVisible();
    expect(screen.getByText("This artist has no playlists yet.")).toBeVisible();
  });
});
