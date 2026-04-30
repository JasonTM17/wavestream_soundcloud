import {
  AdminActionType,
  NotificationType,
  ReportableType,
  TrackStatus,
  UserRole,
} from '@wavestream/shared';
import * as bcrypt from 'bcryptjs';
import { IsNull, ObjectLiteral, Repository } from 'typeorm';
import { slugify } from 'src/common/utils/slug.util';
import { getValidatedEnv } from 'src/config/env.validation';
import {
  AuditLogEntity,
  CommentEntity,
  FollowEntity,
  GenreEntity,
  LikeEntity,
  ListeningHistoryEntity,
  NotificationEntity,
  PlayEventEntity,
  PlaylistEntity,
  PlaylistTrackEntity,
  ProfileEntity,
  ReportEntity,
  RepostEntity,
  TagEntity,
  TrackEntity,
  TrackFileEntity,
  UserEntity,
} from 'src/database/entities';
import dataSource from 'src/database/typeorm/data-source';
import {
  DEMO_LISTENER_PASSWORD,
  SEED_AUDIT_LOGS,
  SEED_COMMENTS,
  SEED_FOLLOWS,
  SEED_GENRES,
  SEED_LIKES,
  SEED_NOTIFICATIONS,
  SEED_PLAYLISTS,
  SEED_REPORTS,
  SEED_REPOSTS,
  SEED_TRACKS,
  SEED_USERS,
  SeedPlaylistSpec,
  SeedTrackSpec,
  SeedUserSpec,
} from 'src/database/seeds/demo-seed-data';
import {
  AUDIO_BUCKET,
  IMAGE_BUCKET,
  createArtworkSvg,
  createSeedS3Client,
  createWaveAudioBuffer,
  ensureSeedBucket,
  uploadSeedAsset,
} from 'src/database/seeds/seed-assets';

const now = new Date();

const daysAgo = (value: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() - value);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const hoursAgo = (value: number) => {
  const date = new Date(now);
  date.setHours(date.getHours() - value);
  return date;
};

const shouldPublishTrack = (track: SeedTrackSpec) =>
  track.status === TrackStatus.PUBLISHED || track.status === TrackStatus.HIDDEN;

const targetIdByType = (
  type: ReportableType,
  key: string,
  lookup: SeedLookup,
  commentIds: Map<string, string>,
) => {
  switch (type) {
    case ReportableType.TRACK:
      return lookup.tracks.get(key)?.id;
    case ReportableType.COMMENT:
      return commentIds.get(key);
    case ReportableType.PLAYLIST:
      return lookup.playlists.get(key)?.id;
    case ReportableType.USER:
      return lookup.users.get(key)?.id;
    default:
      return undefined;
  }
};

interface SeedLookup {
  users: Map<string, UserEntity>;
  genres: Map<string, GenreEntity>;
  tracks: Map<string, TrackEntity>;
  playlists: Map<string, PlaylistEntity>;
}

const ensureTimestamp = async (
  tableName: string,
  id: string,
  createdAt: Date,
  updatedAt: Date,
  publishedAt?: Date | null,
) => {
  if (publishedAt !== undefined) {
    await dataSource.query(
      `UPDATE "${tableName}" SET "createdAt" = $1, "updatedAt" = $2, "publishedAt" = $3 WHERE "id" = $4`,
      [createdAt, updatedAt, publishedAt, id],
    );
    return;
  }

  await dataSource.query(
    `UPDATE "${tableName}" SET "createdAt" = $1, "updatedAt" = $2 WHERE "id" = $3`,
    [createdAt, updatedAt, id],
  );
};

const deleteByIds = async <T extends ObjectLiteral>(
  repository: Repository<T>,
  columnName: string,
  ids: string[],
) => {
  if (ids.length === 0) {
    return;
  }

  await repository
    .createQueryBuilder()
    .delete()
    .where(`${columnName} IN (:...ids)`, { ids })
    .execute();
};

