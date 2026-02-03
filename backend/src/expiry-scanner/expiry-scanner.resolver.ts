import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronExpression } from '@nestjs/schedule';

import { ExpiryScannerService } from './expiry-scanner.service';
import { ExpiryScanResult, ExpiryScanStatus } from './expiry-scanner.types';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

const EXPIRY_SCAN_JOB_NAME = 'daily-expiry-scan';
const EXPIRY_SCAN_TIMEZONE = 'UTC';
const EXPIRY_SCAN_CRON_EXPRESSION = CronExpression.EVERY_DAY_AT_MIDNIGHT;

@Resolver()
export class ExpiryScannerResolver {
  constructor(
    private readonly expiryScannerService: ExpiryScannerService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Query(() => ExpiryScanStatus)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async expiryScanStatus(): Promise<ExpiryScanStatus> {
    const enabled = process.env.EXPIRY_SCAN_ENABLED === 'true';

    let jobRegistered = false;
    let nextRunAt: Date | undefined;

    try {
      const job = this.schedulerRegistry.getCronJob(EXPIRY_SCAN_JOB_NAME);
      jobRegistered = !!job;
      // cron nextDates() can return a moment-like object; Date conversion via toDate() when available.
      const next = (job as any).nextDates?.();
      nextRunAt =
        typeof next?.toDate === 'function' ? next.toDate() : undefined;
    } catch {
      jobRegistered = false;
    }

    const runtime = this.expiryScannerService.getRuntimeStatus();

    return {
      enabled,
      jobRegistered,
      jobName: EXPIRY_SCAN_JOB_NAME,
      timeZone: EXPIRY_SCAN_TIMEZONE,
      cronExpression: EXPIRY_SCAN_CRON_EXPRESSION,
      nextRunAt,
      lastRunAt: runtime.lastRunAt,
      lastSuccessAt: runtime.lastSuccessAt,
      lastErrorAt: runtime.lastErrorAt,
      lastErrorMessage: runtime.lastErrorMessage,
    };
  }

  @Mutation(() => ExpiryScanResult)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async triggerExpiryScan(): Promise<ExpiryScanResult> {
    return this.expiryScannerService.triggerManualScan();
  }
}
