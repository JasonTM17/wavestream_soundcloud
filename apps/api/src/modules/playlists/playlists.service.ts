import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackPrivacy, TrackStatus, UserRole } from '@wavestream/shared';
import { Repository } from 'typeorm';
import { isUuid } from 'src/common/utils/is-uuid.util';
import { mapPlaylist } from 'src/common/utils/mappers';
import { createPaginationMeta, normalizePagination } from 'src/common/utils/pagination.util';
import { createUniqueSlug } from 'src/common/utils/slug.util';
import { sanitizePlainText, sanitizeRichText } from 'src/common/utils/text.util';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { PlaylistTrackEntity } from 'src/database/entities/playlist-track.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { AddTrackDto } from 'src/modules/playlists/dto/add-track.dto';
import { CreatePlaylistDto } from 'src/modules/playlists/dto/create-playlist.dto';
import { ReorderPlaylistDto } from 'src/modules/playlists/dto/reorder-playlist.dto';
import { UpdatePlaylistDto } from 'src/modules/playlists/dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(PlaylistEntity)
    private readonly playlistsRepository: Repository<PlaylistEntity>,
    @InjectRepository(PlaylistTrackEntity)
    private readonly playlistTracksRepository: Repository<PlaylistTrackEntity>,
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async listPlaylists(page?: number, limit?: number, ownerId?: string, viewer?: UserEntity) {
    const pagination = normalizePagination({ page, limit });
    if (ownerId && !isUuid(ownerId)) {
      return {
        data: [],
        meta: createPaginationMeta(0, pagination.page, pagination.limit),
      };
    }

    const qb = this.playlistsRepository
      .createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.owner', 'owner')
      .leftJoinAndSelect('owner.profile', 'ownerProfile')
      .orderBy('playlist.updatedAt', 'DESC')
      .take(pagination.limit)
      .skip(pagination.skip);

    qb.andWhere('playlist.deletedAt IS NULL');

    if (ownerId) {
      qb.andWhere('playlist.ownerId = :ownerId', { ownerId });
    }

    if (viewer?.role === UserRole.ADMIN) {
      // Admins can inspect all non-deleted playlists.
    } else if (viewer) {
      qb.andWhere('(playlist.isPublic = true OR playlist.ownerId = :viewerId)', {
        viewerId: viewer.id,
      });
    } else {
      qb.andWhere('playlist.isPublic = true');
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((playlist) => mapPlaylist(playlist, false)),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listMyPlaylists(ownerId: string) {
    const owner = await this.usersRepository.findOneByOrFail({
      id: ownerId,
    });
    return this.listPlaylists(1, 50, ownerId, owner);
  }

  async getPlaylist(idOrSlug: string, viewer?: UserEntity) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertCanAccess(playlist, viewer);

    return mapPlaylist(this.getVisiblePlaylist(playlist, viewer));
  }

  async createPlaylist(owner: UserEntity, dto: CreatePlaylistDto) {
    const playlist = this.playlistsRepository.create({
      ownerId: owner.id,
      slug: createUniqueSlug(dto.title),
      title: sanitizePlainText(dto.title) ?? dto.title,
      description: sanitizeRichText(dto.description) ?? null,
      coverUrl: dto.coverUrl ?? null,
      isPublic: dto.isPublic ?? true,
      trackCount: 0,
      totalDuration: 0,
      owner,
    });
    const saved = await this.playlistsRepository.save(playlist);

    owner.playlistCount += 1;
    await this.usersRepository.save(owner);

    const fullPlaylist = await this.findPlaylistOrFail(saved.id);
    return mapPlaylist(fullPlaylist);
  }

  async updatePlaylist(idOrSlug: string, actor: UserEntity, dto: UpdatePlaylistDto) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertOwnership(playlist, actor);

    if (dto.isPublic === true) {
      this.assertPublicPlaylistCanExposeTracks(playlist);
    }

    if (dto.title) {
      playlist.title = sanitizePlainText(dto.title) ?? playlist.title;
    }
    if (dto.description !== undefined) {
      playlist.description = sanitizeRichText(dto.description) ?? null;
    }
    if (dto.coverUrl !== undefined) {
      playlist.coverUrl = dto.coverUrl ?? null;
    }
    if (dto.isPublic !== undefined) {
      playlist.isPublic = dto.isPublic;
    }

    await this.playlistsRepository.update(playlist.id, {
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      isPublic: playlist.isPublic,
    });
    const fullPlaylist = await this.findPlaylistOrFail(playlist.id);
    return mapPlaylist(fullPlaylist);
  }

  async deletePlaylist(idOrSlug: string, actor: UserEntity) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertOwnership(playlist, actor);

    await this.playlistsRepository.softDelete(playlist.id);
    const owner = await this.usersRepository.findOneBy({
      id: playlist.ownerId,
    });
    if (owner) {
      owner.playlistCount = Math.max(0, owner.playlistCount - 1);
      await this.usersRepository.save(owner);
    }

    return { deleted: true };
  }

  async addTrack(idOrSlug: string, actor: UserEntity, dto: AddTrackDto) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertOwnership(playlist, actor);

    const track = await this.tracksRepository.findOne({
      where: { id: dto.trackId },
      relations: {
        artist: { profile: true },
        genre: true,
        tags: true,
        file: true,
      },
    });

    if (!track || track.deletedAt) {
      throw new NotFoundException('Track not found');
    }
    this.assertTrackCanBeAdded(playlist, track, actor);

    const existing = await this.playlistTracksRepository.findOneBy({
      playlistId: playlist.id,
      trackId: track.id,
    });
    if (existing) {
      return mapPlaylist(playlist);
    }

    const position =
      (await this.playlistTracksRepository.count({
        where: { playlistId: playlist.id },
      })) + 1;

    await this.playlistTracksRepository.save(
      this.playlistTracksRepository.create({
        playlistId: playlist.id,
        trackId: track.id,
        position,
      }),
    );

    playlist.trackCount += 1;
    playlist.totalDuration += track.duration;
    if (!playlist.coverUrl) {
      playlist.coverUrl = track.coverUrl;
    }
    await this.playlistsRepository.update(playlist.id, {
      trackCount: playlist.trackCount,
      totalDuration: playlist.totalDuration,
      coverUrl: playlist.coverUrl,
    });

    const fullPlaylist = await this.findPlaylistOrFail(playlist.id);
    return mapPlaylist(fullPlaylist);
  }

  async removeTrack(idOrSlug: string, actor: UserEntity, trackId: string) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertOwnership(playlist, actor);

    const entry = await this.playlistTracksRepository.findOne({
      where: { playlistId: playlist.id, trackId },
      relations: { track: true },
    });

    if (!entry) {
      return mapPlaylist(playlist);
    }

    await this.playlistTracksRepository.remove(entry);
    playlist.trackCount = Math.max(0, playlist.trackCount - 1);
    playlist.totalDuration = Math.max(0, playlist.totalDuration - entry.track.duration);
    await this.playlistsRepository.update(playlist.id, {
      trackCount: playlist.trackCount,
      totalDuration: playlist.totalDuration,
    });

    const remaining = await this.playlistTracksRepository.find({
      where: { playlistId: playlist.id },
      order: { position: 'ASC' },
    });
    await Promise.all(
      remaining.map((item, index) =>
        this.playlistTracksRepository.update(item.id, {
          position: index + 1,
        }),
      ),
    );

    const fullPlaylist = await this.findPlaylistOrFail(playlist.id);
    return mapPlaylist(fullPlaylist);
  }

  async reorderTracks(idOrSlug: string, actor: UserEntity, dto: ReorderPlaylistDto) {
    const playlist = await this.findPlaylistOrFail(idOrSlug);
    this.assertOwnership(playlist, actor);

    const entries = await this.playlistTracksRepository.find({
      where: { playlistId: playlist.id },
    });
    const existingIds = new Set(entries.map((entry) => entry.trackId));

    if (
      dto.trackIds.length !== entries.length ||
      dto.trackIds.some((trackId) => !existingIds.has(trackId))
    ) {
      throw new ForbiddenException('Track order does not match playlist items');
    }

    await Promise.all(
      dto.trackIds.map((trackId, index) =>
        this.playlistTracksRepository.update(
          { playlistId: playlist.id, trackId },
          { position: index + 1 },
        ),
      ),
    );

    const fullPlaylist = await this.findPlaylistOrFail(playlist.id);
    return mapPlaylist(fullPlaylist);
  }

  private async findPlaylistOrFail(idOrSlug: string) {
    const playlist = await this.playlistsRepository.findOne({
      where: isUuid(idOrSlug) ? [{ id: idOrSlug }, { slug: idOrSlug }] : { slug: idOrSlug },
      relations: {
        owner: { profile: true },
        tracks: {
          track: {
            artist: { profile: true },
            genre: true,
            tags: true,
            file: true,
          },
        },
      },
      order: {
        tracks: {
          position: 'ASC',
        },
      },
    });

    if (!playlist || playlist.deletedAt) {
      throw new NotFoundException('Playlist not found');
    }

    return playlist;
  }

  private assertOwnership(playlist: PlaylistEntity, actor: UserEntity) {
    if (playlist.ownerId !== actor.id && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this playlist');
    }
  }

  private assertCanAccess(playlist: PlaylistEntity, viewer?: UserEntity) {
    const canAccess =
      playlist.isPublic || playlist.ownerId === viewer?.id || viewer?.role === UserRole.ADMIN;

    if (!canAccess) {
      throw new ForbiddenException('Playlist is private');
    }
  }

  private isPublicTrack(track?: TrackEntity | null) {
    if (!track) {
      return false;
    }

    return (
      !track.deletedAt &&
      track.status === TrackStatus.PUBLISHED &&
      track.privacy === TrackPrivacy.PUBLIC
    );
  }

  private getVisiblePlaylist(playlist: PlaylistEntity, viewer?: UserEntity) {
    const canSeePrivateEntries =
      viewer && (viewer.id === playlist.ownerId || viewer.role === UserRole.ADMIN);

    if (canSeePrivateEntries) {
      return playlist;
    }

    const tracks = (playlist.tracks ?? []).filter((entry) => this.isPublicTrack(entry.track));
    const totalDuration = tracks.reduce((sum, entry) => sum + entry.track.duration, 0);

    return {
      ...playlist,
      tracks,
      trackCount: tracks.length,
      totalDuration,
    } as PlaylistEntity;
  }

  private assertPublicPlaylistCanExposeTracks(playlist: PlaylistEntity) {
    const hasPrivateEntries = (playlist.tracks ?? []).some(
      (entry) => !this.isPublicTrack(entry.track),
    );

    if (hasPrivateEntries) {
      throw new ForbiddenException(
        'Private, draft, or hidden tracks cannot be exposed in a public playlist',
      );
    }
  }

  private assertTrackCanBeAdded(playlist: PlaylistEntity, track: TrackEntity, actor: UserEntity) {
    const canAccessTrack =
      this.isPublicTrack(track) || track.artistId === actor.id || actor.role === UserRole.ADMIN;

    if (!canAccessTrack) {
      throw new ForbiddenException('You cannot add this track to a playlist');
    }

    if (playlist.isPublic && !this.isPublicTrack(track)) {
      throw new ForbiddenException(
        'Private, draft, or hidden tracks cannot be added to a public playlist',
      );
    }
  }
}
