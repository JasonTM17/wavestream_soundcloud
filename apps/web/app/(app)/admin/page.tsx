'use client';

import * as React from 'react';
import { ReportStatus, TrackStatus, UserRole } from '@wavestream/shared';
import { ShieldAlert, Users, Waves, MessageSquareWarning, ListMusic } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { ModerationNoteDialog } from '@/components/admin/moderation-note-dialog';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { ResolveReportDialog } from '@/components/admin/resolve-report-dialog';
import { ProtectedRoute } from '@/components/protected-route';
import { useT } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatCompactNumber,
  formatDuration,
  type AdminAuditLogSummary,
  type AdminCommentSummary,
  type AdminPlaylistSummary,
  type AdminReportSummary,
  type AdminTrackSummary,
  type AdminUserSummary,
} from '@/lib/wavestream-api';
import {
  useAdminAuditLogsQuery,
  useAdminCommentsQuery,
  useAdminOverviewQuery,
  useAdminPlaylistsQuery,
  useAdminReportsQuery,
  useAdminTracksQuery,
  useAdminUsersQuery,
  useDeleteAdminPlaylistMutation,
  useHideAdminCommentMutation,
  useHideAdminTrackMutation,
  useResolveAdminReportMutation,
  useRestoreAdminCommentMutation,
  useRestoreAdminTrackMutation,
  useUpdateAdminUserRoleMutation,
} from '@/lib/wavestream-queries';

const PAGE_SIZE = 8;

const getHasPreviousPage = (meta?: { hasPrev?: boolean; hasPreviousPage?: boolean }) =>
  Boolean(meta?.hasPrev ?? meta?.hasPreviousPage);

const getHasNextPage = (meta?: { hasNext?: boolean; hasNextPage?: boolean }) =>
  Boolean(meta?.hasNext ?? meta?.hasNextPage);

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-[42rem] rounded-md" />
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-6 text-sm text-muted-foreground">
      <p className="font-bold text-foreground mb-2">{title}</p>
      {description}
    </div>
  );
}

function QueryErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  const tAdmin = useT('admin');
  return (
    <div className="rounded-lg bg-muted/30 p-6">
      <div className="space-y-2 mb-4 text-muted-foreground text-sm">
        <p className="font-bold text-foreground">{tAdmin.loadFailed}</p>
        <p>{label}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        {tAdmin.retry}
      </Button>
    </div>
  );
}

function statusBadgeVariant(status: ReportStatus | TrackStatus | 'deleted' | 'active') {
  switch (status) {
    case ReportStatus.RESOLVED:
    case TrackStatus.PUBLISHED:
    case 'active':
      return 'success';
    case ReportStatus.DISMISSED:
    case TrackStatus.HIDDEN:
    case 'deleted':
      return 'outline';
    default:
      return 'soft';
  }
}

function targetStatusBadgeVariant(status?: string | null) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'published':
    case 'public':
      return 'success';
    case 'deleted':
    case 'hidden':
    case 'private':
      return 'outline';
    default:
      return 'soft';
  }
}

