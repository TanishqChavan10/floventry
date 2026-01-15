import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, IsNull } from 'typeorm';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { isExpiryInPastEndOfDay, endOfDayUtcFromNowPlusDays } from '../common/utils/expiry-date';

@Injectable()
export class ExpiryScannerService {
    private readonly logger = new Logger(ExpiryScannerService.name);
    private readonly EXPIRY_WARNING_DAYS = parseInt(process.env.EXPIRY_WARNING_DAYS || '30', 10);

    constructor(
        @InjectRepository(StockLot)
        private stockLotRepository: Repository<StockLot>,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Daily cron job to scan for expiry status changes
     * Runs at midnight UTC
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
        name: 'daily-expiry-scan',
        timeZone: 'UTC',
    })
    async handleDailyExpiryScan() {
        // Feature flag guard
        if (!process.env.EXPIRY_SCAN_ENABLED || process.env.EXPIRY_SCAN_ENABLED !== 'true') {
            this.logger.debug('Expiry scan is disabled via EXPIRY_SCAN_ENABLED flag');
            return;
        }

        this.logger.log('Starting daily expiry scan');

        try {
            await this.scanExpiryStatuses();
            this.logger.log('Completed daily expiry scan successfully');
        } catch (error) {
            this.logger.error('Expiry scan failed', error.stack);
        }
    }

    /**
     * Core scanning logic
     * Queries active lots and triggers notifications based on expiry status
     */
    async scanExpiryStatuses(): Promise<void> {
        this.logger.log('Querying active stock lots with expiry dates');

        // Query all active lots with expiry dates
        const lots = await this.stockLotRepository.find({
            where: {
                quantity: MoreThan(0),
                expiry_date: Not(IsNull()),
                company_id: Not(IsNull()), // Tenant safety
            },
            relations: ['product', 'warehouse'],
            order: { expiry_date: 'ASC' }, // Process soonest expiries first
        });

        this.logger.log(`Found ${lots.length} active lots with expiry dates`);

        let expiredCount = 0;
        let expiringSoonCount = 0;
        let errorCount = 0;

        // Process each lot
        for (const lot of lots) {
            try {
                await this.checkAndNotifyLot(lot);

                // Categorize for logging
                const now = new Date();
                if (isExpiryInPastEndOfDay(lot.expiry_date, now)) {
                    expiredCount++;
                } else {
                    const warningCutoff = endOfDayUtcFromNowPlusDays(this.EXPIRY_WARNING_DAYS, now);
                    if (lot.expiry_date <= warningCutoff) {
                        expiringSoonCount++;
                    }
                }
            } catch (error) {
                errorCount++;
                this.logger.error(
                    `Failed to process lot ${lot.id} for product ${lot.product?.name || 'unknown'}`,
                    error.stack,
                );
                // Continue processing other lots
            }
        }

        this.logger.log(
            `Expiry scan summary: ${lots.length} total, ${expiredCount} expired, ${expiringSoonCount} expiring soon, ${errorCount} errors`,
        );
    }

    /**
     * Check a single lot and trigger notifications if needed
     * Deduplication is handled by the NotificationsService
     */
    private async checkAndNotifyLot(lot: StockLot): Promise<void> {
        const now = new Date();

        // Check if expired
        if (isExpiryInPastEndOfDay(lot.expiry_date, now)) {
            await this.notificationsService.notifyExpired(
                lot.company_id,
                lot.id,
                lot.product.name,
                lot.warehouse_id,
                lot.expiry_date,
                lot.quantity,
            );
            return;
        }

        // Check if expiring soon (within warning threshold)
        const warningCutoff = endOfDayUtcFromNowPlusDays(this.EXPIRY_WARNING_DAYS, now);
        if (lot.expiry_date <= warningCutoff) {
            await this.notificationsService.notifyExpiringSoon(
                lot.company_id,
                lot.id,
                lot.product.name,
                lot.warehouse_id,
                lot.expiry_date,
                lot.quantity,
            );
        }

        // If neither expired nor expiring soon, no notification needed (status: OK)
    }

    /**
     * Manual trigger (for testing or admin purposes)
     */
    async triggerManualScan(): Promise<{
        success: boolean;
        lotsScanned: number;
        message: string;
    }> {
        this.logger.log('Manual expiry scan triggered');

        try {
            const lots = await this.stockLotRepository.count({
                where: {
                    quantity: MoreThan(0),
                    expiry_date: Not(IsNull()),
                },
            });

            await this.scanExpiryStatuses();

            return {
                success: true,
                lotsScanned: lots,
                message: `Successfully scanned ${lots} lots`,
            };
        } catch (error) {
            this.logger.error('Manual scan failed', error.stack);
            return {
                success: false,
                lotsScanned: 0,
                message: `Scan failed: ${error.message}`,
            };
        }
    }
}
