import { differenceInDays } from 'date-fns';

export type ExpiryStatus = 'OK' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

export interface LotWithExpiry {
    id: string;
    quantity: number;
    expiry_date: string | null;
    received_at: string;
}

function normalizeExpiryForComparison(expiryDate: string): Date {
    const expiry = new Date(expiryDate);

    // Backend now writes end-of-day, but older data and some inputs may still be date-only (00:00:00.000Z).
    // Treat those as expiring at end-of-day UTC.
    if (
        expiry.getUTCHours() === 0 &&
        expiry.getUTCMinutes() === 0 &&
        expiry.getUTCSeconds() === 0 &&
        expiry.getUTCMilliseconds() === 0
    ) {
        expiry.setUTCHours(23, 59, 59, 999);
    }

    return expiry;
}

/**
 * Calculate expiry status based on days until expiry
 * @param expiryDate - The expiry date string
 * @param warningDays - Days before expiry to show warning (default: 30)
 * @returns ExpiryStatus
 */
export function getExpiryStatus(
    expiryDate: string | null | undefined,
    warningDays: number = 30
): ExpiryStatus {
    if (!expiryDate) return 'NO_EXPIRY';

    const now = new Date();
    const expiry = normalizeExpiryForComparison(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, now);

    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= warningDays) return 'EXPIRING_SOON';
    return 'OK';
}

/**
 * Calculate days remaining until expiry
 * @param expiryDate - The expiry date string
 * @returns Number of days (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
    if (!expiryDate) return null;

    const now = new Date();
    const expiry = normalizeExpiryForComparison(expiryDate);
    return differenceInDays(expiry, now);
}

/**
 * Find the nearest (earliest) expiry date among a list of lots
 * @param lots - Array of lots with expiry dates
 * @returns The earliest expiry date or null if none
 */
export function getNearestExpiryDate(lots: LotWithExpiry[]): string | null {
    if (!lots || lots.length === 0) return null;

    const lotsWithExpiry = lots
        .filter((lot) => lot.expiry_date && lot.quantity > 0)
        .sort((a, b) => {
            if (!a.expiry_date || !b.expiry_date) return 0;
            return normalizeExpiryForComparison(a.expiry_date).getTime() - normalizeExpiryForComparison(b.expiry_date).getTime();
        });

    return lotsWithExpiry.length > 0 ? lotsWithExpiry[0].expiry_date : null;
}

/**
 * Get expiry status for a product based on its lots
 * @param lots - Array of lots for the product
 * @param warningDays - Days before expiry to show warning (default: 30)
 * @returns ExpiryStatus
 */
export function getProductExpiryStatus(
    lots: LotWithExpiry[],
    warningDays: number = 30
): ExpiryStatus {
    const nearestExpiry = getNearestExpiryDate(lots);
    return getExpiryStatus(nearestExpiry, warningDays);
}

/**
 * Calculate expiry statistics for a list of lots
 * @param lots - Array of lots with expiry dates
 * @returns Statistics object
 */
export function calculateExpiryStats(lots: LotWithExpiry[]) {
    const total = lots.length;
    let expired = 0;
    let expiringSoon = 0;
    let ok = 0;
    let noExpiry = 0;

    lots.forEach((lot) => {
        const status = getExpiryStatus(lot.expiry_date);
        switch (status) {
            case 'EXPIRED':
                expired++;
                break;
            case 'EXPIRING_SOON':
                expiringSoon++;
                break;
            case 'OK':
                ok++;
                break;
            case 'NO_EXPIRY':
                noExpiry++;
                break;
        }
    });

    return {
        total,
        expired,
        expiringSoon,
        ok,
        noExpiry,
    };
}

/**
 * Format expiry date for display
 * @param expiryDate - The expiry date string
 * @param daysRemaining - Days until expiry
 * @returns Formatted string
 */
export function formatExpiryDisplay(
    expiryDate: string | null,
    daysRemaining: number | null
): string {
    if (!expiryDate || daysRemaining === null) return 'N/A';

    if (daysRemaining < 0) {
        return `Expired ${Math.abs(daysRemaining)} days ago`;
    } else if (daysRemaining === 0) {
        return 'Expires today';
    } else if (daysRemaining === 1) {
        return 'Expires tomorrow';
    } else if (daysRemaining <= 7) {
        return `${daysRemaining} days left`;
    } else {
        return `${daysRemaining} days`;
    }
}
