import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackAnalyticsDto, UserRole } from '@wavestream/shared';
import { In, Repository } from 'typeorm';
import { mapTrack } from 'src/common/utils/mappers';
import { PlayEventEntity } from 'src/database/entities/play-event.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(PlayEventEntity)
    private readonly playEventsRepository: Repository<PlayEventEntity>,
  ) {}

  async getCreatorDashboard(user: UserEntity) {
    const tracks = await this.tracksRepository.find({
      where: { artistId: user.id },
      relations: {
        artist: { profile: true },
        genre: true,
        tags: true,
        file: true,
      },
      order: {
        playCount: 'DESC',
        likeCount: 'DESC',
      },
    });

    const trackIds = tracks.map((track) => track.id);
    const recentPlayEvents =
      trackIds.length > 0
        ? await this.playEventsRepository.find({
            where: { trackId: In(trackIds) },
            relations: {
              user: { profile: true },
              track: true,
            },
            order: { playedAt: 'DESC' },
            take: 12,
          })
        : [];

    return {
      totalPlays: tracks.reduce((sum, track) => sum + track.playCount, 0),
      totalLikes: tracks.reduce((sum, track) => sum + track.likeCount, 0),
      totalReposts: tracks.reduce((sum, track) => sum + track.repostCount, 0),
      totalComments: tracks.reduce((sum, track) => sum + track.commentCount, 0),
      recentListeners: recentPlayEvents.map((event) => ({
        trackId: event.trackId,
        trackTitle: event.track?.title ?? 'Unknown track',
        username: event.user?.username ?? 'guest-listener',
        listenedAt: event.playedAt.toISOString(),
      })),
      topTracks: tracks.slice(0, 5).map((track) => ({
        trackId: track.id,
        title: track.title,
        playCount: track.playCount,
        likeCount: track.likeCount,
      })),
    };
  }

  async getTrackAnalytics(
    actor: UserEntity,
    trackId: string,
  ): Promise<TrackAnalyticsDto> {
    const track = await this.tracksRepository.findOne({
      where: { id: trackId },
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

    if (track.artistId !== actor.id && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have access to this track analytics',
      );
    }

    const recentListeners = await this.playEventsRepository.find({
      where: { trackId: track.id },
      relations: {
        user: { profile: true },
        track: true,
      },
      order: { playedAt: 'DESC' },
      take: 20,
    });

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const allRecentEvents = await this.playEventsRepository
      .createQueryBuilder('playEvent')
      .select('DATE(playEvent.playedAt)', 'date')
      .addSelect('COUNT(playEvent.id)', 'plays')
      .where('playEvent.trackId = :trackId', { trackId: track.id })
      .andWhere('playEvent.playedAt >= :since', { since: fourteenDaysAgo })
      .groupBy('DATE(playEvent.playedAt)')
      .orderBy('DATE(playEvent.playedAt)', 'ASC')
      .getRawMany<{ date: string; plays: string }>();

    return {
      track: mapTrack(track),
      totalPlays: track.playCount,
      totalLikes: track.likeCount,
      totalReposts: track.repostCount,
      totalComments: track.commentCount,
      recentListeners: recentListeners.map((event) => ({
        trackId: event.trackId,
        trackTitle: event.track?.title ?? track.title,
        username: event.user?.username ?? 'guest-listener',
        listenedAt: event.playedAt.toISOString(),
      })),
      dailyPlays: allRecentEvents.map((entry) => ({
        date: entry.date,
        plays: Number(entry.plays),
      })),
    };
  }
}
