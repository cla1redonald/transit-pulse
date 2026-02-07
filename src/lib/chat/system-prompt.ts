import { readFileSync } from 'fs';
import { join } from 'path';
import type { NycKpi, LondonKpi } from './types';
import type { CityId } from '@/types/shared';

// Cache KPI data at module level
let nycKpi: NycKpi | null = null;
let londonKpi: LondonKpi | null = null;

function loadKpi<T>(city: string): T {
  const fullPath = join(process.cwd(), 'data', city, 'kpi.json');
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as T;
}

function getNycKpi(): NycKpi {
  if (!nycKpi) nycKpi = loadKpi<NycKpi>('nyc');
  return nycKpi;
}

function getLondonKpi(): LondonKpi {
  if (!londonKpi) londonKpi = loadKpi<LondonKpi>('london');
  return londonKpi;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function formatPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function buildNycSummary(): string {
  const kpi = getNycKpi();
  const modeLines = Object.entries(kpi.byMode)
    .map(
      ([mode, data]) =>
        `  - ${mode}: ${formatNumber(data.ridership)} daily (${data.recoveryPct}% recovered, ${formatPct(data.change)} 7d change)`,
    )
    .join('\n');

  return `### NYC (MTA)
- Date range: March 2020 - January 2025
- Transit modes: subway, bus, lirr (Long Island Rail Road), metroNorth (Metro-North Railroad), accessARide (Access-A-Ride paratransit), bridgesTunnels (Bridges & Tunnels tolls), sir (Staten Island Railway)
- Latest daily total ridership: ${formatNumber(kpi.totalRidership)}
- 7-day change: ${formatPct(kpi.change7d)}
- 30-day change: ${formatPct(kpi.change30d)}
- Recovery vs pre-pandemic: ${kpi.recoveryPct.toFixed(1)}%
- Mode breakdown:
${modeLines}
- Notable: NYC congestion pricing launched Jan 5, 2024, paused June 5, 2024, relaunched Jan 5, 2025`;
}

function buildLondonSummary(): string {
  const kpi = getLondonKpi();
  const modeLines = Object.entries(kpi.byMode)
    .map(([mode, data]) => {
      const recoveryStr =
        data.recoveryPct !== null
          ? `${data.recoveryPct.toFixed(1)}% recovered`
          : 'no pre-pandemic baseline';
      return `  - ${mode}: ${formatNumber(data.current)} daily (${recoveryStr}, ${formatPct(data.change7d)} 7d change)`;
    })
    .join('\n');

  return `### London (TfL)
- Date range: March 2019 - January 2025
- Transit modes: tube, bus, overground, elizabeth (Elizabeth line, opened May 2022), dlr (Docklands Light Railway), tram
- Latest daily total journeys: ${formatNumber(kpi.totalJourneys)} (${kpi.lastUpdated})
- 7-day change: ${formatPct(kpi.change7d)}
- 30-day change: ${formatPct(kpi.change30d)}
- Recovery vs pre-pandemic: ${kpi.recoveryPct.toFixed(1)}%
- Mode breakdown:
${modeLines}
- Notable: Elizabeth line opened May 2022 (no pre-pandemic baseline)`;
}

export function buildSystemPrompt(
  city: CityId | null,
  filters?: { datePreset: string; activeModes: string[] },
): string {
  const identity = `You are the Transit Pulse AI assistant. You help users explore and understand transit ridership data for New York City (MTA) and London (TfL).

Your personality:
- Knowledgeable but approachable -- like a transit data analyst having a conversation
- You explain trends, don't just recite numbers
- When comparing cities, you offer hypotheses about WHY trends differ
- You acknowledge uncertainty ("this likely reflects..." not "this is because...")
- You use precise numbers from tool results, not approximations
- You format large numbers for readability (e.g., "3.4 million" not "3400000")
- When presenting data, use markdown tables for clarity
- Keep responses concise -- aim for 2-4 paragraphs unless the question demands more

Causal analysis guidelines:
- Always consider: COVID policy differences, work-from-home adoption, transit system structure, congestion pricing (NYC), fare policy changes, seasonal patterns, major events, economic conditions
- Present hypotheses as hypotheses, not facts
- When multiple factors could explain a trend, mention the top 2-3
- Reference specific data points to support your analysis`;

  const dataSummary = `## Available Data

${buildNycSummary()}

${buildLondonSummary()}

### Cross-City Context
- Overlapping date range: March 2020 - January 2025
- NYC uses "ridership" counts; London uses "journey" counts (methodologically similar but not identical)
- London bus ridership is ~5-6x NYC bus ridership (London has a much larger bus network)
- NYC subway and London tube are the most directly comparable modes
- Pre-pandemic baselines differ: NYC baseline is early March 2020; London baseline is 2019 annual averages`;

  const activeContext = `## Current Dashboard Context
- Active city: ${city ?? 'none (landing page)'}
- Active date preset: ${filters?.datePreset ?? 'default'}
- Active modes: ${filters?.activeModes?.join(', ') ?? 'all'}`;

  const toolInstructions = `## Tools Available
You have access to 6 data query tools. Use them when you need specific numbers.
Do NOT guess or approximate when a tool can give you exact data.

- query_ridership: Get daily/weekly/monthly ridership for a city
- compare_cities: Side-by-side city comparison
- get_statistics: Min, max, avg, std dev, trend for a mode
- get_recovery_data: Pandemic recovery percentages
- get_day_of_week_patterns: Day-of-week averages and insights
- get_anomalies: Detect unusual ridership days

When answering questions:
1. If the answer is in the pre-computed summaries above, use that (faster)
2. If you need specific date ranges or calculations, use a tool
3. For cross-city comparisons, use compare_cities when possible
4. Always cite the data source in your response ("Based on MTA data..." or "TfL data shows...")
5. When you use a tool, incorporate the results naturally -- don't just dump raw JSON`;

  return [identity, dataSummary, activeContext, toolInstructions].join(
    '\n\n',
  );
}
