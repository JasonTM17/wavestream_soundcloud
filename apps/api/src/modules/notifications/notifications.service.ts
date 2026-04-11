import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationType } from '@wavestream/shared';
import { Repository } from 'typeorm';
import { createPaginationMeta, normalizePagination } from 'src/common/utils/pagination.util';
import { NotificationEntity } from 'src/database/entities/notification.entity';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(userId: string, type: NotificationType, data: Record<string, unknown>) {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      data,
      read: false,
    });
    const saved = await this.notificationsRepository.save(notification);

    this.notificationsGateway.emitToUser(userId, 'notification:new', saved);

    return saved;
  }

  async getNotifications(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data: items.map((item) => ({
        id: item.id,
        type: item.type,
        data: item.data ?? {},
        read: item.read,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOneByOrFail({
      id: notificationId,
      userId,
    });
    notification.read = true;
    await this.notificationsRepository.save(notification);

    return {
      id: notification.id,
      read: true,
    };
  }

  async markAllRead(userId: string) {
    await this.notificationsRepository.update({ userId }, { read: true });
    return { updated: true };
  }
}
