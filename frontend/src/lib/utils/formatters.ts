/**
 * Formats a number as Indian Rupee with proper comma separators
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with ₹ symbol and Indian comma separators
 */
export function formatIndianRupee(amount: number, decimals: number = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }

  // Convert to fixed decimal places
  const fixedAmount = amount.toFixed(decimals);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  // Apply Indian number formatting (lakh, crore system)
  const formattedInteger = integerPart.replace(/\B(?=(?:(\d{3})+(?!\d))|(?:(\d{2})+(?=\d{3})))/g, ',');
  
  // Combine with decimals if needed
  if (decimals > 0) {
    return `₹${formattedInteger}.${decimalPart}`;
  } else {
    return `₹${formattedInteger}`;
  }
}

/**
 * Formats a number as Indian Rupee without decimals
 * @param amount - The amount to format
 * @returns Formatted string with ₹ symbol and no decimals
 */
export function formatIndianRupeeWhole(amount: number): string {
  return formatIndianRupee(amount, 0);
}

/**
 * Alternative implementation using Intl.NumberFormat for Indian locale
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with ₹ symbol
 */
export function formatIndianRupeeIntl(amount: number, decimals: number = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(amount);
}

/**
 * Parse a formatted rupee string back to number
 * @param formattedAmount - String like "₹12,34,567.50"
 * @returns Number value
 */
export function parseIndianRupee(formattedAmount: string): number {
  if (!formattedAmount) return 0;
  
  // Remove ₹ symbol and commas, then parse
  const cleanAmount = formattedAmount.replace(/₹|,/g, '');
  const parsed = parseFloat(cleanAmount);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format money for display in tables and cards
 * @param amount - The amount to format
 * @returns Compact formatted string
 */
export function formatMoney(amount: number): string {
  return formatIndianRupee(amount, 2);
}

/**
 * Format large amounts with K, L, Cr abbreviations
 * @param amount - The amount to format
 * @returns Abbreviated formatted string
 */
export function formatMoneyCompact(amount: number): string {
  if (amount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 Thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return formatIndianRupee(amount, 0);
  }
}