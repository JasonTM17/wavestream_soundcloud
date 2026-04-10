"use client";

import Link from "next/link";
import { Clock3, Heart, LibraryBig, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/lib/auth-store";
import { toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import {
  useCurrentUserQuery,
  useListeningHistoryQuery,
  usePlaylistsQuery,
} from "@/lib/wavestream-queries";

function LibrarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[2rem]" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-[2rem]" />
    </div>
  );
}

export default function LibraryPage() {
  const session = useAuthSession();
  const currentUserQuery = useCurrentUserQuery();
  const historyQuery = useListeningHistoryQuery();
  const user = currentUserQuery.data ?? session.user;
  const playlistsQuery = usePlaylistsQuery(user?.id);
  const history = historyQuery.data ?? [];
  const playlists = (playlistsQuery.data ?? []).map(toPlaylistCard);

  if (session.isBooting || (currentUserQuery.isLoading && !user)) {
    return <LibrarySkeleton />;
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Listening history", `${history.length} tracks`, Clock3],
            ["Liked tracks", `${user?.trackCount ?? 0} tracks`, Heart],
            ["Following", `${user?.followingCount ?? 0} creators`, Users],
            ["Playlists", `${playlists.length} collections`, LibraryBig],
          ].map(([label, value, Icon]) => (
            <Card key={label as string}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{value as string}</p>
                  <p className="text-sm text-muted-foreground">{label as string}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent listening</CardTitle>
              <CardDescription>
                Resume where you left off with live listening history data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-3xl" />
                ))
              ) : history.length ? (
                history.map((entry, index) => {
                  const track = toTrackCard(entry.track);
                  return (
                    <Link
                      key={`${entry.track.id}-${entry.playedAt}`}
                      href={`/track/${track.slug}`}
                      className="rounded-3xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/35"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500"
                          style={
                            track.coverUrl
                              ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.18), rgba(7, 11, 24, 0.45)), url(${track.coverUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{track.title}</p>
                          <p className="truncate text-sm text-muted-foreground">{track.artistName}</p>
                        </div>
                        <Badge variant="soft">#{index + 1}</Badge>
                      </div>
                      <div className="mt-4">
                        <Progress value={40 + index * 15} />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <Card className="border-dashed bg-background/60">
                  <CardContent className="space-y-2 p-6">
                    <p className="font-medium">Listening history is empty</p>
                    <p className="text-sm text-muted-foreground">
                      Playback events will appear here after you start listening on a signed-in session.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved playlists</CardTitle>
                <CardDescription>Collections from your live playlist feed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {playlistsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-3xl" />
                  ))
                ) : playlists.length ? (
                  playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.slug}`}
                      className="block rounded-3xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/35"
                    >
                      <p className="font-medium">{playlist.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{playlist.description}</p>
                      <Badge variant="soft" className="mt-3">
                        {playlist.trackCount} tracks | {playlist.totalDurationLabel}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <Card className="border-dashed bg-background/60">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      No playlists returned for this account yet.
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile summary</CardTitle>
                <CardDescription>Creator, listener, and queue overview.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-background/70 p-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                      {(user?.displayName ?? "WS").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{user?.displayName ?? "WaveStream member"}</p>
                    <p className="truncate text-sm text-muted-foreground">@{user?.username ?? "member"}</p>
                  </div>
                  <Badge variant="outline">{user?.role ?? "listener"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Library data is now pulled from live endpoints, so your saved state stays aligned with
                  whatever the backend seeds for this demo environment.
                </p>
                <Progress value={Math.min(100, (user?.playlistCount ?? 0) * 12 + 30)} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
