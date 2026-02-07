import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  QueryRidershipParams,
  QueryRidershipResult,
  CompareCitiesParams,
  CompareCitiesResult,
  GetStatisticsParams,
  GetStatisticsResult,
  GetRecoveryDataParams,
  GetRecoveryDataResult,
  GetDayOfWeekPatternsParams,
  GetDayOfWeekPatternsResult,
  GetAnomaliesParams,
  GetAnomaliesResult,
  DateRange,
  DowDataRow,
  AnomalyEntry,
} from './types';
import type { CityId } from '@/types/shared';

// ---- Data loading (cached at module level for serverless perf) ----

const dataCache = new Map<string, unknown>();

function loadJson<T>(relativePath: string): T {
  if (dataCache.has(relativePath)) {
    return dataCache.get(relativePath) as T;
  }
  const fullPath = join(process.cwd(), 'data', relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(raw) as T;
  dataCache.set(relativePath, parsed);
  return parsed;
}

// ---- Helpers ----

function getDateField(
  record: Record<string, unknown>,
  aggregation: string,
  city: CityId,
): string {
  if (aggregation === 'weekly' && city === 'nyc') {
    return record.weekStart as string;
  }
  if (aggregation === 'monthly' && city === 'nyc') {
    return record.month as string;
  }
  return record.date as string;
}

function filterByDateRange<T extends Record<string, unknown>>(
  data: T[],
  range: DateRange,
  dateExtractor: (r: T) => string,
): T[] {
  return data.filter((r) => {
    const d = dateExtractor(r);
    return d >= range.start && d <= range.end;
  });
}

function capRecords<T>(data: T[], cap: number): T[] {
  if (data.length <= cap) return data;
  // Return first half and last half
  const half = Math.floor(cap / 2);
  return [...data.slice(0, half), ...data.slice(-half)];
}

function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getDayOfWeek(dateStr: string): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

function sampleEvenly<T>(data: T[], targetCount: number): T[] {
  if (data.length <= targetCount) return data;
  const step = (data.length - 1) / (targetCount - 1);
  const result: T[] = [];
  for (let i = 0; i < targetCount; i++) {
    result.push(data[Math.round(i * step)]);
  }
  return result;
}

// ---- Tool 1: query_ridership ----

export function queryRidership(
  params: QueryRidershipParams,
): QueryRidershipResult {
  const { city, modes, date_range, aggregation } = params;

  let filePath: string;
  if (aggregation === 'daily') filePath = `${city}/daily.json`;
  else if (aggregation === 'weekly') filePath = `${city}/weekly.json`;
  else filePath = `${city}/monthly.json`;

  const rawData = loadJson<Record<string, unknown>[]>(filePath);

  const filtered = filterByDateRange(rawData, date_range, (r) =>
    getDateField(r, aggregation, city),
  );

  const data = filtered.map((record) => {
    const row: Record<string, number | string> = {};

    // Set date field
    const dateVal = getDateField(record, aggregation, city);
    if (aggregation === 'weekly' && city === 'nyc') {
      row.weekStart = record.weekStart as string;
      row.weekEnd = record.weekEnd as string;
    } else if (aggregation === 'monthly' && city === 'nyc') {
      row.month = dateVal;
    } else {
      row.date = dateVal;
    }

    // Include requested modes
    for (const mode of modes) {
      const val = record[mode];
      if (val !== undefined && val !== null) {
        row[mode] = val as number;
      }
    }

    // Include total
    if (record.total !== undefined) {
      row.total = record.total as number;
    }

    return row;
  });

  const capped = capRecords(data, 100);

  return {
    city,
    aggregation,
    date_range,
    record_count: filtered.length,
    data: capped,
  };
}

// ---- Tool 2: compare_cities ----

export function compareCities(
  params: CompareCitiesParams,
): CompareCitiesResult {
  const {
    metric,
    modes_nyc,
    modes_london,
    date_range,
    aggregation = 'monthly',
  } = params;

  if (metric === 'dow_pattern') {
    return compareDowPatterns(modes_nyc, modes_london, date_range);
  }

  if (metric === 'recovery') {
    return compareRecovery(modes_nyc, modes_london, date_range);
  }

  // Default: ridership comparison
  const nycResult = queryRidership({
    city: 'nyc',
    modes: modes_nyc,
    date_range,
    aggregation,
  });
  const londonResult = queryRidership({
    city: 'london',
    modes: modes_london,
    date_range,
    aggregation,
  });

  return {
    metric: 'ridership',
    date_range,
    nyc: {
      modes: modes_nyc,
      data: nycResult.data,
      summary: computeSummary(nycResult.data),
    },
    london: {
      modes: modes_london,
      data: londonResult.data,
      summary: computeSummary(londonResult.data),
    },
  };
}

function compareDowPatterns(
  modesNyc: string[],
  modesLondon: string[],
  dateRange: DateRange,
): CompareCitiesResult {
  const nycDow = getDayOfWeekPatterns({ city: 'nyc', modes: modesNyc });
  const londonDow = getDayOfWeekPatterns({ city: 'london', modes: modesLondon });

  return {
    metric: 'dow_pattern',
    date_range: dateRange,
    nyc: {
      modes: modesNyc,
      data: nycDow.data as Array<Record<string, number | string>>,
      summary: {
        avg_total: nycDow.insights.weekday_avg,
        min_total: nycDow.insights.weekend_avg,
        max_total: nycDow.insights.weekday_avg,
      },
    },
    london: {
      modes: modesLondon,
      data: londonDow.data as Array<Record<string, number | string>>,
      summary: {
        avg_total: londonDow.insights.weekday_avg,
        min_total: londonDow.insights.weekend_avg,
        max_total: londonDow.insights.weekday_avg,
      },
    },
  };
}

function compareRecovery(
  modesNyc: string[],
  modesLondon: string[],
  dateRange: DateRange,
): CompareCitiesResult {
  const nycRec = getRecoveryData({
    city: 'nyc',
    modes: modesNyc,
    date_range: dateRange,
  });
  const londonRec = getRecoveryData({
    city: 'london',
    modes: modesLondon,
    date_range: dateRange,
  });

  return {
    metric: 'recovery',
    date_range: dateRange,
    nyc: {
      modes: modesNyc,
      data: nycRec.data as Array<Record<string, number | string>>,
      summary: { avg_total: 0, min_total: 0, max_total: 0 },
    },
    london: {
      modes: modesLondon,
      data: londonRec.data as Array<Record<string, number | string>>,
      summary: { avg_total: 0, min_total: 0, max_total: 0 },
    },
  };
}

function computeSummary(data: Array<Record<string, number | string>>): {
  avg_total: number;
  min_total: number;
  max_total: number;
} {
  const totals = data
    .map((r) => (typeof r.total === 'number' ? r.total : 0))
    .filter((t) => t > 0);
  if (totals.length === 0)
    return { avg_total: 0, min_total: 0, max_total: 0 };
  return {
    avg_total: Math.round(computeMean(totals)),
    min_total: Math.min(...totals),
    max_total: Math.max(...totals),
  };
}

// ---- Tool 3: get_statistics ----

export function getStatistics(
  params: GetStatisticsParams,
): GetStatisticsResult {
  const { city, mode, date_range } = params;

  const rawData = loadJson<Record<string, unknown>[]>(`${city}/daily.json`);

  const filtered = filterByDateRange(rawData, date_range, (r) =>
    r.date as string,
  );

  const values: Array<{ value: number; date: string }> = [];
  for (const record of filtered) {
    const val = record[mode];
    if (val !== undefined && val !== null && typeof val === 'number') {
      values.push({ value: val, date: record.date as string });
    }
  }

  if (values.length === 0) {
    return {
      city,
      mode,
      date_range,
      record_count: 0,
      statistics: {
        mean: 0,
        median: 0,
        min: { value: 0, date: '' },
        max: { value: 0, date: '' },
        std_dev: 0,
        trend: 'stable',
        trend_pct_change: 0,
      },
    };
  }

  const nums = values.map((v) => v.value);
  const mean = computeMean(nums);
  const median = computeMedian(nums);
  const stdDev = computeStdDev(nums, mean);

  let minEntry = values[0];
  let maxEntry = values[0];
  for (const v of values) {
    if (v.value < minEntry.value) minEntry = v;
    if (v.value > maxEntry.value) maxEntry = v;
  }

  // Trend: compare average of first 30 days vs last 30 days
  const first30 = values.slice(0, Math.min(30, values.length));
  const last30 = values.slice(-Math.min(30, values.length));
  const firstAvg = computeMean(first30.map((v) => v.value));
  const lastAvg = computeMean(last30.map((v) => v.value));

  const trendPctChange =
    firstAvg === 0 ? 0 : ((lastAvg - firstAvg) / firstAvg) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (trendPctChange > 5) trend = 'increasing';
  else if (trendPctChange < -5) trend = 'decreasing';
  else trend = 'stable';

  return {
    city,
    mode,
    date_range,
    record_count: values.length,
    statistics: {
      mean: Math.round(mean),
      median: Math.round(median),
      min: { value: minEntry.value, date: minEntry.date },
      max: { value: maxEntry.value, date: maxEntry.date },
      std_dev: Math.round(stdDev),
      trend,
      trend_pct_change: Math.round(trendPctChange * 100) / 100,
    },
  };
}

// ---- Tool 4: get_recovery_data ----

export function getRecoveryData(
  params: GetRecoveryDataParams,
): GetRecoveryDataResult {
  const { city, modes, date_range } = params;

  const rawData = loadJson<Record<string, unknown>[]>(
    `${city}/recovery.json`,
  );

  let filtered: Record<string, unknown>[];
  if (date_range) {
    filtered = filterByDateRange(rawData, date_range, (r) =>
      r.date as string,
    );
  } else {
    filtered = rawData;
  }

  // Build recovery field names
  const pctFields = modes.map((m) => `${m}Pct`);

  const data = filtered.map((record) => {
    const row: Record<string, number | string | null> = {
      date: record.date as string,
    };
    for (const field of pctFields) {
      const val = record[field];
      if (val !== undefined) {
        // NYC uses decimals (0.73), London uses percentages (92)
        // Normalize: store as-is in data, normalize in latest
        row[field] = val as number | null;
      }
    }
    return row;
  });

  const capped = sampleEvenly(data, 100);

  // Compute latest recovery per mode
  const latest: Record<string, { recovery_pct: number; date: string }> = {};
  for (const mode of modes) {
    const field = `${mode}Pct`;
    // Walk backwards to find last non-null value
    for (let i = filtered.length - 1; i >= 0; i--) {
      const val = filtered[i][field];
      if (val !== null && val !== undefined && typeof val === 'number') {
        // Normalize to percentage: NYC decimals -> multiply by 100, London already percentage
        const normalized = city === 'nyc' ? val * 100 : val;
        latest[mode] = {
          recovery_pct: Math.round(normalized * 100) / 100,
          date: filtered[i].date as string,
        };
        break;
      }
    }
  }

  const actualRange: DateRange = {
    start:
      date_range?.start ??
      (filtered.length > 0 ? (filtered[0].date as string) : ''),
    end:
      date_range?.end ??
      (filtered.length > 0
        ? (filtered[filtered.length - 1].date as string)
        : ''),
  };

  return {
    city,
    modes,
    date_range: actualRange,
    record_count: filtered.length,
    data: capped,
    latest,
  };
}

// ---- Tool 5: get_day_of_week_patterns ----

export function getDayOfWeekPatterns(
  params: GetDayOfWeekPatternsParams,
): GetDayOfWeekPatternsResult {
  const { city, modes } = params;

  const rawData = loadJson<Record<string, unknown>[]>(`${city}/dow.json`);

  const dayOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const data: DowDataRow[] = rawData.map((record) => {
    const dayName =
      city === 'nyc'
        ? (record.dayOfWeek as string)
        : (record.dayName as string);

    const row: DowDataRow = { day: dayName, total: 0 };

    let total = 0;
    for (const mode of modes) {
      // NYC fields: avgSubway, avgBus, etc. London fields: avgTube, avgBus, etc.
      const fieldName = `avg${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
      const val = record[fieldName];
      if (val !== undefined && val !== null && typeof val === 'number') {
        row[mode] = Math.round(val);
        total += val;
      }
    }
    row.total = Math.round(total);

    return row;
  });

  // Sort by day order
  data.sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day),
  );

  // Compute insights
  const weekdayData = data.filter((d) =>
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d.day),
  );
  const weekendData = data.filter((d) =>
    ['Saturday', 'Sunday'].includes(d.day),
  );

  const weekdayAvg = Math.round(
    computeMean(weekdayData.map((d) => d.total)),
  );
  const weekendAvg = Math.round(
    computeMean(weekendData.map((d) => d.total)),
  );

  let peakDay = data[0];
  let troughDay = data[0];
  for (const d of data) {
    if (d.total > peakDay.total) peakDay = d;
    if (d.total < troughDay.total) troughDay = d;
  }

  return {
    city,
    modes,
    data,
    insights: {
      peak_day: peakDay.day,
      trough_day: troughDay.day,
      weekday_avg: weekdayAvg,
      weekend_avg: weekendAvg,
      weekday_weekend_ratio:
        weekendAvg === 0
          ? 0
          : Math.round((weekdayAvg / weekendAvg) * 100) / 100,
    },
  };
}

// ---- Tool 6: get_anomalies ----

export function getAnomalies(params: GetAnomaliesParams): GetAnomaliesResult {
  const { city, mode, date_range, threshold = 2.0 } = params;

  const rawData = loadJson<Record<string, unknown>[]>(`${city}/daily.json`);

  const filtered = filterByDateRange(rawData, date_range, (r) =>
    r.date as string,
  );

  const values: Array<{ value: number; date: string }> = [];
  for (const record of filtered) {
    const val = record[mode];
    if (val !== undefined && val !== null && typeof val === 'number') {
      values.push({ value: val, date: record.date as string });
    }
  }

  if (values.length === 0) {
    return {
      city,
      mode,
      date_range,
      threshold,
      baseline: { mean: 0, std_dev: 0 },
      anomalies: [],
      anomaly_count: 0,
    };
  }

  const nums = values.map((v) => v.value);
  const mean = computeMean(nums);
  const stdDev = computeStdDev(nums, mean);

  const anomalies: AnomalyEntry[] = [];

  if (stdDev > 0) {
    for (const v of values) {
      const deviation = (v.value - mean) / stdDev;
      if (Math.abs(deviation) >= threshold) {
        anomalies.push({
          date: v.date,
          value: v.value,
          deviation: Math.round(deviation * 100) / 100,
          direction: deviation > 0 ? 'high' : 'low',
          day_of_week: getDayOfWeek(v.date),
        });
      }
    }
  }

  // Sort by absolute deviation (most extreme first)
  anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  // Cap at 20
  const capped = anomalies.slice(0, 20);

  return {
    city,
    mode,
    date_range,
    threshold,
    baseline: { mean: Math.round(mean), std_dev: Math.round(stdDev) },
    anomalies: capped,
    anomaly_count: capped.length,
  };
}
