'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ReportableType } from '@wavestream/shared';
import {
  ArrowLeft,
  Heart,
  ListPlus,
  MessageSquare,
  Pause,
  Play,
  ShieldAlert,
  UserPlus2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ReportDialog } from '@/components/reports/report-dialog';
import { AddToPlaylistDialog } from '@/components/playlists/add-to-playlist-dialog';
import {
  PlaylistEditorDialog,
  type PlaylistEditorValues,
} from '@/components/playlists/playlist-editor-dialog';
import { ShareActionButton } from '@/components/playlists/share-action-button';
import { WaveformBar } from '@/components/player/waveform-bar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuthSession } from '@/lib/auth-store';
import { usePlayerStore } from '@/lib/player-store';
import { useT } from '@/lib/i18n';
import { ApiError } from '@/lib/api';
import {
  formatCompactNumber,
  formatDuration,
  toPlaylistCard,
  toTrackCard,
} from '@/lib/wavestream-api';
import {
  useAddTrackToPlaylistMutation,
  useCreateCommentMutation,
  useCreatePlaylistMutation,
  useMyPlaylistsQuery,
  useRelatedTracksQuery,
  useCreateReportMutation,
  useToggleFollowMutation,
  useToggleTrackReactionMutation,
  useTrackCommentsQuery,
  useTrackQuery,
} from '@/lib/wavestream-queries';

function RepostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function TrackSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[200px] rounded-xl bg-card animate-pulse" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="h-48 rounded-lg bg-card animate-pulse" />
          <div className="h-48 rounded-lg bg-card animate-pulse" />
        </div>
        <div className="h-72 rounded-lg bg-card animate-pulse" />
      </div>
    </div>
  );
}

const toPlaylistPayload = (values: PlaylistEditorValues) => ({
  title: values.title,
  description: values.description.trim() ? values.description.trim() : null,
  isPublic: values.visibility === 'public',
});

