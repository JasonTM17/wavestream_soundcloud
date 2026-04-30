import { TrackPrivacy, TrackStatus } from '@wavestream/shared';
import { TracksService } from './tracks.service';

jest.mock(
  'music-metadata',
  () => ({
    parseBuffer: jest.fn(),
  }),
  { virtual: true },
);

describe('TracksService', () => {
  const createQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  });

  const createService = () => {
    const tracksQueryBuilder = createQueryBuilder();
    const tracksRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(tracksQueryBuilder),
    };

    const service = new TracksService(
      tracksRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    return { service, tracksRepository, tracksQueryBuilder };
  };

  it('uses public-only filters for anonymous track listings', async () => {
    const { service, tracksQueryBuilder } = createService();

    await service.listTracks({ genre: 'ambient', limit: 24 });

    expect(tracksQueryBuilder.andWhere).toHaveBeenCalledWith('track.deletedAt IS NULL');
    expect(tracksQueryBuilder.andWhere).toHaveBeenCalledWith('genre.slug = :genre', {
      genre: 'ambient',
    });
    expect(tracksQueryBuilder.andWhere).toHaveBeenCalledWith(
      'track.status = :published AND track.privacy = :public',
      {
        published: TrackStatus.PUBLISHED,
        public: TrackPrivacy.PUBLIC,
      },
    );
  });

  it('returns an empty page when the artist id is invalid', async () => {
    const { service, tracksRepository } = createService();

    const result = await service.listTracks({ artistId: 'not-a-uuid', page: 2, limit: 12 });

    expect(result.data).toEqual([]);
    expect(result.meta).toMatchObject({
      page: 2,
      limit: 12,
      total: 0,
      hasNext: false,
      hasPrev: true,
    });
    expect(tracksRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