const run = async () => {
  const env = getValidatedEnv();
  const client = createSeedS3Client(env);

  await dataSource.initialize();

  try {
    await ensureSeedBucket(client, AUDIO_BUCKET);
    await ensureSeedBucket(client, IMAGE_BUCKET);

    const repositories = {
      users: dataSource.getRepository(UserEntity),
      profiles: dataSource.getRepository(ProfileEntity),
      genres: dataSource.getRepository(GenreEntity),
      tags: dataSource.getRepository(TagEntity),
      tracks: dataSource.getRepository(TrackEntity),
      trackFiles: dataSource.getRepository(TrackFileEntity),
      follows: dataSource.getRepository(FollowEntity),
      playlists: dataSource.getRepository(PlaylistEntity),
      playlistTracks: dataSource.getRepository(PlaylistTrackEntity),
      comments: dataSource.getRepository(CommentEntity),
      likes: dataSource.getRepository(LikeEntity),
      reposts: dataSource.getRepository(RepostEntity),
      playEvents: dataSource.getRepository(PlayEventEntity),
      listeningHistory: dataSource.getRepository(ListeningHistoryEntity),
      notifications: dataSource.getRepository(NotificationEntity),
      reports: dataSource.getRepository(ReportEntity),
      auditLogs: dataSource.getRepository(AuditLogEntity),
    };

    const adminUser = await upsertAdminUser(env, repositories.users, repositories.profiles, client);
    const userMap = new Map<string, UserEntity>([[adminUser.username, adminUser]]);

    for (const userSpec of SEED_USERS) {
      const user = await upsertSeedUser(
        userSpec,
        repositories.users,
        repositories.profiles,
        client,
        env,
      );
      userMap.set(user.username, user);
    }

    const genreMap = await upsertGenres(SEED_GENRES, repositories.genres);
    const trackMap = await upsertTracks(
      SEED_TRACKS,
      {
        users: userMap,
        genres: genreMap,
      },
      repositories,
      client,
      env,
    );
    const playlistMap = await upsertPlaylists(
      SEED_PLAYLISTS,
      {
        users: userMap,
        tracks: trackMap,
      },
      repositories,
      client,
      env,
    );

    const seededUserIds = [...userMap.values()].map((user) => user.id);
    const seededTrackIds = [...trackMap.values()].map((track) => track.id);
    const seededPlaylistIds = [...playlistMap.values()].map((playlist) => playlist.id);

    await clearSeedActivity(repositories, {
      adminId: adminUser.id,
      userIds: seededUserIds,
      trackIds: seededTrackIds,
      playlistIds: seededPlaylistIds,
    });

    await seedPlaylistTracks(
      playlistMap,
      trackMap,
      repositories.playlistTracks,
      repositories.playlists,
    );
    await seedFollows(SEED_FOLLOWS, userMap, repositories.follows);
    await seedLikes(SEED_LIKES, userMap, trackMap, repositories.likes);
    await seedReposts(SEED_REPOSTS, userMap, trackMap, repositories.reposts);
    const commentIds = await seedComments(SEED_COMMENTS, userMap, trackMap, repositories.comments);
    const reportIds = await seedReports(
      adminUser,
      userMap,
      trackMap,
      playlistMap,
      commentIds,
      repositories.reports,
    );
    await seedPlayEvents(userMap, trackMap, repositories.playEvents, repositories.listeningHistory);
    await seedNotifications(userMap, trackMap, reportIds, repositories.notifications);
    await seedAuditLogs(adminUser, trackMap, commentIds, repositories.auditLogs);
    await recalculateCounters(userMap, trackMap, playlistMap, repositories);

    console.log(
      `Seed complete: ${userMap.size} users, ${trackMap.size} tracks, ${playlistMap.size} playlists`,
    );
    if (env.nodeEnv === 'production') {
      console.log('Seed credentials hidden because NODE_ENV=production.');
    } else {
      console.log(`Demo listener password: ${DEMO_LISTENER_PASSWORD}`);
      console.log(`Admin credentials: ${env.adminEmail} / ${env.adminPassword}`);
    }
  } finally {
    await dataSource.destroy();
  }
};

