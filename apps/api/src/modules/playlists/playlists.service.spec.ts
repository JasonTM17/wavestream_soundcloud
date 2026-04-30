import { ForbiddenException } from '@nestjs/common';
import { TrackPrivacy, TrackStatus, UserRole } from '@wavestream/shared';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const owner = {
    id: 'user-1',
    email: 'owner@example.com',
    username: 'owner',
    displayName: 'Owner',
    role: UserRole.CREATOR,
    isVerified: false,
    followerCount: 0,
    followingCount: 0,
    trackCount: 0,
    playlistCount: 2,
    profile: null,
    createdAt: now,
  };
  const makeTrack = (overrides: Record<string, unknown> = {}) => ({
    id: 'track-1',
    slug: 'track-1',
    title: 'Track 1',
    description: null,
    coverUrl: null,
    duration: 180,
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: false,
    commentsEnabled: true,
    playCount: 0,
    likeCount: 0,
    repostCount: 0,
    commentCount: 0,
    genre: null,
    tags: [],
    file: null,
    artistId: owner.id,
    artist: owner,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const createService = () => {
    const playlistsRepository = {
      findOne: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const playlistTracksRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };
    const tracksRepository = {
      findOne: jest.fn(),
    };
    const usersRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const service = new PlaylistsService(
      playlistsRepository as never,
      playlistTracksRepository as never,
      tracksRepository as never,
      usersRepository as never,
    );

    return {
      service,
      playlistsRepository,
      playlistTracksRepository,
      tracksRepository,
      usersRepository,
    };
  };

  it('rejects reorder requests that do not match the playlist items', async () => {
    const { service, playlistsRepository, playlistTracksRepository } = createService();
    const owner = {
      id: 'user-1',
      role: UserRole.CREATOR,
    };

    playlistsRepository.findOne.mockResolvedValue({
      id: 'playlist-1',
      ownerId: owner.id,
      isPublic: true,
      deletedAt: null,
      owner: {
        id: owner.id,
        username: 'owner',
        displayName: 'Owner',
        profile: null,
      },
      tracks: [],
    });
    playlistTracksRepository.find.mockResolvedValue([
      { playlistId: 'playlist-1', trackId: 'track-1', position: 1 },
      { playlistId: 'playlist-1', trackId: 'track-2', position: 2 },
    ]);

    await expect(
      service.reorderTracks('playlist-1', owner as never, {
        trackIds: ['track-1', 'track-3'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(playlistTracksRepository.update).not.toHaveBeenCalled();
  });

  it('soft deletes the playlist and decrements the owner count', async () => {
    const { service, playlistsRepository, usersRepository } = createService();
    const owner = {
      id: 'user-1',
      role: UserRole.CREATOR,
      playlistCount: 2,
    };

    playlistsRepository.findOne.mockResolvedValue({
      id: 'playlist-1',
      ownerId: owner.id,
      isPublic: true,
      deletedAt: null,
      owner: {
        id: owner.id,
        username: 'owner',
        displayName: 'Owner',
        profile: null,
      },
      tracks: [],
    });
    usersRepository.findOneBy.mockResolvedValue(owner);

    await expect(service.deletePlaylist('playlist-1', owner as never)).resolves.toEqual({
      deleted: true,
    });

    expect(playlistsRepository.softDelete).toHaveBeenCalledWith('playlist-1');
    expect(usersRepository.save).toHaveBeenCalledWith({
      ...owner,
      playlistCount: 1,
    });
  });

  it('filters non-public tracks from public playlist responses for anonymous viewers', async () => {
    const { service, playlistsRepository } = createService();
    const publicTrack = makeTrack({ id: 'track-public', slug: 'track-public', duration: 180 });
    const privateTrack = makeTrack({
      id: 'track-private',
      slug: 'track-private',
      duration: 240,
      privacy: TrackPrivacy.PRIVATE,
    });

    playlistsRepository.findOne.mockResolvedValue({
      id: 'playlist-1',
      slug: 'playlist-1',
      title: 'Playlist',
      description: null,
      coverUrl: null,
      ownerId: owner.id,
      isPublic: true,
      trackCount: 2,
      totalDuration: 420,
      deletedAt: null,
      owner,
      tracks: [
        { id: 'entry-1', position: 1, createdAt: now, track: publicTrack },
        { id: 'entry-2', position: 2, createdAt: now, track: privateTrack },
      ],
      createdAt: now,
      updatedAt: now,
    });

    const playlist = await service.getPlaylist('playlist-1');

    expect(playlist.tracks).toHaveLength(1);
    expect(playlist.tracks?.[0]?.track.id).toBe(publicTrack.id);
    expect(playlist.trackCount).toBe(1);
    expect(playlist.totalDuration).toBe(publicTrack.duration);
  });

  it('rejects private tracks added to public playlists', async () => {
    const { service, playlistsRepository, playlistTracksRepository, tracksRepository } =
      createService();

    playlistsRepository.findOne.mockResolvedValue({
      id: 'playlist-1',
      slug: 'playlist-1',
      title: 'Playlist',
      description: null,
      coverUrl: null,
      ownerId: owner.id,
      isPublic: true,
      trackCount: 0,
      totalDuration: 0,
      deletedAt: null,
      owner,
      tracks: [],
      createdAt: now,
      updatedAt: now,
    });
    tracksRepository.findOne.mockResolvedValue(
      makeTrack({ id: 'track-private', privacy: TrackPrivacy.PRIVATE }),
    );

    await expect(
      service.addTrack('playlist-1', owner as never, { trackId: 'track-private' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(playlistTracksRepository.save).not.toHaveBeenCalled();
  });

  it('uses public-only filters for anonymous playlist listings', async () => {
    const { service, playlistsRepository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    playlistsRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);

    await service.listPlaylists(1, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('playlist.deletedAt IS NULL');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('playlist.isPublic = true');
  });
});