function AdminUserCard({ user }: { user: AdminUserSummary }) {
  const tAdmin = useT('admin');
  const tCommon = useT('common');
  const [draftRole, setDraftRole] = React.useState<UserRole>(user.role);
  const updateRoleMutation = useUpdateAdminUserRoleMutation(user.id);

  React.useEffect(() => {
    setDraftRole(user.role);
  }, [user.role]);

  const roleChanged = draftRole !== user.role;
  const roleLabel = user.deletedAt
    ? tAdmin.deletedLabel
    : user.role === UserRole.ADMIN
      ? tCommon.admin
      : user.role === UserRole.CREATOR
        ? tCommon.creator
        : tCommon.listener;

  return (
    <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">{user.displayName}</p>
            <Badge variant="soft">@{user.username}</Badge>
            <Badge variant={statusBadgeVariant(user.deletedAt ? 'deleted' : 'active')}>
              {roleLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {formatCompactNumber(user.followerCount)} {tCommon.followers} · {user.trackCount}{' '}
            {tCommon.tracks} · {user.playlistCount} {tCommon.playlists}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={draftRole} onValueChange={(value) => setDraftRole(value as UserRole)}>
            <SelectTrigger className="w-40 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.LISTENER}>{tCommon.listener}</SelectItem>
              <SelectItem value={UserRole.CREATOR}>{tCommon.creator}</SelectItem>
              <SelectItem value={UserRole.ADMIN}>{tCommon.admin}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={!roleChanged || updateRoleMutation.isPending}
            onClick={() =>
              updateRoleMutation.mutate(
                { role: draftRole },
                {
                  onSuccess: () => toast.success(tAdmin.roleUpdated),
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : tAdmin.roleUpdateFailed),
                },
              )
            }
          >
            {updateRoleMutation.isPending ? tAdmin.saving : tAdmin.apply}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminTrackCard({ track }: { track: AdminTrackSummary }) {
  const tAdmin = useT('admin');
  const tCommon = useT('common');
  const tCreator = useT('creator');
  const [isHideOpen, setIsHideOpen] = React.useState(false);
  const hideMutation = useHideAdminTrackMutation(track.id);
  const restoreMutation = useRestoreAdminTrackMutation(track.id);

  const statusLabel =
    track.status === TrackStatus.PUBLISHED
      ? tCreator.published
      : track.status === TrackStatus.HIDDEN
        ? tAdmin.hidden
        : tCreator.draft;
  const privacyLabel = track.privacy === 'public' ? tCommon.public : tCommon.private;

  return (
    <>
      <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">{track.title}</p>
              <Badge variant={statusBadgeVariant(track.status)}>{statusLabel}</Badge>
              <Badge variant="outline">{privacyLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {tAdmin.by} {track.artistName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {formatCompactNumber(track.playCount)} {tCommon.plays} ·{' '}
              {formatCompactNumber(track.likeCount)} {tCommon.likes} · {track.commentCount}{' '}
              {tCommon.comments}
            </p>
            {track.hiddenReason ? (
              <p className="text-sm text-muted-foreground">
                {tAdmin.hiddenReason}: {track.hiddenReason}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {track.status === 'hidden' ? (
              <Button
                type="button"
                variant="outline"
                disabled={restoreMutation.isPending}
                onClick={() =>
                  restoreMutation.mutate(undefined, {
                    onSuccess: () => toast.success(tAdmin.restored),
                    onError: (error) =>
                      toast.error(error instanceof Error ? error.message : tAdmin.restoreFailed),
                  })
                }
              >
                {restoreMutation.isPending ? tAdmin.restoring : tAdmin.restore}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setIsHideOpen(true)}>
                {tAdmin.hideTrack}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ModerationNoteDialog
        open={isHideOpen}
        onOpenChange={setIsHideOpen}
        title={tAdmin.hideTrack}
        description={`${tAdmin.hideTrack}: "${track.title}"`}
        confirmLabel={tAdmin.hideTrack}
        isPending={hideMutation.isPending}
        onConfirm={async (values) => {
          await hideMutation.mutateAsync({
            reason: values.reason ?? undefined,
          });
          setIsHideOpen(false);
          toast.success(tAdmin.hidden);
        }}
      />
    </>
  );
}

function AdminCommentCard({ comment }: { comment: AdminCommentSummary }) {
  const tAdmin = useT('admin');
  const [isHideOpen, setIsHideOpen] = React.useState(false);
  const hideMutation = useHideAdminCommentMutation(comment.id);
  const restoreMutation = useRestoreAdminCommentMutation(comment.id);

  return (
    <>
      <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">@{comment.username}</p>
              <Badge variant={statusBadgeVariant(comment.isHidden ? 'deleted' : 'active')}>
                {comment.isHidden ? tAdmin.hidden : tAdmin.visible}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{comment.trackTitle}</p>
            <p className="text-sm text-muted-foreground">{comment.body}</p>
          </div>

          <div className="flex gap-2">
            {comment.isHidden ? (
              <Button
                type="button"
                variant="outline"
                disabled={restoreMutation.isPending}
                onClick={() =>
                  restoreMutation.mutate(undefined, {
                    onSuccess: () => toast.success(tAdmin.restored),
                    onError: (error) =>
                      toast.error(error instanceof Error ? error.message : tAdmin.restoreFailed),
                  })
                }
              >
                {restoreMutation.isPending ? tAdmin.restoring : tAdmin.restore}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setIsHideOpen(true)}>
                {tAdmin.hideComment}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ModerationNoteDialog
        open={isHideOpen}
        onOpenChange={setIsHideOpen}
        title={tAdmin.hideComment}
        description={tAdmin.hideComment}
        confirmLabel={tAdmin.hideComment}
        isPending={hideMutation.isPending}
        onConfirm={async (values) => {
          await hideMutation.mutateAsync({
            reason: values.reason ?? undefined,
          });
          setIsHideOpen(false);
          toast.success(tAdmin.hidden);
        }}
      />
    </>
  );
}

function AdminPlaylistCard({ playlist }: { playlist: AdminPlaylistSummary }) {
  const tAdmin = useT('admin');
  const tCommon = useT('common');
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const deleteMutation = useDeleteAdminPlaylistMutation(playlist.id);

  const statusLabel = playlist.deletedAt
    ? tAdmin.deletedLabel
    : playlist.isPublic
      ? tCommon.public
      : tCommon.private;

  return (
    <>
      <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">{playlist.title}</p>
              <Badge variant={statusBadgeVariant(playlist.deletedAt ? 'deleted' : 'active')}>
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{playlist.ownerName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {playlist.trackCount} {tCommon.tracks} · {formatDuration(playlist.totalDuration)}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={Boolean(playlist.deletedAt)}
            onClick={() => setIsDeleteOpen(true)}
          >
            {tCommon.delete}
          </Button>
        </div>
      </div>

      <ModerationNoteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={tCommon.delete}
        description={`${tCommon.delete}: "${playlist.title}"`}
        confirmLabel={tCommon.delete}
        isPending={deleteMutation.isPending}
        onConfirm={async (values) => {
          await deleteMutation.mutateAsync({
            reason: values.reason ?? undefined,
          });
          setIsDeleteOpen(false);
          toast.success(tAdmin.deleted);
        }}
      />
    </>
  );
}

function AdminReportCard({ report }: { report: AdminReportSummary }) {
  const tAdmin = useT('admin');
  const tCommon = useT('common');
  const [isResolveOpen, setIsResolveOpen] = React.useState(false);
  const resolveMutation = useResolveAdminReportMutation(report.id);
  const shouldShowFallbackTargetId = !report.target?.label || !report.target?.href;

  return (
    <>
      <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">{report.reportableType}</Badge>
              <Badge variant={statusBadgeVariant(report.status)}>{report.status}</Badge>
              <p className="font-bold text-foreground">{report.reason}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">@{report.reporter}</p>

              {report.target?.label ? (
                <div className="space-y-2">
                  {report.target.href ? (
                    <Link
                      href={report.target.href}
                      className="block rounded-md bg-accent px-4 py-3 transition-colors hover:bg-accent/80 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{report.target.label}</p>
                        {report.target.status ? (
                          <Badge variant={targetStatusBadgeVariant(report.target.status)}>
                            {report.target.status}
                          </Badge>
                        ) : null}
                      </div>
                      {report.target.secondaryLabel ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.target.secondaryLabel}
                        </p>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="rounded-md bg-accent px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{report.target.label}</p>
                        {report.target.status ? (
                          <Badge variant={targetStatusBadgeVariant(report.target.status)}>
                            {report.target.status}
                          </Badge>
                        ) : null}
                      </div>
                      {report.target.secondaryLabel ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {report.target.secondaryLabel}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {shouldShowFallbackTargetId ? (
                <p className="text-sm text-muted-foreground">Target ID: {report.reportableId}</p>
              ) : null}
            </div>
            {report.details ? (
              <p className="text-sm text-muted-foreground">{report.details}</p>
            ) : null}
          </div>

          <Button type="button" variant="outline" onClick={() => setIsResolveOpen(true)}>
            {tCommon.confirm}
          </Button>
        </div>
      </div>

      <ResolveReportDialog
        open={isResolveOpen}
        onOpenChange={setIsResolveOpen}
        reportLabel={`${report.reportableType}`}
        isPending={resolveMutation.isPending}
        onConfirm={async (values) => {
          await resolveMutation.mutateAsync({
            status: values.status,
            note: values.note ?? undefined,
          });
          setIsResolveOpen(false);
          toast.success(tAdmin.restored);
        }}
      />
    </>
  );
}

function AdminAuditLogCard({ log }: { log: AdminAuditLogSummary }) {
  return (
    <div className="rounded-md bg-muted p-4 transition-colors hover:bg-accent">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{log.action}</Badge>
        <p className="font-bold text-foreground">
          {log.entityType}:{log.entityId}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        @{log.admin} · {new Date(log.createdAt).toLocaleString()}
      </p>
      {log.details ? (
        <pre className="mt-3 overflow-x-auto rounded-md bg-accent p-3 text-xs text-muted-foreground">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function AdminPageContent() {
  const tAdmin = useT('admin');
  const [usersPage, setUsersPage] = React.useState(1);
  const [tracksPage, setTracksPage] = React.useState(1);
  const [playlistsPage, setPlaylistsPage] = React.useState(1);
  const [commentsPage, setCommentsPage] = React.useState(1);
  const [reportsPage, setReportsPage] = React.useState(1);
  const [auditPage, setAuditPage] = React.useState(1);

  const overviewQuery = useAdminOverviewQuery();
  const usersQuery = useAdminUsersQuery({ page: usersPage, limit: PAGE_SIZE });
  const tracksQuery = useAdminTracksQuery({ page: tracksPage, limit: PAGE_SIZE });
  const playlistsQuery = useAdminPlaylistsQuery({ page: playlistsPage, limit: PAGE_SIZE });
  const commentsQuery = useAdminCommentsQuery({ page: commentsPage, limit: PAGE_SIZE });
  const reportsQuery = useAdminReportsQuery({ page: reportsPage, limit: PAGE_SIZE });
  const auditQuery = useAdminAuditLogsQuery({ page: auditPage, limit: PAGE_SIZE });

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <ProtectedRoute requireRole="admin">
        <AdminSkeleton />
      </ProtectedRoute>
    );
  }

  const overview = overviewQuery.data;

  return (
    <ProtectedRoute requireRole="admin">
      <div className="space-y-6">
        <section className="rounded-lg bg-card border border-border p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{tAdmin.title}</h1>
              <p className="text-sm text-muted-foreground">{tAdmin.adminOnlySurface}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            { label: tAdmin.users, value: overview?.userCount ?? 0, icon: Users },
            { label: tAdmin.tracks, value: overview?.trackCount ?? 0, icon: Waves },
            { label: tAdmin.playlists, value: overview?.playlistCount ?? 0, icon: ListMusic },
            { label: tAdmin.pendingReports, value: overview?.reportCount ?? 0, icon: ShieldAlert },
            {
              label: tAdmin.hiddenComments,
              value: overview?.flaggedCommentCount ?? 0,
              icon: MessageSquareWarning,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {formatCompactNumber(item.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="reports">{tAdmin.reports}</TabsTrigger>
            <TabsTrigger value="tracks">{tAdmin.tracks}</TabsTrigger>
            <TabsTrigger value="comments">{tAdmin.comments}</TabsTrigger>
            <TabsTrigger value="playlists">{tAdmin.playlists}</TabsTrigger>
            <TabsTrigger value="users">{tAdmin.users}</TabsTrigger>
            <TabsTrigger value="audit">{tAdmin.auditLogs}</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.reportsQueue}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportsQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : reportsQuery.isError ? (
                  <QueryErrorState
                    label={tAdmin.reports}
                    onRetry={() => void reportsQuery.refetch()}
                  />
                ) : reportsQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {reportsQuery.data.data.map((report) => (
                        <AdminReportCard key={report.id} report={report} />
                      ))}
                    </div>
                    <PaginationControls
                      page={reportsPage}
                      hasPrev={getHasPreviousPage(reportsQuery.data.meta)}
                      hasNext={getHasNextPage(reportsQuery.data.meta)}
                      isPending={reportsQuery.isFetching}
                      onPageChange={setReportsPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noReports} description={tAdmin.noReports} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracks">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.trackModeration}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tracksQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : tracksQuery.isError ? (
                  <QueryErrorState
                    label={tAdmin.tracks}
                    onRetry={() => void tracksQuery.refetch()}
                  />
                ) : tracksQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {tracksQuery.data.data.map((track) => (
                        <AdminTrackCard key={track.id} track={track} />
                      ))}
                    </div>
                    <PaginationControls
                      page={tracksPage}
                      hasPrev={getHasPreviousPage(tracksQuery.data.meta)}
                      hasNext={getHasNextPage(tracksQuery.data.meta)}
                      isPending={tracksQuery.isFetching}
                      onPageChange={setTracksPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noData} description={tAdmin.noData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.commentModeration}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {commentsQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : commentsQuery.isError ? (
                  <QueryErrorState
                    label={tAdmin.comments}
                    onRetry={() => void commentsQuery.refetch()}
                  />
                ) : commentsQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {commentsQuery.data.data.map((comment) => (
                        <AdminCommentCard key={comment.id} comment={comment} />
                      ))}
                    </div>
                    <PaginationControls
                      page={commentsPage}
                      hasPrev={getHasPreviousPage(commentsQuery.data.meta)}
                      hasNext={getHasNextPage(commentsQuery.data.meta)}
                      isPending={commentsQuery.isFetching}
                      onPageChange={setCommentsPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noData} description={tAdmin.noData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.playlistModeration}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {playlistsQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : playlistsQuery.isError ? (
                  <QueryErrorState
                    label={tAdmin.playlists}
                    onRetry={() => void playlistsQuery.refetch()}
                  />
                ) : playlistsQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {playlistsQuery.data.data.map((playlist) => (
                        <AdminPlaylistCard key={playlist.id} playlist={playlist} />
                      ))}
                    </div>
                    <PaginationControls
                      page={playlistsPage}
                      hasPrev={getHasPreviousPage(playlistsQuery.data.meta)}
                      hasNext={getHasNextPage(playlistsQuery.data.meta)}
                      isPending={playlistsQuery.isFetching}
                      onPageChange={setPlaylistsPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noData} description={tAdmin.noData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.userRoles}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {usersQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : usersQuery.isError ? (
                  <QueryErrorState label={tAdmin.users} onRetry={() => void usersQuery.refetch()} />
                ) : usersQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {usersQuery.data.data.map((user) => (
                        <AdminUserCard key={user.id} user={user} />
                      ))}
                    </div>
                    <PaginationControls
                      page={usersPage}
                      hasPrev={getHasPreviousPage(usersQuery.data.meta)}
                      hasNext={getHasNextPage(usersQuery.data.meta)}
                      isPending={usersQuery.isFetching}
                      onPageChange={setUsersPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noData} description={tAdmin.noData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>{tAdmin.auditLogs}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {auditQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-md" />
                  ))
                ) : auditQuery.isError ? (
                  <QueryErrorState
                    label={tAdmin.auditLogs}
                    onRetry={() => void auditQuery.refetch()}
                  />
                ) : auditQuery.data?.data.length ? (
                  <>
                    <div className="space-y-2">
                      {auditQuery.data.data.map((log) => (
                        <AdminAuditLogCard key={log.id} log={log} />
                      ))}
                    </div>
                    <PaginationControls
                      page={auditPage}
                      hasPrev={getHasPreviousPage(auditQuery.data.meta)}
                      hasNext={getHasNextPage(auditQuery.data.meta)}
                      isPending={auditQuery.isFetching}
                      onPageChange={setAuditPage}
                    />
                  </>
                ) : (
                  <EmptyState title={tAdmin.noData} description={tAdmin.noData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

export default function AdminPage() {
  return (
    <React.Suspense fallback={<AdminSkeleton />}>
      <AdminPageContent />
    </React.Suspense>
  );
}
