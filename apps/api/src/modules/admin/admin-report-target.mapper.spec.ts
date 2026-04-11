import { ReportableType, UserRole } from '@wavestream/shared';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { buildAdminReportTargetPreview } from 'src/modules/admin/admin-report-target.mapper';

describe('buildAdminReportTargetPreview', () => {
  const baseMaps = () => {
    const tracks = new Map<string, TrackEntity>();
    const playlists = new Map<string, PlaylistEntity>();
    const users = new Map<string, UserEntity>();
    const comments = new Map<string, CommentEntity>();

    return { tracks, playlists, users, comments };
  };

  it('builds a track preview with a deep link and status', () => {
    const maps = baseMaps();
    maps.tracks.set('track-1', {
      id: 'track-1',
      title: 'Night Drive',
      slug: 'night-drive',
      status: 'published',
      deletedAt: null,
      artist: {
        id: 'user-1',
        displayName: 'Aster',
      } as UserEntity,
    } as TrackEntity);

    expect(
      buildAdminReportTargetPreview({
        report: {
          reportableId: 'track-1',
          reportableType: ReportableType.TRACK,
        },
        ...maps,
      }),
    ).toEqual({
      label: 'Night Drive',
      secondaryLabel: 'by Aster',
      href: '/track/night-drive',
      status: 'published',
    });
  });

  it('builds playlist, user, and comment previews from existing relations', () => {
    const maps = baseMaps();
    const commentBody =
      'This mix is absolutely huge and really polished from start to finish.';
    maps.playlists.set('playlist-1', {
      id: 'playlist-1',
      title: 'Late Night Set',
      slug: 'late-night-set',
      isPublic: false,
      deletedAt: null,
      owner: {
        id: 'user-2',
        displayName: 'Nova',
      } as UserEntity,
    } as PlaylistEntity);
    maps.users.set('user-3', {
      id: 'user-3',
      username: 'orbit',
      displayName: 'Orbit',
      role: UserRole.CREATOR,
      deletedAt: null,
    } as UserEntity);
    maps.tracks.set('track-2', {
      id: 'track-2',
      title: 'Solar Tide',
      slug: 'solar-tide',
      status: 'published',
      deletedAt: null,
      artist: {
        id: 'user-4',
        displayName: 'Pulse',
      } as UserEntity,
    } as TrackEntity);
    maps.comments.set('comment-1', {
      id: 'comment-1',
      body: commentBody,
      trackId: 'track-2',
      isHidden: false,
      deletedAt: null,
    } as CommentEntity);

    expect(
      buildAdminReportTargetPreview({
        report: {
          reportableId: 'playlist-1',
          reportableType: ReportableType.PLAYLIST,
        },
        ...maps,
      }),
    ).toEqual({
      label: 'Late Night Set',
      secondaryLabel: 'by Nova',
      href: '/playlist/late-night-set',
      status: 'private',
    });

    expect(
      buildAdminReportTargetPreview({
        report: {
          reportableId: 'user-3',
          reportableType: ReportableType.USER,
        },
        ...maps,
      }),
    ).toEqual({
      label: 'Orbit',
      secondaryLabel: '@orbit',
      href: '/artist/orbit',
      status: 'creator',
    });

    expect(
      buildAdminReportTargetPreview({
        report: {
          reportableId: 'comment-1',
          reportableType: ReportableType.COMMENT,
        },
        ...maps,
      }),
    ).toEqual({
      label: commentBody,
      secondaryLabel: 'on Solar Tide',
      href: '/track/solar-tide',
      status: 'visible',
    });
  });

  it('falls back safely when the reported target no longer exists', () => {
    expect(
      buildAdminReportTargetPreview({
        report: {
          reportableId: 'missing-track',
          reportableType: ReportableType.TRACK,
        },
        ...baseMaps(),
      }),
    ).toEqual({
      label: 'Deleted track',
      secondaryLabel: 'Target no longer exists',
      href: null,
      status: 'missing',
    });
  });
});
