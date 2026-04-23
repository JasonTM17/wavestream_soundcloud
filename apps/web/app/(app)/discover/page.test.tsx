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
  usePlayerStore: (selector: (state: { setQueue: () => void; playTrack: () => void; currentTrack: null; isPlaying: boolean; togglePlay: () => void }) => unknown) =>
    selector({
      setQueue: vi.fn(),
      playTrack: vi.fn(),
      currentTrack: null,
      isPlaying: false,
      togglePlay: vi.fn(),
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

  it("renders trending tracks section without AI dashboard patterns", () => {
    render(<DiscoverPage />);

    // Page heading is translated to Vietnamese
    expect(screen.getByRole("heading", { name: "Khám phá" })).toBeInTheDocument();
    // Trending tracks section heading (i18n)
    expect(screen.getByText("Đang thịnh hành")).toBeInTheDocument();
    // No synthetic pulse/progress
    expect(screen.queryByText("Listening pulse")).not.toBeInTheDocument();
  });

  it("routes guests toward sign-in for creator tools", () => {
    render(<DiscoverPage />);

    // CTA for unauthenticated users links to sign-in for creator tools
    const allLinks = screen.getAllByRole("link");
    const creatorLink = allLinks.find(
      (l) => l.getAttribute("href") === "/sign-in?next=%2Fcreator",
    );
    expect(creatorLink).toBeDefined();
    expect(creatorLink?.getAttribute("href")).toBe("/sign-in?next=%2Fcreator");
  });
});
