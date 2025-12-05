import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    async create(data: Partial<Notification>) {
        const notification = this.notificationRepository.create(data);
        return this.notificationRepository.save(notification);
    }

    async findAll(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(id: string, userId: string) {
        await this.notificationRepository.update({ id, userId }, { isRead: true });
        return { success: true };
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
        return { success: true };
    }
}
