import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackPrivacy, TrackStatus, UserRole } from '@wavestream/shared';
import { Repository } from 'typeorm';
import {
  mapGenre,
  mapPlaylist,
  mapTrack,
  mapUser,
} from 'src/common/utils/mappers';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistsRepository: Repository<PlaylistEntity>,
    @InjectRepository(GenreEntity)
    private readonly genresRepository: Repository<GenreEntity>,
  ) {}

  async getHomeFeed(viewer?: UserEntity) {
    const publicTrackWhere = {
      status: TrackStatus.PUBLISHED,
      privacy: TrackPrivacy.PUBLIC,
    } as const;

    const [
      trending,
      newReleases,
      featuredArtists,
      popularPlaylists,
      recentUploads,
      genres,
      followingFeed,
    ] = await Promise.all([
      this.tracksRepository.find({
        where: publicTrackWhere,
        relations: {
          artist: { profile: true },
          genre: true,
          tags: true,
          file: true,
        },
        order: { playCount: 'DESC', likeCount: 'DESC', createdAt: 'DESC' },
        take: 8,
      }),
      this.tracksRepository.find({
        where: publicTrackWhere,
        relations: {
          artist: { profile: true },
          genre: true,
          tags: true,
          file: true,
        },
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.usersRepository.find({
        where: { role: UserRole.CREATOR },
        relations: { profile: true },
        order: { followerCount: 'DESC', trackCount: 'DESC', createdAt: 'DESC' },
        take: 6,
      }),
      this.playlistsRepository.find({
        where: { isPublic: true },
        relations: { owner: { profile: true } },
        order: { trackCount: 'DESC', updatedAt: 'DESC' },
        take: 6,
      }),
      this.tracksRepository.find({
        where: publicTrackWhere,
        relations: {
          artist: { profile: true },
          genre: true,
          tags: true,
          file: true,
        },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
      this.genresRepository.find({
        order: { name: 'ASC' },
        take: 20,
      }),
      viewer
        ? this.tracksRepository
            .createQueryBuilder('track')
            .leftJoinAndSelect('track.artist', 'artist')
            .leftJoinAndSelect('artist.profile', 'artistProfile')
            .leftJoinAndSelect('track.genre', 'genre')
            .leftJoinAndSelect('track.tags', 'tag')
            .leftJoinAndSelect('track.file', 'file')
            .innerJoin(
              'artist.followers',
              'follow',
              'follow.followerId = :viewerId',
              {
                viewerId: viewer.id,
              },
            )
            .where('track.status = :status', { status: TrackStatus.PUBLISHED })
            .andWhere('track.privacy = :privacy', {
              privacy: TrackPrivacy.PUBLIC,
            })
            .orderBy('track.createdAt', 'DESC')
            .take(8)
            .getMany()
        : Promise.resolve([]),
    ]);

    return {
      trending: trending.map((track) => mapTrack(track)),
      newReleases: newReleases.map((track) => mapTrack(track)),
      featuredArtists: featuredArtists.map((artist) => mapUser(artist)),
      popularPlaylists: popularPlaylists.map((playlist) =>
        mapPlaylist(playlist, false),
      ),
      recentUploads: recentUploads.map((track) => mapTrack(track)),
      genres: genres.map((genre) => mapGenre(genre)).filter(Boolean),
      followingFeed: followingFeed.map((track) => mapTrack(track)),
    };
  }

  async search(query: string | undefined, viewer?: UserEntity) {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery) {
      return {
        tracks: [],
        artists: [],
        playlists: [],
        genres: [],
      };
    }

    const searchTerm = `%${normalizedQuery}%`;

    const [tracks, artists, playlists, genres] = await Promise.all([
      this.tracksRepository
        .createQueryBuilder('track')
        .leftJoinAndSelect('track.artist', 'artist')
        .leftJoinAndSelect('artist.profile', 'artistProfile')
        .leftJoinAndSelect('track.genre', 'genre')
        .leftJoinAndSelect('track.tags', 'tag')
        .leftJoinAndSelect('track.file', 'file')
        .where(
          '(track.title ILIKE :term OR track.description ILIKE :term OR artist.displayName ILIKE :term OR artist.username ILIKE :term)',
          { term: searchTerm },
        )
        .andWhere(
          viewer?.role === UserRole.ADMIN
            ? 'track.deletedAt IS NULL'
            : 'track.deletedAt IS NULL AND ((track.status = :status AND track.privacy = :privacy) OR track.artistId = :viewerId)',
          {
            status: TrackStatus.PUBLISHED,
            privacy: TrackPrivacy.PUBLIC,
            viewerId: viewer?.id ?? '',
          },
        )
        .orderBy('track.playCount', 'DESC')
        .take(10)
        .getMany(),
      this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('(user.displayName ILIKE :term OR user.username ILIKE :term)', {
          term: searchTerm,
        })
        .orderBy('user.followerCount', 'DESC')
        .addOrderBy('user.trackCount', 'DESC')
        .take(10)
        .getMany(),
      this.playlistsRepository
        .createQueryBuilder('playlist')
        .leftJoinAndSelect('playlist.owner', 'owner')
        .leftJoinAndSelect('owner.profile', 'ownerProfile')
        .where(
          '(playlist.title ILIKE :term OR playlist.description ILIKE :term)',
          {
            term: searchTerm,
          },
        )
        .andWhere(
          viewer?.role === UserRole.ADMIN
            ? 'playlist.deletedAt IS NULL'
            : 'playlist.deletedAt IS NULL AND (playlist.isPublic = true OR playlist.ownerId = :viewerId)',
          { viewerId: viewer?.id ?? '' },
        )
        .orderBy('playlist.updatedAt', 'DESC')
        .take(10)
        .getMany(),
      this.genresRepository
        .createQueryBuilder('genre')
        .where('genre.name ILIKE :term OR genre.slug ILIKE :term', {
          term: searchTerm,
        })
        .orderBy('genre.name', 'ASC')
        .take(10)
        .getMany(),
    ]);

    return {
      tracks: tracks.map((track) => mapTrack(track)),
      artists: artists.map((artist) => mapUser(artist)),
      playlists: playlists.map((playlist) => mapPlaylist(playlist, false)),
      genres: genres.map((genre) => mapGenre(genre)).filter(Boolean),
    };
  }

  async getGenres() {
    const genres = await this.genresRepository.find({
      order: { name: 'ASC' },
    });

    return genres.map((genre) => mapGenre(genre)).filter(Boolean);
  }

  async getRelatedTracksById(idOrSlug: string) {
    const track = await this.tracksRepository.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
    });

    if (!track) {
      return [];
    }

    const qb = this.tracksRepository
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.artist', 'artist')
      .leftJoinAndSelect('artist.profile', 'artistProfile')
      .leftJoinAndSelect('track.genre', 'genre')
      .leftJoinAndSelect('track.tags', 'tag')
      .leftJoinAndSelect('track.file', 'file')
      .where('track.id != :trackId', { trackId: track.id })
      .andWhere('track.deletedAt IS NULL')
      .andWhere('track.status = :status', { status: TrackStatus.PUBLISHED })
      .andWhere('track.privacy = :privacy', { privacy: TrackPrivacy.PUBLIC });

    if (track.genreId) {
      qb.andWhere('(track.genreId = :genreId OR track.artistId = :artistId)', {
        genreId: track.genreId,
        artistId: track.artistId,
      });
    } else {
      qb.andWhere('track.artistId = :artistId', { artistId: track.artistId });
    }

    const items = await qb
      .orderBy('track.playCount', 'DESC')
      .addOrderBy('track.createdAt', 'DESC')
      .take(8)
      .getMany();

    return items.map((item) => mapTrack(item));
  }
}
