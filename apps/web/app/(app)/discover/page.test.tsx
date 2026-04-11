import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DiscoverPage from "./page";

const useAuthSession = vi.fn();
const useDiscoveryQuery = vi.fn();
const useGenresQuery = vi.fn();

vi.mock("@/lib/auth-store", () => ({
  useAuthSession: () => useAuthSession(),
}));

vi.mock("@/lib/wavestream-queries", () => ({
  useDiscoveryQuery: () => useDiscoveryQuery(),
  useGenresQuery: () => useGenresQuery(),
}));

vi.mock("@/lib/player-store", () => ({
  usePlayerStore: (selector: (state: { setQueue: () => void; playTrack: () => void }) => unknown) =>
    selector({
      setQueue: vi.fn(),
      playTrack: vi.fn(),
    }),
}));

describe("DiscoverPage", () => {
  beforeEach(() => {
    useAuthSession.mockReturnValue({
      isAuthenticated: false,
      isBooting: false,
      isGuest: true,
      user: null,
    });
    useDiscoveryQuery.mockReturnValue({
      isLoading: false,
      data: {
        trendingTracks: [
          {
            id: "track-1",
            slug: "aurora-current",
            title: "Aurora Current",
            duration: 32,
            playCount: 16,
            likeCount: 1,
            repostCount: 1,
            commentCount: 1,
            artist: {
              id: "artist-1",
              username: "solis-kim",
              displayName: "Solis Kim",
              role: "creator",
              followerCount: 3,
              trackCount: 8,
            },
            genre: {
              id: "genre-1",
              name: "Electronic",
              slug: "electronic",
            },
            file: {
              id: "file-1",
              streamUrl: "/api/tracks/track-1/stream",
            },
            tags: [],
          },
        ],
        featuredArtists: [
          {
            id: "artist-1",
            username: "solis-kim",
            displayName: "Solis Kim",
            role: "creator",
            followerCount: 3,
            trackCount: 8,
            bio: "Builds nocturnal synth sketches for long train rides and coding sprints.",
          },
        ],
        featuredPlaylists: [],
        genres: [],
      },
    });
    useGenresQuery.mockReturnValue({
      isLoading: false,
      data: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders real feed snapshot cards instead of synthetic pulse progress", () => {
    render(<DiscoverPage />);

    expect(screen.getByText("Feed snapshot")).toBeInTheDocument();
    expect(screen.queryByText("Listening pulse")).not.toBeInTheDocument();
    expect(screen.getAllByText("Featured artists")).toHaveLength(2);
  });

  it("routes guests toward sign-in for creator tools and keeps artist cards deep-linkable", () => {
    render(<DiscoverPage />);

    const creatorLinks = screen.getAllByRole("link", { name: "Sign in for creator tools" });

    expect(creatorLinks[0]).toHaveAttribute("href", "/sign-in?next=%2Fcreator");
    const artistLinks = screen.getAllByRole("link", { name: "Open artist Solis Kim" });

    expect(artistLinks[0]).toHaveAttribute("href", "/artist/solis-kim");
  });
});
