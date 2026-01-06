import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationType, NotificationSeverity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    /**
     * Create notifications with warehouse-aware deduplication
     */
    async create(
        companyId: string,
        userIds: string[],
        type: NotificationType,
        severity: NotificationSeverity,
        entityType: string,
        entityId: string,
        title: string,
        message: string,
        metadata?: any,
    ): Promise<Notification[]> {
        // For continuous state notifications, check deduplication
        const continuousTypes = [
            NotificationType.STOCK_LOW,
            NotificationType.STOCK_CRITICAL,
            NotificationType.STOCK_EXPIRED,
            NotificationType.STOCK_EXPIRING_SOON,
        ];

        if (continuousTypes.includes(type)) {
            const warehouseId = metadata?.warehouseId;

            // Check existing unread notifications
            const existing = await this.notificationRepository
                .createQueryBuilder('n')
                .where('n.company_id = :companyId', { companyId })
                .andWhere('n.entity_id = :entityId', { entityId })
                .andWhere('n.type = :type', { type })
                .andWhere('n.read_at IS NULL')
                .andWhere(warehouseId ? `n.metadata->>'warehouseId' = :warehouseId` : '1=1', { warehouseId })
                .getMany();

            const existingUserIds = new Set(existing.map((n) => n.user_id));

            // Only create for users who don't already have this notification
            userIds = userIds.filter((id) => !existingUserIds.has(id));

            if (userIds.length === 0) {
                return []; // All users already notified
            }
        }

        const notifications = userIds.map((userId) =>
            this.notificationRepository.create({
                company_id: companyId,
                user_id: userId,
                type,
                severity,
                entity_type: entityType,
                entity_id: entityId,
                title,
                message,
                metadata,
                read_at: null,
            }),
        );

        return this.notificationRepository.save(notifications);
    }

    /**
     * Get notifications for a user (paginated)
     */
    async getForUser(
        userId: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: {
                user_id: userId,
                read_at: IsNull(),
            },
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOneOrFail({
            where: { id },
        });

        notification.read_at = new Date();
        return this.notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await this.notificationRepository.update(
            {
                user_id: userId,
                read_at: IsNull(),
            },
            {
                read_at: new Date(),
            },
        );

        return result.affected || 0;
    }

    /**
     * Auto-mark notifications by entity and type (for state transitions)
     */
    async markAsReadByEntityAndType(
        entityId: string,
        type: NotificationType,
        warehouseId?: string,
    ): Promise<void> {
        const query = this.notificationRepository
            .createQueryBuilder()
            .update(Notification)
            .set({ read_at: new Date() })
            .where('entity_id = :entityId', { entityId })
            .andWhere('type = :type', { type })
            .andWhere('read_at IS NULL');

        if (warehouseId) {
            query.andWhere(`metadata->>'warehouseId' = :warehouseId`, { warehouseId });
        }

        await query.execute();
    }

    /**
     * Resolve recipients based on RBAC and warehouse scope
     * OWNER & ADMIN: All company notifications
     * MANAGER: Only assigned warehouse notifications
     * STAFF: No notifications (view-only)
     */
    private async resolveRecipients(
        companyId: string,
        warehouseId?: string,
    ): Promise<string[]> {
        // For now, simplified implementation - get OWNER and ADMIN for all notifications
        // In production, you would query UserCompany and UserWarehouse tables

        // TODO: Full implementation would be:
        // 1. Query UserCompany for OWNER/ADMIN roles
        // 2. If warehouseId provided: Query UserWarehouse for MANAGER assignments
        // 3. Filter active users only
        // 4. Return user IDs

        // Placeholder: Return empty array for now
        // This will be fully implemented in next phase when we have user management ready
        return [];
    }

    // ========== Notification Type Helpers ==========

    /**
     * STOCK_LOW notification
     */
    async notifyStockLow(
        companyId: string,
        productId: string,
        productName: string,
        warehouseId: string,
        currentQty: number,
        reorderPoint: number,
    ): Promise<void> {
        try {
            const userIds = await this.resolveRecipients(companyId, warehouseId);

            await this.create(
                companyId,
                userIds,
                NotificationType.STOCK_LOW,
                NotificationSeverity.WARNING,
                'Product',
                productId,
                'Low Stock Alert',
                `${productName} is running low. Current: ${currentQty}, Reorder at: ${reorderPoint}`,
                { warehouseId, currentQty, reorderPoint },
            );
        } catch (error) {
            console.error('Failed to create STOCK_LOW notification:', error);
        }
    }

    /**
     * STOCK_CRITICAL notification (auto-resolves STOCK_LOW)
     */
    async notifyStockCritical(
        companyId: string,
        productId: string,
        productName: string,
        warehouseId: string,
        currentQty: number,
        minLevel: number,
    ): Promise<void> {
        try {
            // Auto-resolve any existing STOCK_LOW
            await this.markAsReadByEntityAndType(
                productId,
                NotificationType.STOCK_LOW,
                warehouseId,
            );

            const userIds = await this.resolveRecipients(companyId, warehouseId);

            await this.create(
                companyId,
                userIds,
                NotificationType.STOCK_CRITICAL,
                NotificationSeverity.CRITICAL,
                'Product',
                productId,
                'Critical Stock Level',
                `${productName} is critically low! Current: ${currentQty}, Minimum: ${minLevel}`,
                { warehouseId, currentQty, minLevel },
            );
        } catch (error) {
            console.error('Failed to create STOCK_CRITICAL notification:', error);
        }
    }

    /**
     * STOCK_EXPIRING_SOON notification
     */
    async notifyExpiringSoon(
        companyId: string,
        lotId: string,
        productName: string,
        warehouseId: string,
        expiryDate: Date,
        quantity: number,
    ): Promise<void> {
        try {
            const userIds = await this.resolveRecipients(companyId, warehouseId);

            await this.create(
                companyId,
                userIds,
                NotificationType.STOCK_EXPIRING_SOON,
                NotificationSeverity.WARNING,
                'StockLot',
                lotId,
                'Stock Expiring Soon',
                `${productName} (${quantity} units) expires on ${expiryDate.toLocaleDateString()}`,
                { warehouseId, expiryDate, quantity },
            );
        } catch (error) {
            console.error('Failed to create STOCK_EXPIRING_SOON notification:', error);
        }
    }

    /**
     * STOCK_EXPIRED notification
     */
    async notifyExpired(
        companyId: string,
        lotId: string,
        productName: string,
        warehouseId: string,
        expiryDate: Date,
        quantity: number,
    ): Promise<void> {
        try {
            const userIds = await this.resolveRecipients(companyId, warehouseId);

            await this.create(
                companyId,
                userIds,
                NotificationType.STOCK_EXPIRED,
                NotificationSeverity.CRITICAL,
                'StockLot',
                lotId,
                'Expired Stock',
                `${productName} (${quantity} units) has expired. Expired on: ${expiryDate.toLocaleDateString()}`,
                { warehouseId, expiryDate, quantity },
            );
        } catch (error) {
            console.error('Failed to create STOCK_EXPIRED notification:', error);
        }
    }

    /**
     * GRN_POSTED notification
     */
    async notifyGRNPosted(
        companyId: string,
        userIds: string[],
        grnId: string,
        grnNumber: string,
    ): Promise<void> {
        try {
            await this.create(
                companyId,
                userIds,
                NotificationType.GRN_POSTED,
                NotificationSeverity.INFO,
                'GRN',
                grnId,
                'GRN Posted',
                `Goods receipt ${grnNumber} has been posted successfully`,
            );
        } catch (error) {
            console.error('Failed to create GRN_POSTED notification:', error);
        }
    }

    /**
     * ISSUE_POSTED notification
     */
    async notifyIssuePosted(
        companyId: string,
        userIds: string[],
        issueId: string,
        issueNumber: string,
    ): Promise<void> {
        try {
            await this.create(
                companyId,
                userIds,
                NotificationType.ISSUE_POSTED,
                NotificationSeverity.INFO,
                'Issue',
                issueId,
                'Issue Posted',
                `Issue ${issueNumber} has been posted successfully`,
            );
        } catch (error) {
            console.error('Failed to create ISSUE_POSTED notification:', error);
        }
    }

    /**
     * TRANSFER_COMPLETED notification
     */
    async notifyTransferCompleted(
        companyId: string,
        userIds: string[],
        transferId: string,
        transferNumber: string,
    ): Promise<void> {
        try {
            await this.create(
                companyId,
                userIds,
                NotificationType.TRANSFER_COMPLETED,
                NotificationSeverity.INFO,
                'Transfer',
                transferId,
                'Transfer Completed',
                `Transfer ${transferNumber} has been completed successfully`,
            );
        } catch (error) {
            console.error('Failed to create TRANSFER_COMPLETED notification:', error);
        }
    }

    /**
     * IMPORT_COMPLETED notification
     */
    async notifyImportCompleted(
        companyId: string,
        userIds: string[],
        importType: string,
        successCount: number,
        failureCount: number,
    ): Promise<void> {
        try {
            const severity = failureCount > 0
                ? NotificationSeverity.WARNING
                : NotificationSeverity.INFO;

            const type = failureCount > 0
                ? NotificationType.IMPORT_PARTIAL_FAILURE
                : NotificationType.IMPORT_COMPLETED;

            await this.create(
                companyId,
                userIds,
                type,
                severity,
                'Import',
                `import-${Date.now()}`, // Generate unique ID
                failureCount > 0 ? 'Import Completed with Errors' : 'Import Completed',
                `${importType} import completed. Success: ${successCount}, Failed: ${failureCount}`,
                { successCount, failureCount, importType },
            );
        } catch (error) {
            console.error('Failed to create IMPORT notification:', error);
        }
    }
}
