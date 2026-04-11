import {
  AdminActionType,
  NotificationType,
  ReportStatus,
  ReportableType,
  TrackStatus,
  UserRole,
} from '@wavestream/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  createPaginationMeta,
  normalizePagination,
} from 'src/common/utils/pagination.util';
import { sanitizePlainText } from 'src/common/utils/text.util';
import { AuditLogEntity } from 'src/database/entities/audit-log.entity';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { ReportEntity } from 'src/database/entities/report.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { ModerationNoteDto } from 'src/modules/admin/dto/moderation-note.dto';
import { ResolveReportDto } from 'src/modules/admin/dto/resolve-report.dto';
import { UpdateUserRoleDto } from 'src/modules/admin/dto/update-user-role.dto';
import { buildAdminReportTargetPreview } from 'src/modules/admin/admin-report-target.mapper';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistsRepository: Repository<PlaylistEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogsRepository: Repository<AuditLogEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOverview() {
    const [
      userCount,
      trackCount,
      playlistCount,
      reportCount,
      flaggedCommentCount,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.tracksRepository.count(),
      this.playlistsRepository.count(),
      this.reportsRepository.count({
        where: { status: ReportStatus.PENDING },
      }),
      this.commentsRepository.count({
        where: { isHidden: true },
      }),
    ]);

    return {
      userCount,
      trackCount,
      playlistCount,
      reportCount,
      flaggedCommentCount,
    };
  }

  async listUsers(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.usersRepository.findAndCount({
      relations: { profile: true },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
      withDeleted: true,
    });

    return {
      data: items.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        trackCount: user.trackCount,
        playlistCount: user.playlistCount,
        deletedAt: user.deletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listTracks(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.tracksRepository.findAndCount({
      relations: {
        artist: { profile: true },
        genre: true,
        tags: true,
        file: true,
      },
      order: { updatedAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
      withDeleted: true,
    });

    return {
      data: items.map((track) => ({
        id: track.id,
        title: track.title,
        artistId: track.artistId,
        artistName: track.artist.displayName,
        status: track.status,
        privacy: track.privacy,
        playCount: track.playCount,
        likeCount: track.likeCount,
        repostCount: track.repostCount,
        commentCount: track.commentCount,
        hiddenReason: track.hiddenReason,
        deletedAt: track.deletedAt?.toISOString() ?? null,
        updatedAt: track.updatedAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listPlaylists(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.playlistsRepository.findAndCount({
      relations: { owner: { profile: true } },
      order: { updatedAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
      withDeleted: true,
    });

    return {
      data: items.map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        ownerId: playlist.ownerId,
        ownerName: playlist.owner.displayName,
        isPublic: playlist.isPublic,
        trackCount: playlist.trackCount,
        totalDuration: playlist.totalDuration,
        deletedAt: playlist.deletedAt?.toISOString() ?? null,
        updatedAt: playlist.updatedAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listComments(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.commentsRepository.findAndCount({
      relations: { user: { profile: true }, track: true },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
      withDeleted: true,
    });

    return {
      data: items.map((comment) => ({
        id: comment.id,
        body: comment.body,
        userId: comment.userId,
        username: comment.user.username,
        trackId: comment.trackId,
        trackTitle: comment.track.title,
        isHidden: comment.isHidden,
        deletedAt: comment.deletedAt?.toISOString() ?? null,
        createdAt: comment.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listReports(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.reportsRepository.findAndCount({
      relations: { reporter: { profile: true }, resolvedBy: { profile: true } },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    const trackIds = new Set<string>();
    const playlistIds = new Set<string>();
    const userIds = new Set<string>();
    const commentIds = new Set<string>();

    for (const report of items) {
      if (report.reportableType === ReportableType.TRACK) {
        trackIds.add(report.reportableId);
      } else if (report.reportableType === ReportableType.PLAYLIST) {
        playlistIds.add(report.reportableId);
      } else if (report.reportableType === ReportableType.USER) {
        userIds.add(report.reportableId);
      } else if (report.reportableType === ReportableType.COMMENT) {
        commentIds.add(report.reportableId);
      }
    }

    const comments = await this.findCommentsByIds(commentIds);
    for (const comment of comments) {
      trackIds.add(comment.trackId);
    }

    const [tracks, playlists, users] = await Promise.all([
      this.findTracksByIds(trackIds),
      this.findPlaylistsByIds(playlistIds),
      this.findUsersByIds(userIds),
    ]);

    const trackMap = new Map(tracks.map((track) => [track.id, track]));
    const playlistMap = new Map(
      playlists.map((playlist) => [playlist.id, playlist]),
    );
    const userMap = new Map(users.map((user) => [user.id, user]));
    const commentMap = new Map(
      comments.map((comment) => [comment.id, comment]),
    );

    return {
      data: items.map((report) => ({
        id: report.id,
        reportableType: report.reportableType,
        reportableId: report.reportableId,
        target: buildAdminReportTargetPreview({
          report,
          tracks: trackMap,
          playlists: playlistMap,
          users: userMap,
          comments: commentMap,
        }),
        reason: report.reason,
        details: report.details,
        status: report.status,
        reporter: report.reporter.username,
        resolvedBy: report.resolvedBy?.username ?? null,
        createdAt: report.createdAt.toISOString(),
        resolvedAt: report.resolvedAt?.toISOString() ?? null,
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  private async findTracksByIds(ids: Set<string>) {
    if (ids.size === 0) {
      return [];
    }

    return this.tracksRepository.find({
      where: { id: In([...ids]) },
      relations: { artist: { profile: true } },
      withDeleted: true,
    });
  }

  private async findPlaylistsByIds(ids: Set<string>) {
    if (ids.size === 0) {
      return [];
    }

    return this.playlistsRepository.find({
      where: { id: In([...ids]) },
      relations: { owner: { profile: true } },
      withDeleted: true,
    });
  }

  private async findUsersByIds(ids: Set<string>) {
    if (ids.size === 0) {
      return [];
    }

    return this.usersRepository.find({
      where: { id: In([...ids]) },
      relations: { profile: true },
      withDeleted: true,
    });
  }

  private async findCommentsByIds(ids: Set<string>) {
    if (ids.size === 0) {
      return [];
    }

    return this.commentsRepository.find({
      where: { id: In([...ids]) },
      withDeleted: true,
    });
  }

  async listAuditLogs(page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.auditLogsRepository.findAndCount({
      relations: { admin: { profile: true } },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data: items.map((log) => ({
        id: log.id,
        admin: log.admin.username,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async hideTrack(admin: UserEntity, trackId: string, dto: ModerationNoteDto) {
    const track = await this.tracksRepository.findOneBy({ id: trackId });
    if (!track) {
      throw new NotFoundException('Track not found');
    }

    track.status = TrackStatus.HIDDEN;
    track.hiddenReason = sanitizePlainText(dto.reason) ?? null;
    await this.tracksRepository.save(track);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.HIDE_TRACK,
      'track',
      track.id,
      {
        reason: track.hiddenReason,
      },
    );

    return { hidden: true };
  }

  async restoreTrack(admin: UserEntity, trackId: string) {
    const track = await this.tracksRepository.findOneBy({ id: trackId });
    if (!track) {
      throw new NotFoundException('Track not found');
    }

    track.status = TrackStatus.PUBLISHED;
    track.hiddenReason = null;
    await this.tracksRepository.save(track);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.RESTORE_TRACK,
      'track',
      track.id,
      null,
    );

    return { hidden: false };
  }

  async hideComment(
    admin: UserEntity,
    commentId: string,
    dto: ModerationNoteDto,
  ) {
    const comment = await this.commentsRepository.findOneBy({ id: commentId });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.isHidden = true;
    await this.commentsRepository.save(comment);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.HIDE_COMMENT,
      'comment',
      comment.id,
      { reason: sanitizePlainText(dto.reason) ?? null },
    );

    return { hidden: true };
  }

  async restoreComment(admin: UserEntity, commentId: string) {
    const comment = await this.commentsRepository.findOneBy({ id: commentId });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.isHidden = false;
    await this.commentsRepository.save(comment);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.RESTORE_COMMENT,
      'comment',
      comment.id,
      null,
    );

    return { hidden: false };
  }

  async deletePlaylist(
    admin: UserEntity,
    playlistId: string,
    dto: ModerationNoteDto,
  ) {
    const playlist = await this.playlistsRepository.findOne({
      where: { id: playlistId },
      withDeleted: true,
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (!playlist.deletedAt) {
      await this.playlistsRepository.softDelete(playlist.id);
    }

    await this.writeAuditLog(
      admin.id,
      AdminActionType.DELETE_PLAYLIST,
      'playlist',
      playlist.id,
      { reason: sanitizePlainText(dto.reason) ?? null },
    );

    return { deleted: true };
  }

  async updateUserRole(
    admin: UserEntity,
    userId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (admin.id === userId && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot remove your own admin role');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = dto.role;
    await this.usersRepository.save(user);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.UPDATE_USER_ROLE,
      'user',
      user.id,
      { role: dto.role },
    );

    return { id: user.id, role: user.role };
  }

  async resolveReport(
    admin: UserEntity,
    reportId: string,
    dto: ResolveReportDto,
  ) {
    if (
      ![
        ReportStatus.RESOLVED,
        ReportStatus.DISMISSED,
        ReportStatus.REVIEWED,
      ].includes(dto.status)
    ) {
      throw new BadRequestException('Unsupported report status');
    }

    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: { reporter: { profile: true } },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = dto.status;
    report.resolvedById = admin.id;
    report.resolvedAt = new Date();
    await this.reportsRepository.save(report);

    await this.writeAuditLog(
      admin.id,
      AdminActionType.RESOLVE_REPORT,
      'report',
      report.id,
      { status: dto.status, note: sanitizePlainText(dto.note) ?? null },
    );

    await this.notificationsService.createNotification(
      report.reporterId,
      NotificationType.REPORT_UPDATE,
      {
        reportId: report.id,
        status: report.status,
        reportableType: report.reportableType,
        reportableId: report.reportableId,
      },
    );

    return {
      id: report.id,
      status: report.status,
      resolvedAt: report.resolvedAt.toISOString(),
    };
  }

  private async writeAuditLog(
    adminId: string,
    action: AdminActionType,
    entityType: string,
    entityId: string,
    details: Record<string, unknown> | null,
  ) {
    await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        adminId,
        action,
        entityType,
        entityId,
        details,
      }),
    );
  }
}
