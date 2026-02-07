import { format, parse } from 'date-fns';

/**
 * Format a large number with compact notation (e.g., 1.2M, 3.5K)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

/**
 * Format a percentage (e.g., 85.3%)
 */
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a date string (ISO format) to a readable format
 */
export function formatDate(
  dateStr: string,
  formatStr: string = 'MMM d, yyyy'
): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, formatStr);
}

/**
 * Format a month string (YYYY-MM) to readable format
 */
export function formatMonth(monthStr: string): string {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(date, 'MMM yyyy');
}

/**
 * Format a change value with + or - prefix
 */
export function formatChange(num: number, decimals: number = 1): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

/**
 * Get color class for positive/negative change
 */
export function getChangeColor(num: number): string {
  if (num > 0) return 'text-green-500';
  if (num < 0) return 'text-red-500';
  return 'text-muted-foreground';
}