const upsertAdminUser = async (
  env: ReturnType<typeof getValidatedEnv>,
  usersRepository: Repository<UserEntity>,
  profilesRepository: Repository<ProfileEntity>,
  client: ReturnType<typeof createSeedS3Client>,
) => {
  const adminSpec: SeedUserSpec = {
    username: env.adminUsername.toLowerCase(),
    email: env.adminEmail.toLowerCase(),
    displayName: env.adminDisplayName,
    role: UserRole.ADMIN,
    bio: 'Platform admin account for moderation, support, and demo maintenance.',
    location: 'Operations',
    avatarPalette: {
      background: '#111827',
      foreground: '#f9fafb',
      accent: '#ef4444',
    },
    bannerPalette: {
      background: '#7f1d1d',
      foreground: '#fef2f2',
      accent: '#f97316',
    },
  };

  return upsertUserWithAssets(
    adminSpec,
    env.adminPassword,
    usersRepository,
    profilesRepository,
    client,
    env,
  );
};

const upsertSeedUser = async (
  userSpec: SeedUserSpec,
  usersRepository: Repository<UserEntity>,
  profilesRepository: Repository<ProfileEntity>,
  client: ReturnType<typeof createSeedS3Client>,
  env: ReturnType<typeof getValidatedEnv>,
) =>
  upsertUserWithAssets(
    userSpec,
    DEMO_LISTENER_PASSWORD,
    usersRepository,
    profilesRepository,
    client,
    env,
  );

const upsertUserWithAssets = async (
  userSpec: SeedUserSpec,
  password: string,
  usersRepository: Repository<UserEntity>,
  profilesRepository: Repository<ProfileEntity>,
  client: ReturnType<typeof createSeedS3Client>,
  env: ReturnType<typeof getValidatedEnv>,
) => {
  const avatarUrl = await uploadSeedAsset(
    client,
    env,
    IMAGE_BUCKET,
    `seed/users/${userSpec.username}/avatar.svg`,
    createArtworkSvg({
      width: 512,
      height: 512,
      title: userSpec.displayName,
      subtitle: userSpec.role,
      palette: userSpec.avatarPalette,
      shapeSeed: userSpec.username.length,
    }),
    'image/svg+xml',
  );
  const bannerUrl = await uploadSeedAsset(
    client,
    env,
    IMAGE_BUCKET,
    `seed/users/${userSpec.username}/banner.svg`,
    createArtworkSvg({
      width: 1400,
      height: 420,
      title: userSpec.displayName,
      subtitle: userSpec.bio,
      palette: userSpec.bannerPalette,
      shapeSeed: userSpec.displayName.length,
    }),
    'image/svg+xml',
  );

  let user = await usersRepository.findOne({
    where: [{ email: userSpec.email.toLowerCase() }, { username: userSpec.username }],
    relations: { profile: true },
    withDeleted: true,
  });

  if (!user) {
    user = usersRepository.create();
  }

  user.email = userSpec.email.toLowerCase();
  user.username = userSpec.username.toLowerCase();
  user.displayName = userSpec.displayName;
  user.passwordHash = await bcrypt.hash(password, 10);
  user.role = userSpec.role;
  user.deletedAt = null;
  user.isVerified = true;
  user.lastLoginAt = hoursAgo(userSpec.username.length);
  user.followerCount = 0;
  user.followingCount = 0;
  user.trackCount = 0;
  user.playlistCount = 0;
  user = await usersRepository.save(user);

  let profile = await profilesRepository.findOneBy({ userId: user.id });
  if (!profile) {
    profile = profilesRepository.create({ userId: user.id });
  }

  profile.bio = userSpec.bio;
  profile.avatarUrl = avatarUrl;
  profile.bannerUrl = bannerUrl;
  profile.websiteUrl = userSpec.websiteUrl ?? null;
  profile.location = userSpec.location;
  await profilesRepository.save(profile);

  return usersRepository.findOneOrFail({
    where: { id: user.id },
    relations: { profile: true },
  });
};

const upsertGenres = async (names: string[], genresRepository: Repository<GenreEntity>) => {
  const map = new Map<string, GenreEntity>();

  for (const name of names) {
    const slug = slugify(name);
    let genre = await genresRepository.findOneBy({ slug });

    if (!genre) {
      genre = genresRepository.create({ name, slug });
    } else {
      genre.name = name;
    }

    genre = await genresRepository.save(genre);
    map.set(genre.slug, genre);
  }

  return map;
};

