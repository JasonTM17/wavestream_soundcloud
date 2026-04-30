import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PlaylistPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "private-filtered" }),
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
  usePlaylistQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: "playlist-1",
      slug: "private-filtered",
      title: "Filtered Playlist",
      description: "Public playlist after private tracks were filtered out.",
      isPublic: true,
      trackCount: 0,
      totalDuration: 0,
      owner: {
        id: "artist-1",
        username: "solis",
        displayName: "Solis Kim",
        role: "creator",
      },
      tracks: [],
    },
  }),
  useUpdatePlaylistMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useDeletePlaylistMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRemoveTrackFromPlaylistMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useReorderPlaylistTracksMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useCreateReportMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useT: (namespace: string) => {
    const copy = {
      common: {
        discover: "Discover",
        play: "Play",
        share: "Share",
        report: "Report",
        edit: "Edit",
        delete: "Delete",
        tracks: "tracks",
        public: "Public",
        private: "Private",
        sharedNative: "Share dialog opened.",
        linkCopied: "Link copied.",
      },
      playlist: {
        notFound: "Playlist not available.",
        notFoundDesc: "This playlist may be private or does not exist.",
        tracks: "tracks",
        emptyPlaylist: "This playlist has no tracks yet.",
        orderUpdated: "Order updated.",
        edited: "Playlist updated.",
        deleted: "Playlist deleted.",
        trackRemoved: "Track removed from playlist.",
        reportSubmitted: "Report submitted.",
      },
    } as const;

    return copy[namespace as keyof typeof copy];
  },
}));

vi.mock("@/components/playlists/share-action-button", () => ({
  ShareActionButton: ({ children }: { children: unknown }) => <button>{children as string}</button>,
}));

vi.mock("@/components/playlists/confirm-delete-dialog", () => ({
  ConfirmDeleteDialog: () => null,
}));

vi.mock("@/components/playlists/playlist-editor-dialog", () => ({
  PlaylistEditorDialog: () => null,
}));

vi.mock("@/components/reports/report-dialog", () => ({
  ReportDialog: () => null,
}));

describe("PlaylistPage public empty states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty playlist state after non-public tracks were filtered out", () => {
    render(<PlaylistPage />);

    expect(screen.getByText("Filtered Playlist")).toBeVisible();
    expect(screen.getByText("This playlist has no tracks yet.")).toBeVisible();
  });
});
