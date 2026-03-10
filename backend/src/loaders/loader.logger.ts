import { Logger } from '@nestjs/common';

const logger = new Logger('DataLoader');

/**
 * Loader performance logger.
 * Tracks batch sizes and slow batches to detect performance issues.
 * Only logs in development or when a batch takes longer than the threshold.
 */
export function logLoaderBatch(
  loaderName: string,
  batchSize: number,
  durationMs: number,
): void {
  const slowThresholdMs = 200;

  if (durationMs > slowThresholdMs) {
    logger.warn(
      `[SLOW] ${loaderName}: batch=${batchSize} ids, took ${durationMs}ms`,
    );
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug(
      `${loaderName}: batch=${batchSize} ids, took ${durationMs}ms`,
    );
  }
}