const upsertTracks = async (
  trackSpecs: SeedTrackSpec[],
  lookup: Pick<SeedLookup, 'users' | 'genres'>,
  repositories: {
    tags: Repository<TagEntity>;
    tracks: Repository<TrackEntity>;
    trackFiles: Repository<TrackFileEntity>;
  },
  client: ReturnType<typeof createSeedS3Client>,
  env: ReturnType<typeof getValidatedEnv>,
) => {
  const trackMap = new Map<string, TrackEntity>();

  for (const trackSpec of trackSpecs) {
    const artist = lookup.users.get(trackSpec.artistUsername);
    const genre = lookup.genres.get(slugify(trackSpec.genre));

    if (!artist || !genre) {
      throw new Error(`Missing track dependency for ${trackSpec.slug}`);
    }

    const coverUrl = await uploadSeedAsset(
      client,
      env,
      IMAGE_BUCKET,
      `seed/tracks/${trackSpec.slug}/cover.svg`,
      createArtworkSvg({
        width: 1200,
        height: 1200,
        title: trackSpec.title,
        subtitle: artist.displayName,
        palette: trackSpec.palette,
        shapeSeed: trackSpec.durationSeconds,
      }),
      'image/svg+xml',
    );
    const audioBuffer = createWaveAudioBuffer({
      durationSeconds: trackSpec.durationSeconds,
      baseFrequency: trackSpec.baseFrequency,
      pulseFrequency: trackSpec.pulseFrequency,
      genre: trackSpec.genre,
      seed: trackSpec.slug,
      title: trackSpec.title,
    });
    const audioUrl = await uploadSeedAsset(
      client,
      env,
      AUDIO_BUCKET,
      `seed/tracks/${trackSpec.slug}/audio.wav`,
      audioBuffer,
      'audio/wav',
    );

    const tags = await Promise.all(
      trackSpec.tags.map(async (tagName) => {
        const slug = slugify(tagName);
        let tag = await repositories.tags.findOneBy({ slug });
        if (!tag) {
          tag = repositories.tags.create({ name: tagName, slug });
        } else {
          tag.name = tagName;
        }

        return repositories.tags.save(tag);
      }),
    );

    let track = await repositories.tracks.findOne({
      where: { slug: trackSpec.slug },
      relations: { tags: true },
      withDeleted: true,
    });

    if (!track) {
      track = repositories.tracks.create({ slug: trackSpec.slug });
    }

    track.artistId = artist.id;
    track.artist = artist;
    track.slug = trackSpec.slug;
    track.title = trackSpec.title;
    track.description = trackSpec.description;
    track.coverUrl = coverUrl;
    track.duration = trackSpec.durationSeconds;
    track.privacy = trackSpec.privacy;
    track.status = trackSpec.status;
    track.allowDownloads = trackSpec.allowDownloads;
    track.commentsEnabled = trackSpec.commentsEnabled;
    track.hiddenReason = trackSpec.hiddenReason ?? null;
    track.genreId = genre.id;
    track.genre = genre;
    track.tags = tags;
    track.deletedAt = null;
    track.playCount = 0;
    track.likeCount = 0;
    track.repostCount = 0;
    track.commentCount = 0;
    track.publishedAt = shouldPublishTrack(trackSpec)
      ? daysAgo(trackSpec.daysAgo, 8 + (trackSpec.durationSeconds % 6))
      : null;
    track = await repositories.tracks.save(track);

    let trackFile = await repositories.trackFiles.findOneBy({
      trackId: track.id,
    });
    if (!trackFile) {
      trackFile = repositories.trackFiles.create({ trackId: track.id });
    }

    trackFile.bucket = AUDIO_BUCKET;
    trackFile.objectKey = `seed/tracks/${trackSpec.slug}/audio.wav`;
    trackFile.originalName = `${trackSpec.slug}.wav`;
    trackFile.mimeType = 'audio/wav';
    trackFile.sizeBytes = audioBuffer.byteLength;
    trackFile.durationSeconds = trackSpec.durationSeconds;
    trackFile.publicUrl = audioUrl;
    await repositories.trackFiles.save(trackFile);

    const createdAt = daysAgo(trackSpec.daysAgo, 9 + (trackSpec.durationSeconds % 5));
    const updatedAt = daysAgo(
      Math.max(trackSpec.daysAgo - 1, 0),
      14 + (trackSpec.durationSeconds % 4),
    );
    await ensureTimestamp('tracks', track.id, createdAt, updatedAt, track.publishedAt);

    const fullTrack = await repositories.tracks.findOneOrFail({
      where: { id: track.id },
      relations: {
        artist: { profile: true },
        genre: true,
        tags: true,
        file: true,
      },
    });
    trackMap.set(trackSpec.slug, fullTrack);
  }

  return trackMap;
};

