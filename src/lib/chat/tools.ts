import { z } from 'zod';
import { tool } from 'ai';
import {
  queryRidership,
  compareCities,
  getStatistics,
  getRecoveryData,
  getDayOfWeekPatterns,
  getAnomalies,
} from './tool-handlers';

const dateRangeSchema = z.object({
  start: z.string().describe('ISO date string, e.g. "2023-01-01"'),
  end: z.string().describe('ISO date string, e.g. "2024-12-31"'),
});

const queryRidershipSchema = z.object({
  city: z.enum(['nyc', 'london']).describe('The city to query'),
  modes: z
    .array(z.string())
    .describe(
      'Transit modes to include, e.g. ["subway", "bus"] for NYC or ["tube", "bus"] for London',
    ),
  date_range: dateRangeSchema.describe('Date range to query'),
  aggregation: z
    .enum(['daily', 'weekly', 'monthly'])
    .describe('How to aggregate the data'),
});

const compareCitiesSchema = z.object({
  metric: z
    .enum(['ridership', 'recovery', 'dow_pattern'])
    .describe('What to compare between cities'),
  modes_nyc: z
    .array(z.string())
    .describe('NYC modes to include, e.g. ["subway", "bus"]'),
  modes_london: z
    .array(z.string())
    .describe('London modes to include, e.g. ["tube", "bus"]'),
  date_range: dateRangeSchema.describe(
    'Date range for comparison. For dow_pattern this is ignored but still required.',
  ),
  aggregation: z
    .enum(['daily', 'weekly', 'monthly'])
    .optional()
    .describe('Aggregation level (default: monthly)'),
});

const getStatisticsSchema = z.object({
  city: z.enum(['nyc', 'london']).describe('The city to query'),
  mode: z
    .string()
    .describe('Single transit mode, e.g. "subway" or "tube"'),
  date_range: dateRangeSchema.describe('Date range for statistics'),
});

const getRecoveryDataSchema = z.object({
  city: z.enum(['nyc', 'london']).describe('The city to query'),
  modes: z
    .array(z.string())
    .describe('Transit modes to include, e.g. ["subway", "bus"]'),
  date_range: dateRangeSchema
    .optional()
    .describe('Optional date range filter; defaults to full range'),
});

const getDayOfWeekPatternsSchema = z.object({
  city: z.enum(['nyc', 'london']).describe('The city to query'),
  modes: z
    .array(z.string())
    .describe('Transit modes to include, e.g. ["subway", "bus"]'),
});

const getAnomaliesSchema = z.object({
  city: z.enum(['nyc', 'london']).describe('The city to query'),
  mode: z
    .string()
    .describe('Single transit mode to analyze, e.g. "subway"'),
  date_range: dateRangeSchema.describe('Date range to analyze'),
  threshold: z
    .number()
    .optional()
    .describe(
      'Number of standard deviations from mean to flag as anomaly (default: 2.0)',
    ),
});

export const chatTools = {
  query_ridership: tool<z.infer<typeof queryRidershipSchema>, object>({
    description:
      'Query daily, weekly, or monthly ridership data for a specific city. Use this when users ask about ridership numbers for specific time periods.',
    inputSchema: queryRidershipSchema,
    execute: async (params) => {
      return queryRidership(params);
    },
  }),

  compare_cities: tool<z.infer<typeof compareCitiesSchema>, object>({
    description:
      'Side-by-side comparison of a metric between NYC and London. Use this for cross-city comparisons.',
    inputSchema: compareCitiesSchema,
    execute: async (params) => {
      return compareCities(params);
    },
  }),

  get_statistics: tool<z.infer<typeof getStatisticsSchema>, object>({
    description:
      'Compute descriptive statistics (mean, median, min, max, std dev, trend) for a single transit mode over a date range.',
    inputSchema: getStatisticsSchema,
    execute: async (params) => {
      return getStatistics(params);
    },
  }),

  get_recovery_data: tool<z.infer<typeof getRecoveryDataSchema>, object>({
    description:
      'Get pandemic recovery percentages for specified transit modes. Shows how ridership compares to pre-pandemic levels.',
    inputSchema: getRecoveryDataSchema,
    execute: async (params) => {
      return getRecoveryData(params);
    },
  }),

  get_day_of_week_patterns: tool<z.infer<typeof getDayOfWeekPatternsSchema>, object>({
    description:
      'Get average ridership by day of week. Shows which days have the highest and lowest ridership.',
    inputSchema: getDayOfWeekPatternsSchema,
    execute: async (params) => {
      return getDayOfWeekPatterns(params);
    },
  }),

  get_anomalies: tool<z.infer<typeof getAnomaliesSchema>, object>({
    description:
      'Detect days with unusually high or low ridership. Finds outliers based on standard deviation threshold.',
    inputSchema: getAnomaliesSchema,
    execute: async (params) => {
      return getAnomalies(params);
    },
  }),
};
