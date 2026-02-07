/**
 * Format a number with compact notation (1.2M, 345K, etc.)
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }
  return n.toLocaleString();
}

/**
 * Format a number with comma separators (1,234,567)
 */
export function formatFullNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format a percentage with sign (+3.2%, -1.5%)
 */
export function formatPercent(n: number, decimals: number = 1): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

/**
 * Format a percentage without sign (85.3%)
 */
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  style: 'short' | 'long' | 'compact' = 'short',
  locale: string = 'en-GB'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  switch (style) {
    case 'long':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'compact':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
      });
    case 'short':
    default:
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}