const upsertPlaylists = async (
  playlistSpecs: SeedPlaylistSpec[],
  lookup: Pick<SeedLookup, 'users' | 'tracks'>,
  repositories: {
    playlists: Repository<PlaylistEntity>;
  },
  client: ReturnType<typeof createSeedS3Client>,
  env: ReturnType<typeof getValidatedEnv>,
) => {
  const playlistMap = new Map<string, PlaylistEntity>();

  for (const playlistSpec of playlistSpecs) {
    const owner = lookup.users.get(playlistSpec.ownerUsername);
    if (!owner) {
      throw new Error(`Missing playlist owner for ${playlistSpec.slug}`);
    }

    const coverUrl = await uploadSeedAsset(
      client,
      env,
      IMAGE_BUCKET,
      `seed/playlists/${playlistSpec.slug}/cover.svg`,
      createArtworkSvg({
        width: 1200,
        height: 1200,
        title: playlistSpec.title,
        subtitle: owner.displayName,
        palette: playlistSpec.palette,
        shapeSeed: playlistSpec.trackSlugs.length * 7,
      }),
      'image/svg+xml',
    );

    let playlist = await repositories.playlists.findOne({
      where: { slug: playlistSpec.slug },
      withDeleted: true,
    });

    if (!playlist) {
      playlist = repositories.playlists.create({ slug: playlistSpec.slug });
    }

    playlist.ownerId = owner.id;
    playlist.owner = owner;
    playlist.title = playlistSpec.title;
    playlist.description = playlistSpec.description;
    playlist.coverUrl = coverUrl;
    playlist.isPublic = playlistSpec.isPublic;
    playlist.trackCount = playlistSpec.trackSlugs.length;
    playlist.totalDuration = playlistSpec.trackSlugs.reduce(
      (sum, slug) => sum + (lookup.tracks.get(slug)?.duration ?? 0),
      0,
    );
    playlist.deletedAt = null;
    playlist = await repositories.playlists.save(playlist);

    await ensureTimestamp(
      'playlists',
      playlist.id,
      daysAgo(playlistSpec.daysAgo, 11),
      daysAgo(Math.max(playlistSpec.daysAgo - 1, 0), 16),
    );

    playlistMap.set(playlistSpec.slug, playlist);
  }

  return playlistMap;
};

const clearSeedActivity = async (
  repositories: {
    follows: Repository<FollowEntity>;
    likes: Repository<LikeEntity>;
    reposts: Repository<RepostEntity>;
    comments: Repository<CommentEntity>;
    playlistTracks: Repository<PlaylistTrackEntity>;
    playEvents: Repository<PlayEventEntity>;
    listeningHistory: Repository<ListeningHistoryEntity>;
    notifications: Repository<NotificationEntity>;
    reports: Repository<ReportEntity>;
    auditLogs: Repository<AuditLogEntity>;
  },
  seedScope: {
    adminId: string;
    userIds: string[];
    trackIds: string[];
    playlistIds: string[];
  },
) => {
  await repositories.follows
    .createQueryBuilder()
    .delete()
    .where('followerId IN (:...userIds)', { userIds: seedScope.userIds })
    .orWhere('followingId IN (:...userIds)', { userIds: seedScope.userIds })
    .execute();
  await repositories.likes
    .createQueryBuilder()
    .delete()
    .where('userId IN (:...userIds)', { userIds: seedScope.userIds })
    .orWhere('trackId IN (:...trackIds)', { trackIds: seedScope.trackIds })
    .execute();
  await repositories.reposts
    .createQueryBuilder()
    .delete()
    .where('userId IN (:...userIds)', { userIds: seedScope.userIds })
    .orWhere('trackId IN (:...trackIds)', { trackIds: seedScope.trackIds })
    .execute();
  await repositories.comments
    .createQueryBuilder()
    .delete()
    .where('userId IN (:...userIds)', { userIds: seedScope.userIds })
    .orWhere('trackId IN (:...trackIds)', { trackIds: seedScope.trackIds })
    .execute();
  await deleteByIds(repositories.playlistTracks, 'playlistId', seedScope.playlistIds);
  await repositories.playEvents
    .createQueryBuilder()
    .delete()
    .where('trackId IN (:...trackIds)', { trackIds: seedScope.trackIds })
    .orWhere('userId IN (:...userIds)', { userIds: seedScope.userIds })
    .execute();
  await repositories.listeningHistory
    .createQueryBuilder()
    .delete()
    .where('trackId IN (:...trackIds)', { trackIds: seedScope.trackIds })
    .orWhere('userId IN (:...userIds)', { userIds: seedScope.userIds })
    .execute();
  await deleteByIds(repositories.notifications, 'userId', seedScope.userIds);
  await deleteByIds(repositories.reports, 'reporterId', seedScope.userIds);
  await repositories.auditLogs.delete({ adminId: seedScope.adminId });
};

