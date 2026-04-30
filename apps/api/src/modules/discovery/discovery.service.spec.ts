import { TrackPrivacy, TrackStatus, UserRole } from '@wavestream/shared';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  const createSearchQueryBuilder = (result: unknown[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
  });

  it('builds featured artists from creators that have public published tracks', async () => {
    const featuredArtistsQuery = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'artist-1',
          username: 'solis-kim',
          displayName: 'Solis Kim',
          role: UserRole.CREATOR,
          isVerified: true,
          followerCount: 3,
          followingCount: 0,
          trackCount: 8,
          playlistCount: 1,
          profile: null,
          createdAt: new Date('2026-04-10T00:00:00.000Z'),
        },
      ]),
    };
    const tracksRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(featuredArtistsQuery),
    };
    const playlistsRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const genresRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const service = new DiscoveryService(
      tracksRepository as never,
      usersRepository as never,
      playlistsRepository as never,
      genresRepository as never,
    );

    const result = await service.getHomeFeed();

    expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(featuredArtistsQuery.innerJoin).toHaveBeenCalledWith(
      'user.tracks',
      'publicTrack',
      'publicTrack.deletedAt IS NULL AND publicTrack.status = :trackStatus AND publicTrack.privacy = :trackPrivacy',
      {
        trackStatus: TrackStatus.PUBLISHED,
        trackPrivacy: TrackPrivacy.PUBLIC,
      },
    );
    expect(featuredArtistsQuery.where).toHaveBeenCalledWith('user.role = :role', {
      role: UserRole.CREATOR,
    });
    expect(featuredArtistsQuery.andWhere).toHaveBeenCalledWith('user.deletedAt IS NULL');
    expect(result.featuredArtists).toHaveLength(1);
    expect(result.featuredArtists[0]).toMatchObject({
      username: 'solis-kim',
      displayName: 'Solis Kim',
    });
  });

  it('uses guest-safe public filters for anonymous search results', async () => {
    const trackQuery = createSearchQueryBuilder();
    const artistQuery = createSearchQueryBuilder();
    const playlistQuery = createSearchQueryBuilder();
    const genreQuery = createSearchQueryBuilder();
    const tracksRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(trackQuery),
    };
    const usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(artistQuery),
    };
    const playlistsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(playlistQuery),
    };
    const genresRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(genreQuery),
    };

    const service = new DiscoveryService(
      tracksRepository as never,
      usersRepository as never,
      playlistsRepository as never,
      genresRepository as never,
    );

    await service.search('ambient');

    expect(trackQuery.andWhere).toHaveBeenCalledWith(
      'track.deletedAt IS NULL AND track.status = :status AND track.privacy = :privacy',
      {
        status: TrackStatus.PUBLISHED,
        privacy: TrackPrivacy.PUBLIC,
      },
    );
    expect(playlistQuery.andWhere).toHaveBeenCalledWith(
      'playlist.deletedAt IS NULL AND playlist.isPublic = true',
      {},
    );
  });
});
