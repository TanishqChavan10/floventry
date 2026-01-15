/**
 * Time utilities for creating test dates with expiry scenarios
 */
export class TimeUtils {
    /**
     * Create a date in the past (expired)
     * @param daysAgo Number of days before today (default: 1)
     */
    static createExpiredDate(daysAgo: number = 1): Date {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setUTCHours(23, 59, 59, 999); // End of day
        return date;
    }

    /**
     * Create a date in near future (expiring soon)
     * @param daysFromNow Number of days from today (default: 15)
     */
    static createExpiringSoonDate(daysFromNow: number = 15): Date {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        date.setUTCHours(23, 59, 59, 999);
        return date;
    }

    /**
     * Create a date in distant future (OK status)
     * @param daysFromNow Number of days from today (default: 60)
     */
    static createFutureDate(daysFromNow: number = 60): Date {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        date.setUTCHours(23, 59, 59, 999);
        return date;
    }

    /**
     * Get current date/time for comparisons
     */
    static now(): Date {
        return new Date();
    }
}
