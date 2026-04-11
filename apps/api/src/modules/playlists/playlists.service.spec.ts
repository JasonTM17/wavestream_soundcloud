import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@wavestream/shared';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  const createService = () => {
    const playlistsRepository = {
      findOne: jest.fn(),
      softDelete: jest.fn(),
    };
    const playlistTracksRepository = {
      find: jest.fn(),
      update: jest.fn(),
    };
    const tracksRepository = {};
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
});