export default function TrackPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const session = useAuthSession();
  const t = useT('track');
  const tCommon = useT('common');
  const tDialogs = useT('dialogs');
  const trackSlug = typeof params.slug === 'string' ? params.slug : '';
  const trackQuery = useTrackQuery(trackSlug);
  const commentsQuery = useTrackCommentsQuery(trackSlug);
  const relatedQuery = useRelatedTracksQuery(trackSlug);
  const myPlaylistsQuery = useMyPlaylistsQuery();
  const playerCurrentTrack = usePlayerStore((state) => state.currentTrack);
  const playerIsPlaying = usePlayerStore((state) => state.isPlaying);
  const playerProgress = usePlayerStore((state) => state.progress);
  const playerDuration = usePlayerStore((state) => state.duration);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setProgress = usePlayerStore((state) => state.setProgress);

  const [liked, setLiked] = React.useState(false);
  const [reposted, setReposted] = React.useState(false);
  const [following, setFollowing] = React.useState(false);
  const [commentBody, setCommentBody] = React.useState('');
  const [timestamp, setTimestamp] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = React.useState<string>('');

  const currentTrack = trackQuery.data;
  const relatedTracks = relatedQuery.data ?? [];
  const comments = commentsQuery.data ?? [];

  const playlistOptions = React.useMemo(
    () =>
      (myPlaylistsQuery.data ?? []).map((playlist) => {
        const card = toPlaylistCard(playlist);
        return {
          id: card.id,
          title: card.title,
          description: card.description,
          trackCount: card.trackCount,
          totalDurationLabel: card.totalDurationLabel,
          isPublic: card.isPublic,
          coverUrl: card.coverUrl,
        };
      }),
    [myPlaylistsQuery.data],
  );

  const likeMutation = useToggleTrackReactionMutation(trackSlug, 'like');
  const repostMutation = useToggleTrackReactionMutation(trackSlug, 'repost');
  const followMutation = useToggleFollowMutation(currentTrack?.artist.id ?? '');
  const commentMutation = useCreateCommentMutation(trackSlug);
  const createPlaylistMutation = useCreatePlaylistMutation();
  const addTrackToPlaylistMutation = useAddTrackToPlaylistMutation(selectedPlaylistId);
  const createReportMutation = useCreateReportMutation();

  React.useEffect(() => {
    setLiked(Boolean(currentTrack?.isLiked));
    setReposted(Boolean(currentTrack?.isReposted));
    setFollowing(Boolean(currentTrack?.isFollowingArtist));
  }, [currentTrack?.isFollowingArtist, currentTrack?.isLiked, currentTrack?.isReposted]);

  React.useEffect(() => {
    if (!selectedPlaylistId && playlistOptions[0]?.id) {
      setSelectedPlaylistId(playlistOptions[0].id);
    }
  }, [playlistOptions, selectedPlaylistId]);

  if (!trackSlug || trackQuery.isLoading) {
    return <TrackSkeleton />;
  }

  if (trackQuery.isError || !currentTrack) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 space-y-3">
        <p className="text-lg font-bold text-foreground">{t.trackNotAvailable}</p>
        <p className="text-sm text-muted-foreground">{t.trackNotAvailableDesc}</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4" />
            {t.backToDiscover}
          </Link>
        </Button>
      </div>
    );
  }

  const card = toTrackCard(currentTrack);
  const queue = [card, ...relatedTracks.filter((t) => t.id !== card.id).map(toTrackCard)];
  const isOwner = session.user?.id === currentTrack.artist.id;
  const isActiveTrack = playerCurrentTrack?.id === card.id;
  const activeProgress = isActiveTrack ? playerProgress : 0;
  const activeDuration = isActiveTrack
    ? playerDuration
    : (card.durationSeconds ?? currentTrack.duration);
  const progressPercent =
    activeDuration > 0 ? Math.min((activeProgress / activeDuration) * 100, 100) : 0;
  const optimisticLikeCount = Math.max(
    0,
    currentTrack.likeCount +
      (liked && !currentTrack.isLiked ? 1 : 0) -
      (!liked && currentTrack.isLiked ? 1 : 0),
  );
  const optimisticRepostCount = Math.max(
    0,
    currentTrack.repostCount +
      (reposted && !currentTrack.isReposted ? 1 : 0) -
      (!reposted && currentTrack.isReposted ? 1 : 0),
  );

  const playNow = () => {
    if (isActiveTrack) {
      togglePlay();
      return;
    }
    setQueue(queue);
    playTrack(card);
  };

  const handleWaveformSeek = (seconds: number) => {
    if (!isActiveTrack) {
      setQueue(queue);
      playTrack(card);
    }
    setProgress(seconds);
  };

  const submitComment = () => {
    if (!commentBody.trim()) {
      toast.error(t.addComment);
      return;
    }
    const parsedTimestamp = Number(timestamp);
    const timestampSeconds =
      timestamp.trim() && !Number.isNaN(parsedTimestamp) ? parsedTimestamp : undefined;
    commentMutation.mutate(
      { body: commentBody, timestampSeconds },
      {
        onSuccess: () => {
          toast.success(t.commentPosted);
          setCommentBody('');
          setTimestamp('');
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
          } else {
            toast.error(error instanceof Error ? error.message : t.failedComment);
          }
        },
      },
    );
  };

  const openPlaylistDialog = () => {
    if (session.isBooting) return;
    if (!session.isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
      return;
    }
    if (!selectedPlaylistId && playlistOptions[0]?.id) setSelectedPlaylistId(playlistOptions[0].id);
    setIsAddDialogOpen(true);
  };

  const handleCreatePlaylist = async (values: PlaylistEditorValues) => {
    const createdPlaylist = await createPlaylistMutation.mutateAsync(toPlaylistPayload(values));
    await addTrackToPlaylistMutation.mutateAsync({
      trackId: currentTrack.id,
      playlistIdOrSlug: createdPlaylist.id,
    });
    setSelectedPlaylistId(createdPlaylist.id);
    setIsCreatePlaylistOpen(false);
    toast.success(t.playlistCreatedAndAdded);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    await addTrackToPlaylistMutation.mutateAsync({
      trackId: currentTrack.id,
      playlistIdOrSlug: playlistId,
    });
    setSelectedPlaylistId(playlistId);
    setIsAddDialogOpen(false);
    toast.success(t.addedToPlaylist);
  };

  const openReportDialog = () => {
    if (session.isBooting) return;
    if (!session.isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
      return;
    }
    setIsReportOpen(true);
  };

  const handleCreateReport = async (values: { reason: string; details?: string | null }) => {
    await createReportMutation.mutateAsync({
      reportableType: ReportableType.TRACK,
      reportableId: currentTrack.id,
      reason: values.reason,
      details: values.details,
    });
    setIsReportOpen(false);
    toast.success(tDialogs.reportSubmitted);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        asChild
        className="w-fit px-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
      >
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4" />
          {t.backToDiscover}
        </Link>
      </Button>

      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-card"
        data-testid="track-hero"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          {/* Cover art */}
          <div
            className="h-36 w-36 shrink-0 rounded-lg bg-muted shadow-lg sm:h-44 sm:w-44"
            style={
              card.coverUrl
                ? {
                    backgroundImage: `url(${card.coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />

          {/* Track meta + actions */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div className="space-y-1">
              {card.genreLabel && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  {card.genreLabel}
                </Badge>
              )}
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{card.title}</h1>
              <Link
                href={`/artist/${card.artistHandle?.replace('@', '')}`}
                className="text-base text-muted-foreground hover:text-primary transition-colors"
              >
                {card.artistName}
              </Link>
            </div>

            {/* Inline stats */}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5" />
                {formatCompactNumber(currentTrack.playCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {formatCompactNumber(currentTrack.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <RepostIcon className="h-3.5 w-3.5" />
                {formatCompactNumber(currentTrack.repostCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {formatCompactNumber(currentTrack.commentCount)}
              </span>
              <span className="text-xs">{card.durationLabel}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={playNow}
                className="rounded-full bg-primary hover:bg-primary/90 text-white"
              >
                {isActiveTrack && playerIsPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isActiveTrack && playerIsPlaying ? tCommon.pause : tCommon.play}
              </Button>
              {isActiveTrack && !playerIsPlaying && activeProgress > 5 && (
                <Button
                  variant="outline"
                  onClick={playNow}
                  className="rounded-full border-border hover:border-foreground"
                >
                  <Play className="h-4 w-4" />
                  {t.resumeFrom} {formatDuration(activeProgress)}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (session.isBooting) return;
                  if (!session.isAuthenticated) {
                    router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
                    return;
                  }
                  const next = !liked;
                  setLiked(next);
                  likeMutation.mutate(next, {
                    onError: (error) => {
                      setLiked((v) => !v);
                      if (error instanceof ApiError && error.status === 401) {
                        router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
                      } else {
                        toast.error(error instanceof Error ? error.message : t.failedLike);
                      }
                    },
                  });
                }}
                className={`rounded-full border-border hover:border-foreground ${liked ? 'border-primary text-primary' : ''}`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {formatCompactNumber(optimisticLikeCount)}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (session.isBooting) return;
                  if (!session.isAuthenticated) {
                    router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
                    return;
                  }
                  const next = !reposted;
                  setReposted(next);
                  repostMutation.mutate(next, {
                    onError: (error) => {
                      setReposted((v) => !v);
                      if (error instanceof ApiError && error.status === 401) {
                        router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
                      } else {
                        toast.error(error instanceof Error ? error.message : t.failedRepost);
                      }
                    },
                  });
                }}
                className={`rounded-full border-border hover:border-foreground ${reposted ? 'border-primary text-primary' : ''}`}
              >
                <RepostIcon className="h-4 w-4" />
                {formatCompactNumber(optimisticRepostCount)}
              </Button>
              <Button
                variant="outline"
                onClick={openPlaylistDialog}
                className="rounded-full border-border hover:border-foreground"
              >
                <ListPlus className="h-4 w-4" />
                {tCommon.add}
              </Button>
              <ShareActionButton
                title={card.title}
                text={`${t.shareTextPrefix} ${card.title} ${t.shareTextBy} ${card.artistName} ${t.shareTextSuffix}`}
                successLabel={tCommon.share}
                onSuccess={(method) => {
                  toast.success(method === 'native' ? tCommon.sharedNative : tCommon.linkCopied);
                }}
                onError={(error) => toast.error(error.message)}
              >
                {tCommon.share}
              </ShareActionButton>
              {!isOwner && (
                <Button
                  variant="outline"
                  onClick={openReportDialog}
                  className="rounded-full border-border hover:border-foreground"
                >
                  <ShieldAlert className="h-4 w-4" />
                  {tCommon.report}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Waveform section, full width and prominent */}
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">
              {formatDuration(activeProgress)}
            </span>
            <WaveformBar
              progress={progressPercent}
              duration={activeDuration}
              onSeek={handleWaveformSeek}
              seed={card.slug}
              barCount={120}
              className="flex-1 h-16"
            />
            <span className="text-[10px] text-muted-foreground tabular-nums w-9">
              {formatDuration(activeDuration)}
            </span>
          </div>

          {/* Comment markers on waveform */}
          {comments.length > 0 && activeDuration > 0 && (
            <div className="relative h-4 ml-12 mr-12">
              {comments
                .filter((c) => c.timestampSeconds != null && c.timestampSeconds <= activeDuration)
                .slice(0, 20)
                .map((c) => {
                  const pct = ((c.timestampSeconds ?? 0) / activeDuration) * 100;
                  return (
                    <button
                      key={c.id}
                      title={`${c.user.displayName}: ${c.body}`}
                      style={{ left: `${pct}%` }}
                      className="absolute -translate-x-1/2 h-2 w-2 rounded-full bg-primary/70 hover:bg-primary transition-colors hover:scale-150"
                      onClick={() => handleWaveformSeek(c.timestampSeconds ?? 0)}
                      aria-label={`Jump to ${formatDuration(c.timestampSeconds ?? 0)}`}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Comments */}
        <div className="space-y-4">
          {/* Track description */}
          {card.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
          )}

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">{t.comments}</h3>
              {comments.length > 0 && (
                <span className="text-xs text-muted-foreground">({comments.length})</span>
              )}
            </div>
            <div className="divide-y divide-border">
              {commentsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3 p-4">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : comments.length ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {comment.user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {comment.user.displayName}
                        </span>
                        {comment.timestampSeconds != null && (
                          <button
                            onClick={() => handleWaveformSeek(comment.timestampSeconds ?? 0)}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            {formatDuration(comment.timestampSeconds)}
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{comment.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-sm text-muted-foreground">{t.noComments}</div>
              )}
            </div>

            {/* Comment form */}
            {session.isAuthenticated ? (
              <div className="border-t border-border p-5 space-y-3">
                <Textarea
                  id="comment-body"
                  placeholder={t.writeComment}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="bg-muted border-border resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <Input
                    id="timestamp"
                    inputMode="numeric"
                    placeholder={t.timestampPlaceholder}
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="h-8 text-xs bg-muted border-border max-w-[140px]"
                  />
                  <Button
                    onClick={submitComment}
                    disabled={commentMutation.isPending}
                    className="rounded-full bg-primary hover:bg-primary/90 text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {commentMutation.isPending ? t.posting : t.postComment}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-border p-5">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`}>
                    {t.signInToComment}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Artist */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">{tCommon.artist}</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/80 text-white font-bold">
                  {card.artistName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{card.artistName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCompactNumber(currentTrack.artist.followerCount ?? 0)} {tCommon.followers}
                </p>
              </div>
            </div>
            {session.isAuthenticated && !isOwner && (
              <Button
                variant={following ? 'secondary' : 'outline'}
                onClick={() => {
                  const next = !following;
                  setFollowing(next);
                  followMutation.mutate(next, {
                    onError: (error) => {
                      setFollowing((v) => !v);
                      if (error instanceof ApiError && error.status === 401) {
                        router.push(`/sign-in?next=${encodeURIComponent(`/track/${trackSlug}`)}`);
                      } else {
                        toast.error(error instanceof Error ? error.message : t.failedFollow);
                      }
                    },
                  });
                }}
                className="mt-3 w-full rounded-full border-border"
              >
                <UserPlus2 className="h-4 w-4" />
                {following ? tCommon.following : tCommon.follow}
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-2 w-full rounded-full text-muted-foreground"
            >
              <Link href={`/artist/${card.artistHandle?.replace('@', '')}`}>
                {tCommon.viewProfile}
              </Link>
            </Button>
          </div>

          {/* Related tracks */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">{t.relatedTracks}</h3>
            </div>
            <div className="divide-y divide-border">
              {relatedQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3 p-3">
                    <Skeleton className="h-9 w-9 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : relatedTracks.length ? (
                relatedTracks.map((track) => {
                  const related = toTrackCard(track);
                  return (
                    <Link
                      key={related.id}
                      href={`/track/${related.slug}`}
                      className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-9 w-9 shrink-0 rounded bg-muted"
                        style={
                          related.coverUrl
                            ? {
                                backgroundImage: `url(${related.coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {related.title}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {related.artistName}
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-xs text-muted-foreground">{t.noRelated}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <AddToPlaylistDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        trackTitle={card.title}
        trackArtistName={card.artistName}
        trackDescription={card.description}
        playlists={playlistOptions}
        selectedPlaylistId={selectedPlaylistId}
        onSelectedPlaylistIdChange={setSelectedPlaylistId}
        isPending={addTrackToPlaylistMutation.isPending}
        emptyStateDescription={t.addToPlaylistEmptyDesc}
        onConfirm={handleAddToPlaylist}
        onCreatePlaylist={() => {
          setIsAddDialogOpen(false);
          setIsCreatePlaylistOpen(true);
        }}
      />

      <PlaylistEditorDialog
        open={isCreatePlaylistOpen}
        onOpenChange={(open) => {
          setIsCreatePlaylistOpen(open);
          if (!open) setIsAddDialogOpen(false);
        }}
        mode="create"
        isPending={createPlaylistMutation.isPending}
        onSubmit={handleCreatePlaylist}
      />

      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        entityLabel={t.trackEntityLabel}
        entityName={card.title}
        isPending={createReportMutation.isPending}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}
