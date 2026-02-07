import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatFullNumber,
  formatPercent,
  formatPercentage,
  formatDate,
} from '@/lib/format';

describe('formatNumber', () => {
  it('formats millions with one decimal', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(2_000_000)).toBe('2.0M');
  });

  it('formats thousands without decimals', () => {
    expect(formatNumber(5_000)).toBe('5K');
    expect(formatNumber(1_234)).toBe('1K');
    expect(formatNumber(999_999)).toBe('1000K');
  });

  it('formats numbers under 1000 with locale string', () => {
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatFullNumber', () => {
  it('formats with comma separators', () => {
    expect(formatFullNumber(1_234_567)).toBe('1,234,567');
    expect(formatFullNumber(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages with plus sign', () => {
    expect(formatPercent(3.2)).toBe('+3.2%');
    expect(formatPercent(0)).toBe('+0.0%');
  });

  it('formats negative percentages with minus sign', () => {
    expect(formatPercent(-1.5)).toBe('-1.5%');
  });

  it('respects decimal parameter', () => {
    expect(formatPercent(3.256, 2)).toBe('+3.26%');
  });
});

describe('formatPercentage', () => {
  it('formats without sign', () => {
    expect(formatPercentage(85.3)).toBe('85.3%');
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('respects decimal parameter', () => {
    expect(formatPercentage(85.346, 2)).toBe('85.35%');
  });
});

describe('formatDate', () => {
  it('formats dates in short style', () => {
    const result = formatDate('2024-06-15', 'short', 'en-GB');
    expect(result).toContain('Jun');
    expect(result).toContain('2024');
  });

  it('formats dates in long style', () => {
    const result = formatDate('2024-06-15', 'long', 'en-GB');
    expect(result).toContain('June');
    expect(result).toContain('2024');
  });

  it('formats dates in compact style', () => {
    const result = formatDate('2024-06-15', 'compact', 'en-GB');
    expect(result).toContain('Jun');
    expect(result).toContain('2024');
    expect(result).not.toContain('15');
  });

  it('accepts Date objects', () => {
    const result = formatDate(new Date(2024, 5, 15), 'short', 'en-GB');
    expect(result).toContain('Jun');
    expect(result).toContain('2024');
  });

  it('defaults to short style', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('2024');
  });
});