const seedPlaylistTracks = async (
  playlistMap: Map<string, PlaylistEntity>,
  trackMap: Map<string, TrackEntity>,
  playlistTracksRepository: Repository<PlaylistTrackEntity>,
  playlistsRepository: Repository<PlaylistEntity>,
) => {
  for (const playlistSpec of SEED_PLAYLISTS) {
    const playlist = playlistMap.get(playlistSpec.slug);
    if (!playlist) {
      continue;
    }

    const entries = playlistSpec.trackSlugs
      .map((trackSlug, index) => {
        const track = trackMap.get(trackSlug);
        if (!track) {
          return null;
        }

        return playlistTracksRepository.create({
          playlistId: playlist.id,
          trackId: track.id,
          position: index,
        });
      })
      .filter((entry): entry is PlaylistTrackEntity => Boolean(entry));

    await playlistTracksRepository.save(entries);

    playlist.trackCount = entries.length;
    playlist.totalDuration = entries.reduce(
      (sum, entry) => sum + (trackMap.get(playlistSpec.trackSlugs[entry.position])?.duration ?? 0),
      0,
    );
    await playlistsRepository.save(playlist);
  }
};

const seedFollows = async (
  follows: Array<[string, string]>,
  userMap: Map<string, UserEntity>,
  followsRepository: Repository<FollowEntity>,
) => {
  for (const [followerUsername, followingUsername] of follows) {
    const follower = userMap.get(followerUsername);
    const following = userMap.get(followingUsername);
    if (!follower || !following) {
      continue;
    }

    await followsRepository.save(
      followsRepository.create({
        followerId: follower.id,
        followingId: following.id,
      }),
    );
  }
};

const seedLikes = async (
  likes: Array<[string, string]>,
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  likesRepository: Repository<LikeEntity>,
) => {
  for (const [username, trackSlug] of likes) {
    const user = userMap.get(username);
    const track = trackMap.get(trackSlug);
    if (!user || !track) {
      continue;
    }

    await likesRepository.save(
      likesRepository.create({
        userId: user.id,
        trackId: track.id,
      }),
    );
  }
};

const seedReposts = async (
  reposts: Array<[string, string]>,
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  repostsRepository: Repository<RepostEntity>,
) => {
  for (const [username, trackSlug] of reposts) {
    const user = userMap.get(username);
    const track = trackMap.get(trackSlug);
    if (!user || !track) {
      continue;
    }

    await repostsRepository.save(
      repostsRepository.create({
        userId: user.id,
        trackId: track.id,
      }),
    );
  }
};

const seedComments = async (
  commentSpecs: typeof SEED_COMMENTS,
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  commentsRepository: Repository<CommentEntity>,
) => {
  const commentIds = new Map<string, string>();

  for (const commentSpec of commentSpecs) {
    const user = userMap.get(commentSpec.username);
    const track = trackMap.get(commentSpec.trackSlug);
    if (!user || !track) {
      continue;
    }

    const parentId = commentSpec.parentKey ? (commentIds.get(commentSpec.parentKey) ?? null) : null;
    const saved = await commentsRepository.save(
      commentsRepository.create({
        userId: user.id,
        trackId: track.id,
        body: commentSpec.body,
        timestampSeconds: commentSpec.timestampSeconds ?? null,
        parentId,
        isHidden: commentSpec.hidden ?? false,
      }),
    );

    commentIds.set(commentSpec.key, saved.id);
  }

  return commentIds;
};

