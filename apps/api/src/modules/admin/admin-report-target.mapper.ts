import { ReportableType } from '@wavestream/shared';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { ReportEntity } from 'src/database/entities/report.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

export interface AdminReportTargetPreview {
  label: string;
  secondaryLabel?: string | null;
  href?: string | null;
  status?: string | null;
}

interface BuildReportTargetPreviewInput {
  report: Pick<ReportEntity, 'reportableId' | 'reportableType'>;
  tracks: Map<string, TrackEntity>;
  playlists: Map<string, PlaylistEntity>;
  users: Map<string, UserEntity>;
  comments: Map<string, CommentEntity>;
}

const fallbackPreview = (reportableType: ReportableType): AdminReportTargetPreview => {
  const baseLabel = {
    [ReportableType.TRACK]: 'Deleted track',
    [ReportableType.PLAYLIST]: 'Deleted playlist',
    [ReportableType.USER]: 'Deleted user',
    [ReportableType.COMMENT]: 'Deleted comment',
  }[reportableType];

  return {
    label: baseLabel,
    secondaryLabel: 'Target no longer exists',
    href: null,
    status: 'missing',
  };
};

const excerptText = (value: string, maxLength = 72) => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

export const buildAdminReportTargetPreview = ({
  report,
  tracks,
  playlists,
  users,
  comments,
}: BuildReportTargetPreviewInput): AdminReportTargetPreview => {
  switch (report.reportableType) {
    case ReportableType.TRACK: {
      const track = tracks.get(report.reportableId);
      if (!track) {
        return fallbackPreview(ReportableType.TRACK);
      }

      return {
        label: track.title,
        secondaryLabel: track.artist ? `by ${track.artist.displayName}` : null,
        href: `/track/${track.slug}`,
        status: track.deletedAt ? 'deleted' : track.status,
      };
    }

    case ReportableType.PLAYLIST: {
      const playlist = playlists.get(report.reportableId);
      if (!playlist) {
        return fallbackPreview(ReportableType.PLAYLIST);
      }

      return {
        label: playlist.title,
        secondaryLabel: playlist.owner ? `by ${playlist.owner.displayName}` : null,
        href: `/playlist/${playlist.slug}`,
        status: playlist.deletedAt ? 'deleted' : playlist.isPublic ? 'public' : 'private',
      };
    }

    case ReportableType.USER: {
      const user = users.get(report.reportableId);
      if (!user) {
        return fallbackPreview(ReportableType.USER);
      }

      return {
        label: user.displayName,
        secondaryLabel: `@${user.username}`,
        href: `/artist/${user.username}`,
        status: user.deletedAt ? 'deleted' : user.role,
      };
    }

    case ReportableType.COMMENT: {
      const comment = comments.get(report.reportableId);
      if (!comment) {
        return fallbackPreview(ReportableType.COMMENT);
      }

      const track = tracks.get(comment.trackId);
      return {
        label: excerptText(comment.body),
        secondaryLabel: track ? `on ${track.title}` : 'Parent track unavailable',
        href: track ? `/track/${track.slug}` : null,
        status: comment.deletedAt ? 'deleted' : comment.isHidden ? 'hidden' : 'visible',
      };
    }
  }
};
