import { Logger as TypeOrmLogger } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * Custom TypeORM logger that highlights slow queries.
 * Logs queries exceeding the threshold with full SQL and parameters.
 */
export class SlowQueryLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');
  private readonly slowThresholdMs: number;
  private readonly isDev: boolean;

  constructor(slowThresholdMs = 200) {
    this.slowThresholdMs = slowThresholdMs;
    this.isDev = process.env.NODE_ENV === 'development';
  }

  logQuery(query: string, parameters?: any[]) {
    if (this.isDev) {
      this.logger.debug(`Query: ${query.substring(0, 200)}`);
    }
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    this.logger.error(
      `Query failed: ${query.substring(0, 300)}`,
      typeof error === 'string' ? error : error.message,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(
      `SLOW QUERY (${time}ms): ${query.substring(0, 500)} -- params: ${JSON.stringify(parameters ?? []).substring(0, 200)}`,
    );
  }

  logSchemaBuild(message: string) {
    this.logger.log(message);
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    switch (level) {
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        if (this.isDev) {
          this.logger.debug(message);
        }
    }
  }
}
