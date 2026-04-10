import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AUDIO_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  TrackPrivacy,
  TrackStatus,
  UserRole,
} from '@wavestream/shared';
import { parseBuffer } from 'music-metadata';
import { extname } from 'path';
import { Readable } from 'stream';
import { In, Repository } from 'typeorm';
import { mapTrack } from 'src/common/utils/mappers';
import {
  createPaginationMeta,
  normalizePagination,
} from 'src/common/utils/pagination.util';
import { createUniqueSlug, slugify } from 'src/common/utils/slug.util';
import {
  sanitizePlainText,
  sanitizeRichText,
} from 'src/common/utils/text.util';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { TagEntity } from 'src/database/entities/tag.entity';
import { TrackFileEntity } from 'src/database/entities/track-file.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { StorageService } from 'src/storage/storage.service';
import { CreateTrackDto } from 'src/modules/tracks/dto/create-track.dto';
import { TrackListQueryDto } from 'src/modules/tracks/dto/track-list-query.dto';
import { UpdateTrackDto } from 'src/modules/tracks/dto/update-track.dto';

const AUDIO_BUCKET = 'wavestream-audio';
const IMAGE_BUCKET = 'wavestream-images';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(TrackFileEntity)
    private readonly trackFilesRepository: Repository<TrackFileEntity>,
    @InjectRepository(GenreEntity)
    private readonly genresRepository: Repository<GenreEntity>,
    @InjectRepository(TagEntity)
    private readonly tagsRepository: Repository<TagEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly storageService: StorageService,
  ) {}

  async listTracks(query: TrackListQueryDto, viewer?: UserEntity) {
    const pagination = normalizePagination(query);
    const qb = this.tracksRepository
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.artist', 'artist')
      .leftJoinAndSelect('artist.profile', 'artistProfile')
      .leftJoinAndSelect('track.genre', 'genre')
      .leftJoinAndSelect('track.tags', 'tag')
      .leftJoinAndSelect('track.file', 'file')
      .orderBy('track.createdAt', 'DESC')
      .take(pagination.limit)
      .skip(pagination.skip);

    qb.andWhere('track.deletedAt IS NULL');

    if (query.artistId) {
      qb.andWhere('track.artistId = :artistId', { artistId: query.artistId });
    }

    if (query.artistUsername) {
      qb.andWhere('artist.username = :artistUsername', {
        artistUsername: query.artistUsername.toLowerCase(),
      });
    }

    if (query.genre) {
      qb.andWhere('genre.slug = :genre', { genre: slugify(query.genre) });
    }

    if (query.q) {
      qb.andWhere(
        '(track.title ILIKE :query OR track.description ILIKE :query OR artist.displayName ILIKE :query)',
        { query: `%${query.q}%` },
      );
    }

    if (!viewer || viewer.role !== UserRole.ADMIN) {
      qb.andWhere(
        '((track.status = :published AND track.privacy = :public) OR track.artistId = :viewerId)',
        {
          published: TrackStatus.PUBLISHED,
          public: TrackPrivacy.PUBLIC,
          viewerId: viewer?.id ?? '',
        },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((track) => mapTrack(track)),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async listMyTracks(userId: string) {
    const tracks = await this.tracksRepository.find({
      where: { artistId: userId },
      relations: {
        artist: { profile: true },
        genre: true,
        tags: true,
        file: true,
      },
      order: { updatedAt: 'DESC' },
    });

    return tracks.map((track) => mapTrack(track));
  }

  async getTrack(idOrSlug: string, viewer?: UserEntity) {
    const track = await this.findTrackOrFail(idOrSlug);
    this.assertCanAccess(track, viewer);

    return mapTrack(track);
  }

  async createTrack(
    artist: UserEntity,
    dto: CreateTrackDto,
    audioFile: Express.Multer.File | undefined,
    coverImage?: Express.Multer.File,
  ) {
    if (!audioFile) {
      throw new BadRequestException('Audio file is required');
    }

    this.validateAudioFile(audioFile);
    if (coverImage) {
      this.validateImageFile(coverImage);
    }

    const audioMetadata = await parseBuffer(
      audioFile.buffer,
      audioFile.mimetype,
    );
    const duration = Math.round(audioMetadata.format.duration ?? 0);

    const audioKey = `tracks/${artist.id}/${createUniqueSlug(dto.title)}${extname(audioFile.originalname) || '.mp3'}`;
    const audioUrl = await this.storageService.upload({
      bucket: AUDIO_BUCKET,
      key: audioKey,
      body: audioFile.buffer,
      contentType: audioFile.mimetype,
    });

    let coverUrl: string | null = null;
    if (coverImage) {
      const imageKey = `covers/${artist.id}/${createUniqueSlug(dto.title)}${extname(coverImage.originalname) || '.jpg'}`;
      coverUrl = await this.storageService.upload({
        bucket: IMAGE_BUCKET,
        key: imageKey,
        body: coverImage.buffer,
        contentType: coverImage.mimetype,
      });
    }

    const genre = await this.resolveGenre(dto.genre);
    const tags = await this.resolveTags(dto.tags);

    const track = this.tracksRepository.create({
      artistId: artist.id,
      slug: createUniqueSlug(dto.title),
      title: sanitizePlainText(dto.title) ?? dto.title,
      description: sanitizeRichText(dto.description) ?? null,
      coverUrl,
      duration,
      privacy: dto.privacy ?? TrackPrivacy.PUBLIC,
      status: dto.status ?? TrackStatus.PUBLISHED,
      allowDownloads: dto.allowDownloads ?? false,
      commentsEnabled: dto.commentsEnabled ?? true,
      publishedAt:
        (dto.status ?? TrackStatus.PUBLISHED) === TrackStatus.PUBLISHED
          ? new Date()
          : null,
      genreId: genre?.id ?? null,
      genre,
      tags,
      artist,
    });

    const savedTrack = await this.tracksRepository.save(track);
    const trackFile = this.trackFilesRepository.create({
      trackId: savedTrack.id,
      bucket: AUDIO_BUCKET,
      objectKey: audioKey,
      originalName: audioFile.originalname,
      mimeType: audioFile.mimetype,
      sizeBytes: audioFile.size,
      durationSeconds: duration,
      publicUrl: audioUrl,
    });
    await this.trackFilesRepository.save(trackFile);

    artist.trackCount += 1;
    await this.usersRepository.save(artist);

    const fullTrack = await this.findTrackOrFail(savedTrack.id);
    return mapTrack(fullTrack);
  }

  async updateTrack(trackId: string, actor: UserEntity, dto: UpdateTrackDto) {
    const track = await this.findTrackOrFail(trackId);
    this.assertOwnership(track, actor);

    if (dto.title) {
      track.title = sanitizePlainText(dto.title) ?? track.title;
    }
    if (dto.description !== undefined) {
      track.description = sanitizeRichText(dto.description) ?? null;
    }
    if (dto.genre !== undefined) {
      const genre = await this.resolveGenre(dto.genre);
      track.genreId = genre?.id ?? null;
      track.genre = genre;
    }
    if (dto.tags !== undefined) {
      track.tags = await this.resolveTags(dto.tags);
    }
    if (dto.privacy) {
      track.privacy = dto.privacy;
    }
    if (dto.status) {
      track.status = dto.status;
      track.publishedAt =
        dto.status === TrackStatus.PUBLISHED
          ? (track.publishedAt ?? new Date())
          : null;
    }
    if (dto.allowDownloads !== undefined) {
      track.allowDownloads = dto.allowDownloads;
    }
    if (dto.commentsEnabled !== undefined) {
      track.commentsEnabled = dto.commentsEnabled;
    }

    await this.tracksRepository.save(track);
    const fullTrack = await this.findTrackOrFail(track.id);
    return mapTrack(fullTrack);
  }

  async deleteTrack(trackId: string, actor: UserEntity) {
    const track = await this.findTrackOrFail(trackId);
    this.assertOwnership(track, actor);

    await this.tracksRepository.softDelete(track.id);

    const owner = await this.usersRepository.findOneBy({ id: track.artistId });
    if (owner) {
      owner.trackCount = Math.max(0, owner.trackCount - 1);
      await this.usersRepository.save(owner);
    }

    return { deleted: true };
  }

  async streamTrack(
    idOrSlug: string,
    viewer: UserEntity | undefined,
    range?: string,
  ) {
    const track = await this.findTrackOrFail(idOrSlug);
    this.assertCanAccess(track, viewer);

    if (!track.file) {
      throw new NotFoundException('Track file not found');
    }

    const object = await this.storageService.getObject({
      bucket: track.file.bucket,
      key: track.file.objectKey,
      range,
    });

    return {
      stream: object.Body as Readable,
      contentType: object.ContentType ?? track.file.mimeType,
      contentLength: Number(object.ContentLength ?? track.file.sizeBytes),
      contentRange: object.ContentRange,
      acceptRanges: object.AcceptRanges,
      fileName: track.file.originalName,
    };
  }

  async getDownloadUrl(idOrSlug: string, viewer?: UserEntity) {
    const track = await this.findTrackOrFail(idOrSlug);
    this.assertCanAccess(track, viewer);

    if (!track.allowDownloads || !track.file) {
      throw new ForbiddenException('Downloads are disabled');
    }

    const url = await this.storageService.getSignedDownloadUrl(
      track.file.bucket,
      track.file.objectKey,
      120,
    );
    return { url };
  }

  private async findTrackOrFail(idOrSlug: string) {
    const track = await this.tracksRepository.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
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

    return track;
  }

  private assertOwnership(track: TrackEntity, actor: UserEntity) {
    if (track.artistId !== actor.id && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not own this track');
    }
  }

  private assertCanAccess(track: TrackEntity, viewer?: UserEntity) {
    const isOwner = viewer && track.artistId === viewer.id;
    const isAdmin = viewer?.role === UserRole.ADMIN;
    const isPublicTrack =
      track.status === TrackStatus.PUBLISHED &&
      track.privacy === TrackPrivacy.PUBLIC;
    const isUnlisted =
      track.status === TrackStatus.PUBLISHED &&
      track.privacy === TrackPrivacy.UNLISTED;

    if (!isOwner && !isAdmin && !isPublicTrack && !isUnlisted) {
      throw new ForbiddenException('Track is not available');
    }
  }

  private validateAudioFile(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      '.mp3',
      '.wav',
      '.ogg',
      '.flac',
      '.aac',
      '.m4a',
      '.webm',
    ];

    if (
      !AUDIO_MIME_TYPES.includes(
        file.mimetype as (typeof AUDIO_MIME_TYPES)[number],
      ) ||
      !allowedExtensions.includes(extension)
    ) {
      throw new BadRequestException('Unsupported audio format');
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      throw new BadRequestException('Audio file exceeds the allowed size');
    }
  }

  private validateImageFile(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
    ];

    if (
      !IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof IMAGE_MIME_TYPES)[number],
      ) ||
      !allowedExtensions.includes(extension)
    ) {
      throw new BadRequestException('Unsupported image format');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Image exceeds the allowed size');
    }
  }

  private async resolveGenre(genreInput?: string) {
    if (!genreInput) {
      return null;
    }

    const slug = slugify(genreInput);
    let genre = await this.genresRepository.findOneBy({ slug });
    if (!genre) {
      genre = this.genresRepository.create({
        name: genreInput.trim(),
        slug,
      });
      genre = await this.genresRepository.save(genre);
    }

    return genre;
  }

  private async resolveTags(tagsInput?: string[]) {
    const values = (tagsInput ?? [])
      .map((tag) => sanitizePlainText(tag)?.toLowerCase())
      .filter((tag): tag is string => Boolean(tag));

    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length === 0) {
      return [];
    }

    const slugs = uniqueValues.map((tag) => slugify(tag));
    const existing = await this.tagsRepository.findBy({
      slug: In(slugs),
    });
    const existingBySlug = new Map(existing.map((tag) => [tag.slug, tag]));
    const slugNamePairs = uniqueValues.map((name) => ({
      name,
      slug: slugify(name),
    }));
    const missing = slugNamePairs
      .filter(({ slug }) => !existingBySlug.has(slug))
      .map(({ slug, name }) =>
        this.tagsRepository.create({
          slug,
          name,
        }),
      );

    if (missing.length > 0) {
      const saved = await this.tagsRepository.save(missing);
      saved.forEach((tag) => existingBySlug.set(tag.slug, tag));
    }

    return slugs
      .map((slug) => existingBySlug.get(slug))
      .filter((tag): tag is TagEntity => Boolean(tag));
  }
}