const seedReports = async (
  adminUser: UserEntity,
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  playlistMap: Map<string, PlaylistEntity>,
  commentIds: Map<string, string>,
  reportsRepository: Repository<ReportEntity>,
) => {
  const reportIds = new Map<string, string>();
  const lookup: SeedLookup = {
    users: userMap,
    genres: new Map(),
    tracks: trackMap,
    playlists: playlistMap,
  };

  for (const reportSpec of SEED_REPORTS) {
    const reporter = userMap.get(reportSpec.reporterUsername);
    const targetId = targetIdByType(
      reportSpec.reportableType,
      reportSpec.targetKey,
      lookup,
      commentIds,
    );

    if (!reporter || !targetId) {
      continue;
    }

    const report = await reportsRepository.save(
      reportsRepository.create({
        reporterId: reporter.id,
        reportableType: reportSpec.reportableType,
        reportableId: targetId,
        reason: reportSpec.reason,
        details: reportSpec.details ?? null,
        status: reportSpec.status,
        resolvedById: reportSpec.resolvedByAdmin ? adminUser.id : null,
        resolvedAt: reportSpec.resolvedByAdmin ? hoursAgo(18) : null,
      }),
    );

    reportIds.set(reportSpec.targetKey, report.id);
  }

  return reportIds;
};

const seedPlayEvents = async (
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  playEventsRepository: Repository<PlayEventEntity>,
  listeningHistoryRepository: Repository<ListeningHistoryEntity>,
) => {
  const listenerRotation = ['ivy-hart', 'dev-patel', 'mia-tran', 'theo-cross', 'jules-park', null];

  const playCountsBySlug = new Map<string, number>([
    ['aurora-current', 16],
    ['blue-hour-tide', 13],
    ['glass-circuit', 14],
    ['linen-hours', 12],
    ['paper-jetlag', 11],
    ['velvet-runner', 15],
    ['afterhours-hush', 5],
    ['midnight-static', 8],
    ['balcony-sunrise', 7],
    ['southbound-lights', 9],
    ['soft-signal', 6],
    ['afterimage', 6],
    ['tape-bloom', 8],
    ['echo-relay', 7],
  ]);

  const publishedTracks = [...SEED_TRACKS]
    .filter((track) => shouldPublishTrack(track))
    .sort((left, right) => {
      if (left.daysAgo !== right.daysAgo) {
        return left.daysAgo - right.daysAgo;
      }

      if (left.durationSeconds !== right.durationSeconds) {
        return right.durationSeconds - left.durationSeconds;
      }

      return left.slug.localeCompare(right.slug);
    });

  let offset = 1;
  for (const trackSpec of publishedTracks) {
    const track = trackMap.get(trackSpec.slug);
    if (!track) {
      continue;
    }

    const playCount = playCountsBySlug.get(trackSpec.slug) ?? 4;

    for (let index = 0; index < playCount; index += 1) {
      const listenerUsername = listenerRotation[(offset + index) % listenerRotation.length];
      const listener = listenerUsername ? userMap.get(listenerUsername) : null;
      const playedAt = hoursAgo(offset + index * 2);

      await playEventsRepository.save(
        playEventsRepository.create({
          trackId: track.id,
          userId: listener?.id ?? null,
          durationListened: Math.max(18, track.duration - (index % 6)),
          source: index % 4 === 0 ? 'feed' : 'player',
          playedAt,
        }),
      );

      if (listener) {
        await listeningHistoryRepository.save(
          listeningHistoryRepository.create({
            userId: listener.id,
            trackId: track.id,
            playedAt,
          }),
        );
      }
    }

    offset += 3;
  }
};

