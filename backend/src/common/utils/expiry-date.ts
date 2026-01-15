export function normalizeExpiryToEndOfDayUTC(expiry: Date): Date {
    const normalized = new Date(expiry);

    // If the value looks like a date-only input (00:00:00.000 UTC),
    // treat expiry as end-of-day UTC for "expires at end of day" semantics.
    if (
        normalized.getUTCHours() === 0 &&
        normalized.getUTCMinutes() === 0 &&
        normalized.getUTCSeconds() === 0 &&
        normalized.getUTCMilliseconds() === 0
    ) {
        normalized.setUTCHours(23, 59, 59, 999);
    }

    return normalized;
}

export function isExpiryInPastEndOfDay(expiry: Date, now: Date = new Date()): boolean {
    return normalizeExpiryToEndOfDayUTC(expiry).getTime() < now.getTime();
}

export function endOfDayUtcFromNowPlusDays(days: number, now: Date = new Date()): Date {
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() + days);
    cutoff.setUTCHours(23, 59, 59, 999);
    return cutoff;
}
