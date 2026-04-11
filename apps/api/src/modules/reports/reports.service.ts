import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportStatus, ReportableType } from '@wavestream/shared';
import { Repository } from 'typeorm';
import { createPaginationMeta, normalizePagination } from 'src/common/utils/pagination.util';
import { sanitizePlainText, sanitizeRichText } from 'src/common/utils/text.util';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { ReportEntity } from 'src/database/entities/report.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { CreateReportDto } from 'src/modules/reports/dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    @InjectRepository(TrackEntity)
    private readonly tracksRepository: Repository<TrackEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistsRepository: Repository<PlaylistEntity>,
  ) {}

  async createReport(reporter: UserEntity, dto: CreateReportDto) {
    await this.assertReportableExists(dto.reportableType, dto.reportableId);

    const existingPending = await this.reportsRepository.findOneBy({
      reporterId: reporter.id,
      reportableType: dto.reportableType,
      reportableId: dto.reportableId,
      status: ReportStatus.PENDING,
    });

    if (existingPending) {
      throw new BadRequestException('You already have an open report for this item');
    }

    const report = this.reportsRepository.create({
      reporterId: reporter.id,
      reportableType: dto.reportableType,
      reportableId: dto.reportableId,
      reason: sanitizePlainText(dto.reason) ?? dto.reason,
      details: sanitizeRichText(dto.details) ?? null,
      status: ReportStatus.PENDING,
    });

    const saved = await this.reportsRepository.save(report);

    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async listMyReports(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.reportsRepository.findAndCount({
      where: { reporterId: userId },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data: items.map((item) => ({
        id: item.id,
        reportableType: item.reportableType,
        reportableId: item.reportableId,
        reason: item.reason,
        details: item.details,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        resolvedAt: item.resolvedAt?.toISOString() ?? null,
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  private async assertReportableExists(reportableType: ReportableType, reportableId: string) {
    const existsByType = {
      [ReportableType.TRACK]: () => this.tracksRepository.existsBy({ id: reportableId }),
      [ReportableType.COMMENT]: () => this.commentsRepository.existsBy({ id: reportableId }),
      [ReportableType.USER]: () => this.usersRepository.existsBy({ id: reportableId }),
      [ReportableType.PLAYLIST]: () => this.playlistsRepository.existsBy({ id: reportableId }),
    };

    const exists = await existsByType[reportableType]();
    if (!exists) {
      throw new NotFoundException('Report target not found');
    }
  }
}
