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
 * Format a percentage with sign (+3.2%, -1.5%)
 */
export function formatPercent(n: number, decimals: number = 1): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

/**
 * Format a date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'compact' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'compact':
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

/**
 * Format a date for compact display (Jan 2024)
 */
export function formatCompactDate(date: Date | string): string {
  return formatDate(date, 'compact');
}

/**
 * Format number for axis labels (no decimal for thousands)
 */
export function formatAxisNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  return n.toString();
}