const seedNotifications = async (
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  reportIds: Map<string, string>,
  notificationsRepository: Repository<NotificationEntity>,
) => {
  for (const notificationSpec of SEED_NOTIFICATIONS) {
    const user = userMap.get(notificationSpec.username);
    if (!user) {
      continue;
    }

    const data = {
      ...notificationSpec.data,
    };

    if (typeof data.userId === 'string') {
      data.userId = userMap.get(data.userId)?.id ?? data.userId;
    }

    if (typeof data.trackSlug === 'string') {
      data.trackId = trackMap.get(data.trackSlug)?.id ?? null;
    }

    if (typeof data.reportKey === 'string') {
      data.reportId = reportIds.get(data.reportKey) ?? null;
    }

    await notificationsRepository.save(
      notificationsRepository.create({
        userId: user.id,
        type: notificationSpec.type,
        data,
        read: notificationSpec.type === NotificationType.REPORT_UPDATE,
      }),
    );
  }
};

const seedAuditLogs = async (
  adminUser: UserEntity,
  trackMap: Map<string, TrackEntity>,
  commentIds: Map<string, string>,
  auditLogsRepository: Repository<AuditLogEntity>,
) => {
  for (const logSpec of SEED_AUDIT_LOGS) {
    const entityId =
      logSpec.entityType === 'track'
        ? (trackMap.get(logSpec.entityKey)?.id ?? null)
        : (commentIds.get(logSpec.entityKey) ?? null);

    if (!entityId) {
      continue;
    }

    await auditLogsRepository.save(
      auditLogsRepository.create({
        adminId: adminUser.id,
        action: logSpec.action,
        entityType: logSpec.entityType,
        entityId,
        details: logSpec.details ?? null,
      }),
    );
  }

  for (const reportSpec of SEED_REPORTS.filter((report) => report.resolvedByAdmin)) {
    await auditLogsRepository.save(
      auditLogsRepository.create({
        adminId: adminUser.id,
        action: AdminActionType.RESOLVE_REPORT,
        entityType: 'report',
        entityId: null,
        details: {
          target: reportSpec.targetKey,
          status: reportSpec.status,
          note: reportSpec.resolutionNote ?? null,
        },
      }),
    );
  }
};

const recalculateCounters = async (
  userMap: Map<string, UserEntity>,
  trackMap: Map<string, TrackEntity>,
  playlistMap: Map<string, PlaylistEntity>,
  repositories: {
    users: Repository<UserEntity>;
    tracks: Repository<TrackEntity>;
    playlists: Repository<PlaylistEntity>;
    follows: Repository<FollowEntity>;
    likes: Repository<LikeEntity>;
    reposts: Repository<RepostEntity>;
    comments: Repository<CommentEntity>;
    playEvents: Repository<PlayEventEntity>;
    playlistTracks: Repository<PlaylistTrackEntity>;
  },
) => {
  for (const user of userMap.values()) {
    user.followerCount = await repositories.follows.count({
      where: { followingId: user.id },
    });
    user.followingCount = await repositories.follows.count({
      where: { followerId: user.id },
    });
    user.trackCount = await repositories.tracks.count({
      where: { artistId: user.id, deletedAt: IsNull() },
    });
    user.playlistCount = await repositories.playlists.count({
      where: { ownerId: user.id, deletedAt: IsNull() },
    });
    await repositories.users.save(user);
  }

  for (const track of trackMap.values()) {
    track.likeCount = await repositories.likes.count({
      where: { trackId: track.id },
    });
    track.repostCount = await repositories.reposts.count({
      where: { trackId: track.id },
    });
    track.commentCount = await repositories.comments.count({
      where: { trackId: track.id, deletedAt: IsNull() },
      withDeleted: true,
    });
    track.playCount = await repositories.playEvents.count({
      where: { trackId: track.id },
    });
    await repositories.tracks.save(track);
  }

  for (const playlist of playlistMap.values()) {
    const entries = await repositories.playlistTracks.find({
      where: { playlistId: playlist.id },
      relations: { track: true },
      order: { position: 'ASC' },
    });
    playlist.trackCount = entries.length;
    playlist.totalDuration = entries.reduce((sum, entry) => sum + (entry.track?.duration ?? 0), 0);
    await repositories.playlists.save(playlist);
  }
};

void run().catch((error: unknown) => {
  console.error('WaveStream seed failed');
  console.error(error);
  process.exit(1);
});
