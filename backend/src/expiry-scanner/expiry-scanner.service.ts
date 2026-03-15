import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, IsNull } from 'typeorm';
import { StockLot } from '../inventory/stock-lot/entities/stock-lot.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  isExpiryInPastEndOfDay,
  endOfDayUtcFromNowPlusDays,
} from '../common/utils/expiry-date';

/** Standard-tier fixed warning window (days). */
const STANDARD_EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class ExpiryScannerService implements OnModuleInit {
  private readonly logger = new Logger(ExpiryScannerService.name);

  private lastRunAt?: Date;
  private lastSuccessAt?: Date;
  private lastErrorAt?: Date;
  private lastErrorMessage?: string;

  constructor(
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(CompanySettings)
    private companySettingsRepository: Repository<CompanySettings>,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Optional dev/test hook to prove the scanner executes without waiting for midnight UTC.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.EXPIRY_SCAN_ENABLED === 'true' &&
      process.env.EXPIRY_SCAN_RUN_ON_START === 'true'
    ) {
      this.logger.log(
        'EXPIRY_SCAN_RUN_ON_START enabled; running expiry scan now',
      );
      await this.handleDailyExpiryScan();
    }
  }

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
    if (
      !process.env.EXPIRY_SCAN_ENABLED ||
      process.env.EXPIRY_SCAN_ENABLED !== 'true'
    ) {
      this.logger.debug('Expiry scan is disabled via EXPIRY_SCAN_ENABLED flag');
      return;
    }

    this.lastRunAt = new Date();
    this.logger.log('Starting daily expiry scan');

    try {
      await this.scanExpiryStatuses();
      this.lastSuccessAt = new Date();
      this.lastErrorAt = undefined;
      this.lastErrorMessage = undefined;
      this.logger.log('Completed daily expiry scan successfully');
    } catch (error) {
      this.lastErrorAt = new Date();
      this.lastErrorMessage = error?.message || 'Unknown error';
      this.logger.error('Expiry scan failed', error.stack);
    }
  }

  getRuntimeStatus(): {
    lastRunAt?: Date;
    lastSuccessAt?: Date;
    lastErrorAt?: Date;
    lastErrorMessage?: string;
  } {
    return {
      lastRunAt: this.lastRunAt,
      lastSuccessAt: this.lastSuccessAt,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  // ----------------------------------------------------------------
  //  Per-company warning-days resolution
  // ----------------------------------------------------------------

  /**
   * Resolve the effective expiry warning days for a company.
   * Uses the company's configured `expiry_warning_days`, falling back to 30.
   */
  private async getWarningDaysForCompany(
    companyId: string,
    settingsCache: Map<string, number>,
  ): Promise<number> {
    if (settingsCache.has(companyId)) {
      return settingsCache.get(companyId)!;
    }

    const settings = await this.companySettingsRepository.findOne({
      where: { company_id: companyId },
    });

    const warningDays =
      settings?.expiry_warning_days ?? STANDARD_EXPIRY_WARNING_DAYS;

    settingsCache.set(companyId, warningDays);
    return warningDays;
  }

  // ----------------------------------------------------------------
  //  Core scanning logic
  // ----------------------------------------------------------------

  /**
   * Queries active lots and triggers notifications based on expiry status.
   * Per-company aware: Pro companies use their custom warning window,
   * Standard companies always use the fixed 30-day window.
   */
  async scanExpiryStatuses(): Promise<void> {
    this.logger.log('Querying active stock lots with expiry dates');

    const lots = await this.stockLotRepository.find({
      where: {
        quantity: MoreThan(0),
        expiry_date: Not(IsNull()),
        company_id: Not(IsNull()),
      },
      relations: ['product', 'warehouse'],
      order: { expiry_date: 'ASC' },
    });

    this.logger.log(`Found ${lots.length} active lots with expiry dates`);

    let expiredCount = 0;
    let expiringSoonCount = 0;
    let errorCount = 0;

    // Cache company settings to avoid repeated DB lookups
    const settingsCache = new Map<string, number>();

    for (const lot of lots) {
      try {
        const warningDays = await this.getWarningDaysForCompany(
          lot.company_id,
          settingsCache,
        );

        await this.checkAndNotifyLot(lot, warningDays);

        const now = new Date();
        if (isExpiryInPastEndOfDay(lot.expiry_date, now)) {
          expiredCount++;
        } else {
          const warningCutoff = endOfDayUtcFromNowPlusDays(warningDays, now);
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
      }
    }

    this.logger.log(
      `Expiry scan summary: ${lots.length} total, ${expiredCount} expired, ${expiringSoonCount} expiring soon, ${errorCount} errors`,
    );
  }

  /**
   * Check a single lot and trigger notifications if needed.
   * @param warningDays  Effective warning window (per-company, tier-aware).
   * Deduplication is handled by the NotificationsService.
   */
  private async checkAndNotifyLot(
    lot: StockLot,
    warningDays: number,
  ): Promise<void> {
    const now = new Date();

    // Expired → always notify (both tiers)
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

    // Expiring soon → use the tier-aware warning window
    const warningCutoff = endOfDayUtcFromNowPlusDays(warningDays, now);
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
