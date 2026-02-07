# PRD: Transit Pulse AI Chat

> **Status:** Ready for Build
> **Created:** 2026-02-07
> **Last Updated:** 2026-02-07

---

## 1. Problem Statement

### The Pain Point

Transit Pulse displays ridership data across NYC and London, but users must manually interpret charts, mentally compare trends across cities, and draw their own conclusions. The dashboard shows *what* happened -- it does not explain *why*. A user looking at NYC subway recovery lagging behind London bus recovery has no way to ask "why is this different?" without leaving the app and researching externally.

### Why It Matters

The most interesting insights in transit data are cross-city comparisons and causal analysis: why did London recover faster than NYC? What was the impact of NYC congestion pricing? How do day-of-week patterns differ, and what does that tell us about work-from-home culture in each city? These are the questions that make the data meaningful, and the current dashboard cannot answer them.

### Current State

Users browse individual city dashboards, toggle filters, scan charts, and draw conclusions manually. For cross-city comparison they must open two browser tabs (or navigate back and forth between `/nyc` and `/london`). For causal analysis they must bring their own domain knowledge or research externally. There is no way to ask a question and get an answer within the application.

### Existing Code References

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/layout/DashboardShell.tsx` | 1-19 | Shell component where ChatProvider and ChatFAB will be injected |
| `src/cities/nyc/lib/filter-context.tsx` | 1-30+ | NYC filter state -- chat needs to read active city/filters |
| `src/cities/london/lib/filter-context.tsx` | 1-30+ | London filter state -- chat needs to read active city/filters |
| `src/types/shared.ts` | 1-20+ | Shared types including `CityId` -- chat uses this for city awareness |
| `data/nyc/daily.json` | all | NYC daily ridership (1776 records, 2020-03 to 2025-01) |
| `data/london/daily.json` | all | London daily ridership (2019-03 to 2025-01) |
| `data/nyc/recovery.json` | all | NYC recovery percentages vs pre-pandemic baseline |
| `data/london/recovery.json` | all | London recovery percentages vs pre-pandemic baseline |
| `data/nyc/kpi.json` | all | NYC latest KPIs (total ridership, changes, recovery) |
| `data/london/kpi.json` | all | London latest KPIs (total journeys, changes, recovery) |
| `data/nyc/congestion-pricing.json` | all | NYC congestion pricing impact data |
| `data/nyc/dow.json` | all | NYC day-of-week averages |
| `data/london/dow.json` | all | London day-of-week averages |

---

## 2. Solution Overview

### Core Idea

Add an AI-powered chat panel to the Transit Pulse dashboard. Users click a floating action button to open a slide-out panel where they can ask natural language questions about transit ridership data. The AI has access to all the same data the dashboard displays (daily, weekly, monthly, recovery, day-of-week, KPI, congestion pricing) via tool functions, plus pre-computed summaries in its system prompt. It answers questions with text and inline data tables, with a focus on cross-city comparisons and causal analysis.

The AI uses the Claude API via Vercel AI SDK with streaming responses. It does not just report numbers -- it offers hypotheses about *why* trends differ between cities (e.g., congestion pricing impact, COVID policy differences, transit system structure, work-from-home adoption rates).

### Success Looks Like

1. A user on the NYC dashboard clicks the chat button and asks "How does subway recovery compare to London tube recovery?" -- the AI responds with specific percentages, a comparison table, and a hypothesis about why they differ.
2. A user asks "What happened to NYC bus ridership in April 2020?" -- the AI queries the data, reports the dramatic drop, and explains the COVID lockdown context.
3. A user asks "Which day of the week has the biggest ridership gap between the two cities?" -- the AI queries both cities' DOW data, computes the comparison, and presents it in a table with analysis.
4. Responses stream in progressively, feel fast, and the UI is polished and integrated.

---

## 3. Users

### Primary User

Transit data enthusiasts, urban planners, journalists, students, and anyone exploring the Transit Pulse dashboard who wants to dig deeper than the charts allow. They want quick answers to data questions without leaving the app.

### Multi-User Consideration

No authentication in v1. All users share the same public data. IP-based rate limiting prevents abuse. Future versions could add user accounts with conversation history persistence, but v1 is session-only.

---

## 4. MVP Scope

### In Scope (v1)

- [ ] Floating action button (FAB) on dashboard pages (not landing page)
- [ ] Slide-out chat panel (420px desktop, full-screen mobile)
- [ ] Claude API integration via Vercel AI SDK with streaming
- [ ] System prompt with pre-computed data summaries and city context
- [ ] 6 tool functions for querying data (ridership, compare cities, statistics, recovery, DOW patterns, anomaly detection)
- [ ] Text responses with inline data tables
- [ ] Cross-city comparison from day one
- [ ] Causal analysis and hypothesis generation in AI responses
- [ ] Context-aware suggested prompt chips (different per city)
- [ ] City badge in panel header showing active city
- [ ] Chat clears on city switch
- [ ] IP-based rate limiting (~20 messages/hour)
- [ ] Monthly API budget cap
- [ ] Session-only persistence (React state, no database)
- [ ] Responsive design (desktop panel, mobile full-screen)
- [ ] Keyboard accessibility (Escape to close, Enter to send)
- [ ] Loading, error, and empty states
- [ ] Streaming text rendering

### Out of Scope (v1)

- Dynamic chart generation in responses (v2)
- Conversation history persistence across sessions (v2)
- User authentication (v2)
- Voice input (v2)
- Export/share conversations (v2)
- Custom AI personality settings (v2)
- Real-time data integration (v2 -- current data is static JSON)
- Map-aware queries ("show me stations near...") (v2)
- Multi-turn tool chaining (AI calling multiple tools in sequence) (v2)
- Proactive insights ("I noticed something interesting...") (v2)

### Scope Boundary

The chat feature is an additive overlay on the existing dashboard. It reads from the same static JSON data files. It does NOT modify any existing dashboard components, charts, filters, or data flows. The only existing file that changes is `DashboardShell.tsx` (to wrap children with `ChatProvider` and render `ChatFAB` + `ChatPanel`).

---

## 5. Technical Architecture

### API Route

A single Next.js API route handles chat requests:

```
POST /api/chat
```

**Request body:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  city: 'nyc' | 'london' | null;  // active city context
  filters?: {
    datePreset: string;
    activeModes: string[];
  };
}
```

**Response:** Server-sent events (SSE) stream via Vercel AI SDK `streamText`.

### Vercel AI SDK Integration

```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages, city, filters } = await req.json();

  // Rate limiting check (see Section 10)

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt(city, filters),
    messages,
    tools: chatTools,       // Tool definitions (see Section 6)
    maxSteps: 3,            // Allow up to 3 tool calls per response
    temperature: 0.3,       // Low temperature for factual accuracy
  });

  return result.toDataStreamResponse();
}
```

### Model Selection

Claude Sonnet (claude-sonnet-4-20250514) -- balances quality, speed, and cost. Opus would be higher quality but too slow/expensive for a chat interface. Haiku would be too shallow for causal analysis.

### Data Access Strategy: Hybrid

The AI gets data through two channels:

1. **System prompt summaries** (always available, zero latency): Pre-computed KPI summaries, date ranges, mode lists, and high-level context injected into the system prompt. This handles simple factual questions without tool calls.

2. **Tool functions** (on-demand, for detailed queries): Six tool functions that query the static JSON data files server-side. These handle date-range-specific queries, statistical calculations, and cross-city comparisons that require actual data processing.

This hybrid approach means simple questions ("what's the latest NYC ridership?") answer instantly from system prompt context, while complex questions ("compare subway and tube ridership month by month in 2023") use tools for precision.

---

## 6. Tool Definitions

### Tool 1: `query_ridership`

**Purpose:** Query daily, weekly, or monthly ridership data for a specific city.

**Parameters:**
```typescript
{
  city: 'nyc' | 'london';                           // required
  modes: string[];                                    // e.g., ['subway', 'bus'] or ['tube', 'bus']
  date_range: { start: string; end: string };        // ISO date strings, e.g., '2023-01-01'
  aggregation: 'daily' | 'weekly' | 'monthly';      // required
}
```

**Returns:**
```typescript
{
  city: string;
  aggregation: string;
  date_range: { start: string; end: string };
  record_count: number;
  data: Array<{
    date: string;        // or weekStart/month depending on aggregation
    [mode: string]: number;
    total: number;
  }>;
}
```

**Example query:** "What was NYC subway ridership in December 2024?"
```json
{
  "city": "nyc",
  "modes": ["subway"],
  "date_range": { "start": "2024-12-01", "end": "2024-12-31" },
  "aggregation": "daily"
}
```

**Example response:**
```json
{
  "city": "nyc",
  "aggregation": "daily",
  "date_range": { "start": "2024-12-01", "end": "2024-12-31" },
  "record_count": 31,
  "data": [
    { "date": "2024-12-01", "subway": 2105432, "total": 5231098 },
    { "date": "2024-12-02", "subway": 3612987, "total": 6412345 }
  ]
}
```

**Implementation notes:**
- Reads from `data/{city}/daily.json`, `data/{city}/weekly.json`, or `data/{city}/monthly.json` based on aggregation
- Filters records to the requested date range
- Includes only requested modes + total in output
- NYC daily.json uses `date` field; NYC weekly.json uses `weekStart`/`weekEnd`; NYC monthly.json uses `month`
- London weekly.json uses `date` field (week start date); London monthly.json uses `date` field (first of month)
- Cap returned records at 100 to prevent token bloat; if more exist, return first 50 and last 50 with a note

---

### Tool 2: `compare_cities`

**Purpose:** Side-by-side comparison of a metric between NYC and London.

**Parameters:**
```typescript
{
  metric: 'ridership' | 'recovery' | 'dow_pattern';  // what to compare
  modes_nyc: string[];          // NYC modes to include, e.g., ['subway', 'bus']
  modes_london: string[];       // London modes to include, e.g., ['tube', 'bus']
  date_range: { start: string; end: string };
  aggregation?: 'daily' | 'weekly' | 'monthly';  // default: 'monthly'
}
```

**Returns:**
```typescript
{
  metric: string;
  date_range: { start: string; end: string };
  nyc: {
    modes: string[];
    data: Array<Record<string, number | string>>;
    summary: { avg_total: number; min_total: number; max_total: number };
  };
  london: {
    modes: string[];
    data: Array<Record<string, number | string>>;
    summary: { avg_total: number; min_total: number; max_total: number };
  };
}
```

**Example query:** "Compare NYC subway and London tube monthly ridership in 2024."
```json
{
  "metric": "ridership",
  "modes_nyc": ["subway"],
  "modes_london": ["tube"],
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" },
  "aggregation": "monthly"
}
```

**Example response (abbreviated):**
```json
{
  "metric": "ridership",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" },
  "nyc": {
    "modes": ["subway"],
    "data": [
      { "month": "2024-01", "subway": 96543210 },
      { "month": "2024-02", "subway": 92345678 }
    ],
    "summary": { "avg_total": 98765432, "min_total": 88234567, "max_total": 112345678 }
  },
  "london": {
    "modes": ["tube"],
    "data": [
      { "month": "2024-01", "tube": 78654321 },
      { "month": "2024-02", "tube": 81234567 }
    ],
    "summary": { "avg_total": 82345678, "min_total": 72345678, "max_total": 95678901 }
  }
}
```

**Implementation notes:**
- Reads from both cities' data files simultaneously
- For `recovery` metric, reads from `recovery.json` files
- For `dow_pattern` metric, reads from `dow.json` files (no date range needed; returns full DOW averages)
- Summary statistics computed server-side to reduce token count
- Overlapping date range computed automatically (NYC data starts 2020-03, London starts 2019-03; overlap starts 2020-03)

---

### Tool 3: `get_statistics`

**Purpose:** Compute descriptive statistics for a mode over a date range.

**Parameters:**
```typescript
{
  city: 'nyc' | 'london';
  mode: string;                                      // single mode, e.g., 'subway'
  date_range: { start: string; end: string };
}
```

**Returns:**
```typescript
{
  city: string;
  mode: string;
  date_range: { start: string; end: string };
  record_count: number;
  statistics: {
    mean: number;
    median: number;
    min: { value: number; date: string };
    max: { value: number; date: string };
    std_dev: number;
    trend: 'increasing' | 'decreasing' | 'stable';  // linear regression direction
    trend_pct_change: number;                         // % change from first to last month
  };
}
```

**Example query:** "What are the stats for London tube ridership in 2024?"
```json
{
  "city": "london",
  "mode": "tube",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" }
}
```

**Example response:**
```json
{
  "city": "london",
  "mode": "tube",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" },
  "record_count": 366,
  "statistics": {
    "mean": 2456789,
    "median": 2567890,
    "min": { "value": 845123, "date": "2024-12-25" },
    "max": { "value": 3234567, "date": "2024-10-17" },
    "std_dev": 678234,
    "trend": "stable",
    "trend_pct_change": 2.3
  }
}
```

**Implementation notes:**
- Reads from `data/{city}/daily.json` only
- All statistics computed server-side (mean, median, std dev, min/max with dates)
- Trend is determined by comparing average of first 30 days vs last 30 days: >5% = increasing, <-5% = decreasing, else stable
- `trend_pct_change` is the percentage difference between first-month average and last-month average

---

### Tool 4: `get_recovery_data`

**Purpose:** Get pandemic recovery percentages for specified modes.

**Parameters:**
```typescript
{
  city: 'nyc' | 'london';
  modes: string[];                                    // e.g., ['subway', 'bus']
  date_range?: { start: string; end: string };       // optional; defaults to full range
}
```

**Returns:**
```typescript
{
  city: string;
  modes: string[];
  date_range: { start: string; end: string };
  record_count: number;
  data: Array<{
    date: string;
    [modePct: string]: number;  // e.g., subwayPct, busPct (NYC) or tubePct, busPct (London)
  }>;
  latest: {
    [mode: string]: { recovery_pct: number; date: string };
  };
}
```

**Example query:** "How has NYC subway recovery trended since 2023?"
```json
{
  "city": "nyc",
  "modes": ["subway"],
  "date_range": { "start": "2023-01-01", "end": "2025-01-31" }
}
```

**Example response (abbreviated):**
```json
{
  "city": "nyc",
  "modes": ["subway"],
  "date_range": { "start": "2023-01-01", "end": "2025-01-31" },
  "record_count": 60,
  "data": [
    { "date": "2023-01-02", "subwayPct": 0.62 },
    { "date": "2023-01-03", "subwayPct": 0.65 }
  ],
  "latest": {
    "subway": { "recovery_pct": 0.73, "date": "2025-01-31" }
  }
}
```

**Implementation notes:**
- Reads from `data/{city}/recovery.json`
- NYC recovery values are decimals (0.73 = 73%); London recovery values are already percentages (92 = 92%). The tool normalizes both to percentage format in `latest` for consistency.
- Field names in recovery data: NYC uses `{mode}Pct` (e.g., `subwayPct`), London uses `{mode}Pct` (e.g., `tubePct`)
- `latest` section provides the most recent recovery value per mode for quick reference
- Cap returned records at 100 (sample evenly if more exist)

---

### Tool 5: `get_day_of_week_patterns`

**Purpose:** Get average ridership by day of week.

**Parameters:**
```typescript
{
  city: 'nyc' | 'london';
  modes: string[];              // e.g., ['subway', 'bus']
}
```

**Returns:**
```typescript
{
  city: string;
  modes: string[];
  data: Array<{
    day: string;               // 'Monday', 'Tuesday', etc.
    [mode: string]: number;    // average ridership for each requested mode
    total: number;             // sum of requested modes
  }>;
  insights: {
    peak_day: string;
    trough_day: string;
    weekday_avg: number;
    weekend_avg: number;
    weekday_weekend_ratio: number;
  };
}
```

**Example query:** "What are the day-of-week patterns for London tube?"
```json
{
  "city": "london",
  "modes": ["tube"]
}
```

**Example response:**
```json
{
  "city": "london",
  "modes": ["tube"],
  "data": [
    { "day": "Monday", "tube": 2206433, "total": 2206433 },
    { "day": "Tuesday", "tube": 2555744, "total": 2555744 },
    { "day": "Wednesday", "tube": 2564771, "total": 2564771 },
    { "day": "Thursday", "tube": 2509876, "total": 2509876 },
    { "day": "Friday", "tube": 2345678, "total": 2345678 },
    { "day": "Saturday", "tube": 1678901, "total": 1678901 },
    { "day": "Sunday", "tube": 1234567, "total": 1234567 }
  ],
  "insights": {
    "peak_day": "Wednesday",
    "trough_day": "Sunday",
    "weekday_avg": 2436500,
    "weekend_avg": 1456734,
    "weekday_weekend_ratio": 1.67
  }
}
```

**Implementation notes:**
- Reads from `data/{city}/dow.json`
- NYC DOW field names: `avgSubway`, `avgBus`, `avgLirr`, `avgMetroNorth`, `avgAccessARide`, `avgBridgesTunnels`, `avgSir`, `avgTotal`; key field: `dayOfWeek` (string: "Monday", etc.)
- London DOW field names: `avgTube`, `avgBus`, `avgOverground`, `avgElizabeth`, `avgDlr`, `avgTram`, `avgTotal`; key fields: `dayOfWeek` (number 0-6), `dayName` (string)
- Tool normalizes field names in output (strips `avg` prefix, lowercases)
- `insights` computed server-side: peak/trough days, weekday (Mon-Fri) vs weekend (Sat-Sun) averages

---

### Tool 6: `get_anomalies`

**Purpose:** Detect days with unusually high or low ridership.

**Parameters:**
```typescript
{
  city: 'nyc' | 'london';
  mode: string;                                      // single mode
  date_range: { start: string; end: string };
  threshold?: number;                                 // std deviations from mean, default 2.0
}
```

**Returns:**
```typescript
{
  city: string;
  mode: string;
  date_range: { start: string; end: string };
  threshold: number;
  baseline: { mean: number; std_dev: number };
  anomalies: Array<{
    date: string;
    value: number;
    deviation: number;           // how many std devs from mean
    direction: 'high' | 'low';
    day_of_week: string;
  }>;
  anomaly_count: number;
}
```

**Example query:** "Were there any unusual days for NYC subway ridership in 2024?"
```json
{
  "city": "nyc",
  "mode": "subway",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" },
  "threshold": 2.0
}
```

**Example response (abbreviated):**
```json
{
  "city": "nyc",
  "mode": "subway",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" },
  "threshold": 2.0,
  "baseline": { "mean": 3456789, "std_dev": 678234 },
  "anomalies": [
    { "date": "2024-12-25", "value": 1234567, "deviation": -3.28, "direction": "low", "day_of_week": "Wednesday" },
    { "date": "2024-07-04", "value": 1567890, "deviation": -2.78, "direction": "low", "day_of_week": "Thursday" },
    { "date": "2024-10-31", "value": 4987654, "deviation": 2.26, "direction": "high", "day_of_week": "Thursday" }
  ],
  "anomaly_count": 3
}
```

**Implementation notes:**
- Reads from `data/{city}/daily.json`
- Computes mean and standard deviation for the mode over the date range
- Flags any day where the value is more than `threshold` standard deviations from the mean
- Returns anomalies sorted by absolute deviation (most extreme first)
- Cap at 20 anomalies maximum
- Includes `day_of_week` to help the AI explain patterns (holidays often fall on specific days)

---

## 7. System Prompt Design

The system prompt is constructed dynamically based on the active city and filter state. It has four sections:

### Section 1: Identity and Behavior

```
You are the Transit Pulse AI assistant. You help users explore and understand
transit ridership data for New York City (MTA) and London (TfL).

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
- Always consider: COVID policy differences, work-from-home adoption,
  transit system structure, congestion pricing (NYC), fare policy changes,
  seasonal patterns, major events, economic conditions
- Present hypotheses as hypotheses, not facts
- When multiple factors could explain a trend, mention the top 2-3
- Reference specific data points to support your analysis
```

### Section 2: Data Context (Pre-Computed Summaries)

```
## Available Data

### NYC (MTA)
- Date range: March 2020 - January 2025
- Transit modes: subway, bus, lirr (Long Island Rail Road), metroNorth (Metro-North Railroad),
  accessARide (Access-A-Ride paratransit), bridgesTunnels (Bridges & Tunnels tolls), sir (Staten Island Railway)
- Latest daily ridership: {totalRidership from kpi.json} ({formatDate})
- 7-day change: {change7d}%
- Recovery vs pre-pandemic: {recoveryPct}%
- Mode breakdown: subway {subway.ridership} ({subway.recoveryPct}% recovered),
  bus {bus.ridership} ({bus.recoveryPct}% recovered), ... [all modes]
- Notable: NYC congestion pricing launched Jan 5, 2024, paused June 5, 2024, relaunched Jan 5, 2025

### London (TfL)
- Date range: March 2019 - January 2025
- Transit modes: tube, bus, overground, elizabeth (Elizabeth line, opened May 2022),
  dlr (Docklands Light Railway), tram
- Latest daily journeys: {totalJourneys from kpi.json} ({lastUpdated})
- 7-day change: {change7d}%
- Recovery vs pre-pandemic: {recoveryPct}%
- Mode breakdown: tube {tube.current} ({tube.recoveryPct}% recovered),
  bus {bus.current} ({bus.recoveryPct}% recovered), ... [all modes]
- Notable: Elizabeth line opened May 2022 (no pre-pandemic baseline)

### Cross-City Context
- Overlapping date range: March 2020 - January 2025
- NYC uses "ridership" counts; London uses "journey" counts (methodologically similar but not identical)
- London bus ridership is ~5-6x NYC bus ridership (London has a much larger bus network)
- NYC subway and London tube are the most directly comparable modes
- Pre-pandemic baselines differ: NYC baseline is early March 2020; London baseline is 2019 annual averages
```

### Section 3: Active Context (Dynamic)

```
## Current Dashboard Context
- Active city: {city or 'none (landing page)'}
- Active date preset: {filters.datePreset or 'default'}
- Active modes: {filters.activeModes.join(', ') or 'all'}
```

### Section 4: Tool Usage Instructions

```
## Tools Available
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
5. When you use a tool, incorporate the results naturally -- don't just dump raw JSON
```

---

## 8. UX Specification

### Placement and Trigger

- **Floating Action Button (FAB):** 56px circular button, positioned bottom-right (`bottom-6 right-6`), `z-50`
- **Icon:** `MessageSquareText` from lucide-react (switches to `X` when panel is open)
- **Visibility:** Only on dashboard pages (`/nyc`, `/london`), NOT on landing page (`/`)
- **Animation:** Scale-in on mount, gentle pulse on hover

### Panel Behavior

- **Slide-in from right:** 420px fixed width on desktop (1024px+)
- **Full-screen:** On tablet (640-1023px) and mobile (<640px)
- **Height:** Full viewport height (`h-screen`)
- **Close triggers:** X button in header, Escape key, click scrim (on screens <1280px), swipe right on mobile
- **Body scroll preserved:** Dashboard remains scrollable with panel open
- **Z-index:** `z-50` (same level as FAB)

### Responsive Breakpoints

| Breakpoint | Panel Width | Behavior |
|-----------|------------|----------|
| >= 1024px | 420px | Side panel overlay, no scrim |
| 640-1023px | 100vw | Full-screen, scrim behind panel |
| < 640px | 100vw | Full-screen, keyboard-aware input |

### Integration with Dashboard

- Panel lives inside `DashboardShell` (renders after `<Footer />`)
- `ChatProvider` wraps the FAB and panel, providing shared state
- Chat reads active city from the current route (`usePathname()`)
- Chat reads active filters from city-specific `FilterContext` (via a lightweight adapter)
- City badge in panel header with accent color (NYC blue, London red)
- **Chat clears on city switch** -- when the user navigates from `/nyc` to `/london`, conversation resets

### Component Hierarchy

```
DashboardShell
  <Header />
  <main>{children}</main>
  <Footer />
  <ChatProvider>
    <ChatFAB />
    <ChatPanel>
      <ChatPanelHeader />    (title, city badge, clear button, close button)
      <ChatMessageList />
        <ChatMessage />      (user or assistant message bubble)
        <ChatDataTable />    (inline data table in assistant messages)
      <SuggestedPrompts />   (shown when conversation is empty)
      <ChatInput />          (auto-growing textarea + send button)
    </ChatPanel>
  </ChatProvider>
```

### Visual Design

| Element | Styling |
|---------|---------|
| Panel container | `bg-card border-l border-border shadow-2xl` |
| User messages | `bg-primary text-primary-foreground`, right-aligned, rounded bubble |
| Assistant messages | `bg-muted text-foreground`, left-aligned, rounded bubble |
| Data tables | Minimal: `border-border` dividers, alternating row `bg-muted/50`, horizontal scroll on overflow |
| Input area | `bg-background border rounded-xl`, auto-grows to 4 lines max |
| Send button | `bg-primary text-primary-foreground`, disabled when input empty or loading |
| FAB | `bg-primary text-primary-foreground shadow-lg` |
| Suggested prompts | Pill-shaped chips, `border border-border hover:bg-accent`, 2-3 per city |

### States

| State | Behavior |
|-------|----------|
| **Empty** | Welcome message ("Ask me anything about transit data...") + suggested prompt chips |
| **Loading** | Typing indicator (3 animated dots) below last message, input disabled, send button shows spinner |
| **Streaming** | Progressive text rendering in assistant bubble, input remains disabled |
| **Error** | Inline error message below last message ("Something went wrong") + retry button |
| **Rate limited** | Inline message: "You've reached the message limit. Try again in a few minutes." |

### Suggested Prompts (Static, Context-Aware)

**NYC context:**
- "How has subway ridership recovered since COVID?"
- "What was the impact of congestion pricing?"
- "Compare NYC subway to London tube recovery"

**London context:**
- "How has tube ridership recovered since COVID?"
- "What impact did the Elizabeth line have?"
- "Compare London bus and NYC bus ridership"

**No city context (should not appear, but as fallback):**
- "Compare NYC and London transit recovery"
- "Which city has recovered more from COVID?"

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close panel |
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Ctrl/Cmd+Shift+L` | Toggle chat panel (optional, v1 stretch) |

---

## 9. Component List

Every new file to create:

### API Route
| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | POST handler: rate limiting, system prompt construction, Claude API call via Vercel AI SDK |

### Chat Library
| File | Purpose |
|------|---------|
| `src/lib/chat/system-prompt.ts` | Build dynamic system prompt from KPI data, city context, filter state |
| `src/lib/chat/tools.ts` | Define all 6 tool functions with Zod schemas and implementations |
| `src/lib/chat/tool-handlers.ts` | Server-side tool execution logic (data loading, filtering, statistics) |
| `src/lib/chat/rate-limiter.ts` | IP-based rate limiting with in-memory store (Map-based, TTL cleanup) |
| `src/lib/chat/types.ts` | Shared TypeScript types for chat messages, tool params, tool results |

### Chat UI Components
| File | Purpose |
|------|---------|
| `src/components/chat/ChatProvider.tsx` | React context: open/close state, city awareness, useChat from Vercel AI SDK |
| `src/components/chat/ChatFAB.tsx` | Floating action button (bottom-right, toggles panel) |
| `src/components/chat/ChatPanel.tsx` | Slide-out panel container (animation, responsive, scrim) |
| `src/components/chat/ChatPanelHeader.tsx` | Panel header: title, city badge, clear button, close button |
| `src/components/chat/ChatMessageList.tsx` | Scrollable message container with auto-scroll-to-bottom |
| `src/components/chat/ChatMessage.tsx` | Individual message bubble (user or assistant, with markdown rendering) |
| `src/components/chat/ChatDataTable.tsx` | Inline data table component for structured tool results |
| `src/components/chat/SuggestedPrompts.tsx` | Starter prompt chips (context-aware per city) |
| `src/components/chat/ChatInput.tsx` | Auto-growing textarea with send button |
| `src/components/chat/TypingIndicator.tsx` | Three-dot animation for loading state |

### Modified Existing Files
| File | Change |
|------|--------|
| `src/components/layout/DashboardShell.tsx` | Add `ChatProvider`, `ChatFAB`, and `ChatPanel` after `<Footer />` |

---

## 10. Rate Limiting Strategy

### IP-Based Rate Limiting

**Implementation:** In-memory `Map<string, { count: number; windowStart: number }>` in the API route. No external dependencies (Redis, database).

**Limits:**
| Limit | Value | Scope |
|-------|-------|-------|
| Messages per hour per IP | 20 | Sliding window (60-minute TTL) |
| Max message length | 500 characters | Per message |
| Max conversation length | 50 messages | Per session (enforced client-side) |

**How it works:**
1. Extract IP from `request.headers.get('x-forwarded-for')` (Vercel sets this)
2. Look up IP in the rate limit map
3. If window expired (>60 min since windowStart), reset count to 0
4. If count >= 20, return 429 with `Retry-After` header
5. Otherwise, increment count and proceed
6. Cleanup: every 100 requests, remove entries older than 60 minutes

**Client-side handling:** When the API returns 429, the `ChatProvider` displays a rate-limit message in the chat. The input remains enabled but messages are not sent.

### Monthly Budget Cap

**Implementation:** Environment variable `CHAT_MONTHLY_BUDGET_USD` (default: 50). The API route tracks cumulative token usage in a module-level counter (resets on server restart; approximate but sufficient for v1).

**How it works:**
1. After each successful Claude API call, estimate cost from input/output token counts
2. Add to monthly cumulative counter
3. If cumulative exceeds budget, return 503 with a message: "Chat is temporarily unavailable"
4. On Vercel, serverless functions restart frequently, so the counter naturally resets. This is an approximate safeguard, not a precise accounting system.

**For production accuracy (v2):** Store token counts in a Supabase table or Vercel KV. Not needed for v1.

---

## 11. Sequential Thread Plan

### Thread 1: Chat API Foundation

**Purpose:** Set up the API route, system prompt builder, and tool definitions with working Claude integration.

**Actions:**
- [ ] Install dependencies: `ai`, `@ai-sdk/anthropic`, `zod`
- [ ] Create `src/lib/chat/types.ts` with all shared TypeScript types
- [ ] Create `src/lib/chat/system-prompt.ts` -- builds dynamic system prompt from KPI JSON files and city/filter context
- [ ] Create `src/lib/chat/tools.ts` -- define 6 tools with Zod parameter schemas
- [ ] Create `src/lib/chat/tool-handlers.ts` -- implement all 6 tool execution functions (read JSON files, filter, compute statistics)
- [ ] Create `src/lib/chat/rate-limiter.ts` -- IP-based rate limiter
- [ ] Create `src/app/api/chat/route.ts` -- POST handler wiring it all together
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local` (and document in `.env.example`)
- [ ] Test with curl: `curl -X POST http://localhost:3000/api/chat -d '{"messages":[{"role":"user","content":"Hello"}],"city":"nyc"}'`

**Reference Material:**
- `data/nyc/kpi.json` -- KPI data shape for system prompt
- `data/london/kpi.json` -- KPI data shape for system prompt
- `data/nyc/daily.json:1-12` -- Daily data shape for tool handlers
- `data/london/daily.json:1-10` -- Daily data shape for tool handlers
- `data/nyc/recovery.json:1-12` -- Recovery data shape (decimal format)
- `data/london/recovery.json:1-12` -- Recovery data shape (percentage format)
- `data/nyc/dow.json:1-12` -- DOW data shape (string dayOfWeek)
- `data/london/dow.json:1-12` -- DOW data shape (numeric dayOfWeek + dayName)
- `data/nyc/weekly.json:1-12` -- Weekly data shape (weekStart/weekEnd)
- `data/london/weekly.json:1-10` -- Weekly data shape (date only)
- `data/nyc/monthly.json:1-12` -- Monthly data shape (month field)
- `data/london/monthly.json:1-10` -- Monthly data shape (date field)
- `data/nyc/congestion-pricing.json:1-30` -- Congestion pricing data shape

**Validation Targets:**
- [ ] API route responds to POST with streaming SSE
- [ ] System prompt includes correct KPI summaries from both cities
- [ ] Each of the 6 tools returns correctly shaped data when called
- [ ] Rate limiter blocks after 20 requests from same IP
- [ ] `tsc --noEmit` passes

**Deliverables:**
- `src/app/api/chat/route.ts`
- `src/lib/chat/types.ts`
- `src/lib/chat/system-prompt.ts`
- `src/lib/chat/tools.ts`
- `src/lib/chat/tool-handlers.ts`
- `src/lib/chat/rate-limiter.ts`
- `.env.example`

**Reasoning Level:** Medium-High (Sonnet)

**Rationale:** Tool handler implementations require understanding multiple data shapes, computing statistics correctly, and normalizing inconsistent formats between NYC and London data. System prompt design requires careful context curation.

**Dependencies:** None
**Parallelizable:** No (foundation for all other threads)

---

### Thread 2: Chat UI Components

**Purpose:** Build all chat UI components: FAB, panel, messages, input, suggested prompts.

**Actions:**
- [ ] Create `src/components/chat/ChatProvider.tsx` -- context for open/close state, city detection via `usePathname()`, conversation reset on city change
- [ ] Create `src/components/chat/ChatFAB.tsx` -- 56px floating button, bottom-right, toggles panel
- [ ] Create `src/components/chat/ChatPanel.tsx` -- slide-out panel (420px desktop, full-screen mobile), animation with CSS transitions, Escape key handler, scrim on smaller screens
- [ ] Create `src/components/chat/ChatPanelHeader.tsx` -- title ("Transit Pulse AI"), city badge with accent color, clear conversation button, close button
- [ ] Create `src/components/chat/ChatMessageList.tsx` -- scrollable container, auto-scroll to bottom on new messages, scroll-to-bottom button when scrolled up
- [ ] Create `src/components/chat/ChatMessage.tsx` -- message bubble (user: right-aligned primary, assistant: left-aligned muted), basic markdown rendering (bold, italic, lists)
- [ ] Create `src/components/chat/ChatDataTable.tsx` -- renders tabular data inline in assistant messages, horizontal scroll on overflow, alternating row backgrounds
- [ ] Create `src/components/chat/SuggestedPrompts.tsx` -- pill chips, context-aware per city, click to populate and send
- [ ] Create `src/components/chat/ChatInput.tsx` -- auto-growing textarea (max 4 lines), send button, Enter to send, Shift+Enter for newline, disabled during loading
- [ ] Create `src/components/chat/TypingIndicator.tsx` -- three-dot animation

**Reference Material:**
- `src/components/layout/DashboardShell.tsx:1-19` -- where ChatProvider/FAB/Panel get injected
- `src/types/shared.ts` -- `CityId` type
- `src/components/ui/button.tsx` -- shared Button component to reuse

**Validation Targets:**
- [ ] FAB renders on dashboard pages, not on landing page
- [ ] Panel slides in/out smoothly with CSS transition
- [ ] Panel is 420px on desktop, full-screen on mobile
- [ ] Escape key closes panel
- [ ] Messages render with correct alignment and styling
- [ ] Input auto-grows and supports Enter/Shift+Enter
- [ ] Suggested prompts display correctly per city
- [ ] `tsc --noEmit` passes

**Deliverables:**
- All 10 files in `src/components/chat/`

**Reasoning Level:** Medium (Sonnet)

**Rationale:** Standard React component work with responsive design considerations. The main complexity is the panel animation, auto-scroll behavior, and responsive breakpoints.

**Dependencies:** None (can be built with mock data)
**Parallelizable:** Yes -- can run in parallel with Thread 1

---

### Thread 3: Integration and Wiring

**Purpose:** Connect the UI components to the API route, integrate with DashboardShell, and wire up Vercel AI SDK's `useChat` hook.

**Actions:**
- [ ] Update `ChatProvider.tsx` to use `useChat` from `ai/react` -- configure API endpoint, handle streaming, manage message state
- [ ] Wire `ChatInput` to send messages via `useChat`'s `handleSubmit`
- [ ] Wire `ChatMessageList` to render messages from `useChat`'s `messages` array
- [ ] Wire `SuggestedPrompts` to send messages on click
- [ ] Wire `ChatPanelHeader` clear button to `useChat`'s `setMessages([])`
- [ ] Implement city context passing: extract city from `usePathname()`, pass to API via `useChat`'s `body` option
- [ ] Implement conversation reset on city change (watch pathname, clear messages)
- [ ] Implement data table detection: parse assistant messages for table-formatted tool results, render via `ChatDataTable`
- [ ] Modify `src/components/layout/DashboardShell.tsx` to include `ChatProvider`, `ChatFAB`, and `ChatPanel`
- [ ] Handle error states: API errors, rate limiting (429), budget exceeded (503)
- [ ] Handle loading states: typing indicator during streaming

**Reference Material:**
- `src/app/api/chat/route.ts` -- API endpoint (from Thread 1)
- `src/components/chat/*.tsx` -- UI components (from Thread 2)
- `src/components/layout/DashboardShell.tsx:1-19` -- file to modify
- `src/cities/nyc/lib/filter-context.tsx:1-30` -- NYC filter context shape
- `src/cities/london/lib/filter-context.tsx:1-30` -- London filter context shape

**Validation Targets:**
- [ ] User can type a message, send it, and see a streaming response
- [ ] AI correctly identifies the active city and responds with relevant data
- [ ] Tool calls work end-to-end (user asks a data question, AI calls tool, response includes data)
- [ ] Data tables render inline for tabular tool results
- [ ] Switching from `/nyc` to `/london` clears the conversation
- [ ] Rate limiting displays a user-friendly message
- [ ] Error states show retry button
- [ ] `tsc --noEmit` passes
- [ ] `npm run build` succeeds

**Deliverables:**
- Updated `src/components/chat/ChatProvider.tsx`
- Updated `src/components/layout/DashboardShell.tsx`
- Potential small updates to other chat components

**Reasoning Level:** Medium-High (Sonnet)

**Rationale:** Wiring Vercel AI SDK's `useChat` hook, managing streaming state, detecting table data in responses, and coordinating city context requires careful integration work.

**Dependencies:** Thread 1, Thread 2
**Parallelizable:** No (depends on both prior threads)

---

### Thread 4: Testing

**Purpose:** Write tests for tool handlers, API route, UI components, and integration.

**Actions:**
- [ ] Create `__tests__/chat/tool-handlers.test.ts` -- test all 6 tool handler functions:
  - `query_ridership`: correct filtering by date range, aggregation, mode selection
  - `compare_cities`: correct cross-city data alignment
  - `get_statistics`: correct mean, median, std dev, min/max, trend calculation
  - `get_recovery_data`: correct normalization of NYC (decimal) vs London (percentage) formats
  - `get_day_of_week_patterns`: correct DOW field mapping for both cities
  - `get_anomalies`: correct anomaly detection with configurable threshold
- [ ] Create `__tests__/chat/system-prompt.test.ts` -- verify system prompt includes correct KPI data, city context, tool descriptions
- [ ] Create `__tests__/chat/rate-limiter.test.ts` -- verify rate limiting logic (window reset, count increment, cleanup)
- [ ] Create `__tests__/chat/components.test.tsx` -- test UI components:
  - ChatFAB: renders, toggles panel on click
  - ChatPanel: opens/closes, responsive breakpoints
  - ChatMessage: renders user and assistant messages with correct styling
  - ChatInput: handles Enter/Shift+Enter, disables during loading
  - SuggestedPrompts: renders correct prompts per city, sends on click
  - ChatDataTable: renders tabular data correctly
- [ ] Create `__tests__/chat/integration.test.tsx` -- test ChatProvider integration:
  - City detection from pathname
  - Conversation reset on city change
  - Error state rendering

**Reference Material:**
- `__tests__/nyc/charts.test.tsx` -- existing test patterns for reference
- `__tests__/london/charts.test.tsx` -- existing test patterns for reference
- `vitest.config.ts` -- test configuration

**Validation Targets:**
- [ ] All tool handler tests pass
- [ ] System prompt test verifies KPI data inclusion
- [ ] Rate limiter tests cover edge cases (window expiry, cleanup)
- [ ] UI component tests cover core interactions
- [ ] `npx vitest run` passes all new tests + all existing tests

**Deliverables:**
- `__tests__/chat/tool-handlers.test.ts`
- `__tests__/chat/system-prompt.test.ts`
- `__tests__/chat/rate-limiter.test.ts`
- `__tests__/chat/components.test.tsx`
- `__tests__/chat/integration.test.tsx`

**Reasoning Level:** Medium (Sonnet)

**Rationale:** Tests are straightforward given well-defined tool interfaces. The main complexity is mocking the Vercel AI SDK for component tests.

**Dependencies:** Thread 3
**Parallelizable:** No (needs completed implementation to test)

---

### Thread 5: Polish and Edge Cases

**Purpose:** Handle edge cases, improve UX polish, and verify production readiness.

**Actions:**
- [ ] Add markdown rendering support in `ChatMessage` (bold, italic, bullet lists, numbered lists, code blocks, links)
- [ ] Implement scroll-to-bottom button in `ChatMessageList` (appears when user scrolls up, auto-hides when at bottom)
- [ ] Add message timestamps (subtle, "2 min ago" format)
- [ ] Handle long messages gracefully (word-wrap, no horizontal overflow)
- [ ] Handle empty tool results gracefully ("No data available for that date range")
- [ ] Add mobile keyboard awareness for `ChatInput` (viewport resize handling)
- [ ] Add swipe-to-close gesture on mobile (optional, fallback to close button)
- [ ] Verify panel doesn't overlap with fixed header (`top-14` or `top-0` with header behind)
- [ ] Verify dark mode / light mode for all chat components
- [ ] Verify that existing dashboard tests still pass
- [ ] Add `.env.example` with `ANTHROPIC_API_KEY=your-key-here` and `CHAT_MONTHLY_BUDGET_USD=50`
- [ ] Verify `npm run build` succeeds with no warnings
- [ ] Deploy to Vercel and test end-to-end on production URL

**Reference Material:**
- All chat component files from prior threads
- `src/app/globals.css` -- theme variables for dark/light mode
- `tailwind.config.ts` -- Tailwind configuration

**Validation Targets:**
- [ ] Markdown renders correctly in assistant messages
- [ ] Scroll behavior is smooth and intuitive
- [ ] Dark and light mode both work for all chat components
- [ ] Mobile full-screen mode works with on-screen keyboard
- [ ] All tests pass (`npx vitest run`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript clean (`tsc --noEmit`)
- [ ] Production deployment works on Vercel

**Deliverables:**
- Updated chat component files (polish/edge case fixes)
- `.env.example`
- Verified Vercel deployment

**Reasoning Level:** Medium (Sonnet)

**Rationale:** Polish work and edge cases. Each item is small but the cumulative set is meaningful.

**Dependencies:** Thread 3, Thread 4
**Parallelizable:** No (final polish pass)

---

### Thread Execution Guidance

1. **Execute ONE thread per conversation** -- don't combine threads
2. **Read all reference material first** -- understand context before coding
3. **Threads 1 and 2 can run in parallel** -- they have no dependencies on each other
4. **Thread 3 depends on both 1 and 2** -- wait for both to complete
5. **Thread 4 depends on 3** -- needs completed integration to test
6. **Thread 5 depends on 3 and 4** -- final polish after everything works
7. **Identify blockers early** -- flag issues before they compound

### Dependency Graph

```
Thread 1 (API Foundation) ──┐
                            ├──> Thread 3 (Integration) ──> Thread 4 (Testing) ──> Thread 5 (Polish)
Thread 2 (UI Components) ──┘
```

### Completion Log Template

After each thread, record:
```
**Thread [N] Completion Log:**
- Status: Complete / Partial / Blocked
- Files Modified:
  - `path/file.ts:XX-YY` - [what changed]
- Tests Added: [list test files]
- Issues Discovered: [any problems found]
- Notes for Next Thread: [context to carry forward]
```

---

## 12. User Experience

> **See also:** The UX specification in Section 8 covers all visual and interaction details.

### Key User Flows

**Flow 1: First Interaction (Empty State)**
1. User is on `/nyc` dashboard browsing charts
2. User notices the floating chat button (bottom-right)
3. User clicks the button
4. Panel slides in from right showing welcome message and 3 suggested prompts ("How has subway ridership recovered since COVID?", etc.)
5. User clicks a suggested prompt
6. Prompt appears as user message; typing indicator shows
7. AI response streams in with text analysis
8. Suggested prompts disappear (replaced by conversation)

**Flow 2: Data Question with Tool Call**
1. User types: "What was the average subway ridership in December 2024?"
2. Message appears in chat; typing indicator shows
3. AI calls `query_ridership` tool internally
4. Response streams in: narrative text with specific numbers
5. If tool returns tabular data, an inline data table renders

**Flow 3: Cross-City Comparison**
1. User (on any city page) types: "Compare NYC subway to London tube monthly ridership in 2024"
2. AI calls `compare_cities` tool
3. Response includes narrative comparison, inline table with side-by-side monthly data, and causal analysis ("NYC subway runs 24/7 while the Tube closes overnight, which affects how ridership distributes across modes...")

**Flow 4: City Switch**
1. User is chatting on `/nyc` with an active conversation
2. User clicks "London" in the header navigation
3. App navigates to `/london`
4. Chat conversation clears automatically
5. Panel stays open; new suggested prompts appear for London context

**Flow 5: Error / Rate Limit**
1. User sends 20th message within an hour
2. API returns 429
3. Chat displays inline message: "You've reached the message limit. Try again in a few minutes."
4. Input remains visible but sends are blocked until rate limit window resets

### Primary Interface

The chat panel is a secondary overlay on the primary dashboard interface. It does not replace or compete with the dashboard -- it supplements it. The dashboard remains fully functional and scrollable while the chat panel is open.

---

## 13. Data Model

### Core Entities

No new database tables. All data is read from existing static JSON files. Chat state is session-only (React state).

| Entity | Storage | Notes |
|--------|---------|-------|
| Chat messages | React state (client) | Array of `{ role, content, id }` via Vercel AI SDK |
| Rate limit entries | In-memory Map (server) | `Map<IP, { count, windowStart }>`, resets on server restart |
| Token usage counter | Module-level variable (server) | Approximate monthly cost tracking, resets on server restart |

### Security and Privacy

- No user data is stored permanently
- IP addresses are held in memory only for rate limiting (TTL: 60 minutes)
- Chat messages are sent to Claude API (Anthropic's data retention policy applies)
- No PII collection -- no accounts, no names, no emails
- API key stored in environment variable, never exposed to client

---

## 14. Integrations

### Required (MVP)

| Integration | Purpose | Details |
|-------------|---------|---------|
| Anthropic Claude API | AI responses | Via `@ai-sdk/anthropic` package, model: `claude-sonnet-4-20250514` |
| Vercel AI SDK | Streaming infrastructure | `ai` package for `streamText`, `useChat`, SSE transport |

### Future

| Integration | Purpose |
|-------------|---------|
| Vercel KV / Supabase | Persistent rate limiting and budget tracking |
| Analytics (PostHog/Vercel Analytics) | Track chat usage, popular queries, tool call frequency |
| MTA / TfL live APIs | Real-time data for AI responses |

---

## 15. Technical Specification

### Stack

- **Frontend:** TypeScript, Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **AI:** Claude API via `@ai-sdk/anthropic`, Vercel AI SDK (`ai` package)
- **Hosting:** Vercel (serverless functions for API route)
- **Schema validation:** Zod (for tool parameter schemas)
- **No database** -- session-only state

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4.0` | Vercel AI SDK core (streamText, useChat) |
| `@ai-sdk/anthropic` | `^1.0` | Anthropic provider for Vercel AI SDK |
| `zod` | `^3.23` | Schema validation for tool parameters |

### Non-Negotiables

- [ ] Tests required for all tool handlers
- [ ] TypeScript strict mode (`tsc --noEmit` clean)
- [ ] API key never exposed to client
- [ ] Rate limiting from day one
- [ ] Streaming responses (not buffered)
- [ ] Mobile-responsive chat panel

### Architecture Principles

- Chat is an additive feature -- it does not modify existing dashboard code (except DashboardShell injection)
- Tool functions are pure data transformers -- they read JSON files and compute results, with no side effects
- System prompt is constructed dynamically per request, not hard-coded
- All data normalization (NYC vs London format differences) happens in tool handlers, not in the AI prompt

---

## 16. Constraints

### Hard Constraints

- **ANTHROPIC_API_KEY must be server-side only** -- never included in client bundle
- **No database dependencies** -- v1 uses only static JSON and in-memory state
- **Must work with existing static data** -- no new data pipelines or APIs
- **Must not modify existing dashboard components** -- except DashboardShell wrapper
- **Monthly API cost must be capped** -- default $50/month

### Preferences

- Response latency under 2 seconds to first token
- Conversation feels natural, not robotic
- Data tables are readable on mobile (horizontal scroll)
- Panel animation is 300ms ease-out

### Anti-Patterns

| Do Not | Do |
|--------|-----|
| Expose API key to client | Use server-side API route only |
| Buffer full response before displaying | Stream with Vercel AI SDK |
| Hard-code data summaries | Read from JSON files dynamically |
| Create a general-purpose chatbot | Focus exclusively on transit data |
| Let AI hallucinate numbers | Always use tools for specific queries |
| Store conversations in database | Session-only React state |

---

## 17. Pre-Mortem Risk Assessment

### Tigers (Real Threats)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API cost overrun** | Unexpected bill from Anthropic | Monthly budget cap in code, IP rate limiting, model choice (Sonnet not Opus) |
| **Slow tool execution** | Tools read and process large JSON files on every call; could be slow | Pre-load JSON at module level (cached in serverless function memory), limit returned records |
| **AI hallucinating data** | Gives wrong numbers, user trusts them | Tools provide exact data; system prompt instructs to use tools not guess; low temperature (0.3) |

### Paper Tigers (Seem Scary, Manageable)

| Risk | Why Manageable |
|------|----------------|
| **Vercel serverless cold start** | First request may be slow (~1-2s), but subsequent requests are fast. Acceptable for chat. |
| **In-memory rate limiter resets on deploy** | Vercel functions restart frequently, so rate limits reset. This means occasional over-allowance, not under-allowance. Acceptable for v1. |
| **NYC/London data format inconsistencies** | Already well-documented in ARCHITECTURE.md. Tool handlers normalize at implementation time. |

### Elephants (Obvious But Unspoken)

| Risk | Acknowledgment |
|------|----------------|
| **The AI might give boring answers** | The system prompt is carefully designed for causal analysis and hypothesis generation. But the quality of responses depends on Claude's training, not just our prompting. If responses are too dry or generic, we will need to iterate on the system prompt after launch. This is the biggest quality risk and requires manual testing with real questions. |

---

## 18. Opportunity Cost

By building the chat feature, we are **not** building:

- **Cross-city comparison dashboard** -- a dedicated comparison view with side-by-side charts. The chat feature partially addresses this need through natural language, but a visual comparison page would serve users who prefer charts over text.
- **Data export functionality** -- users cannot currently download data or charts. Chat does not address this.
- **Additional cities** -- Tokyo, Paris, Berlin, etc. The chat architecture is city-agnostic and would support new cities, but the time spent on chat delays city expansion.
- **Real-time data integration** -- connecting to live MTA/TfL APIs for up-to-date data. The chat uses the same static JSON files as the dashboard.

---

## 19. Future Vision

### v2 Direction

If v1 succeeds (users engage with chat, ask meaningful questions, return to use it again):

1. **Dynamic chart generation** -- AI responses include interactive Recharts components, not just tables
2. **Conversation persistence** -- save and resume conversations (requires auth + database)
3. **Proactive insights** -- AI notices interesting patterns and surfaces them without being asked
4. **Additional cities** -- expand to Tokyo, Paris, Berlin with the same chat infrastructure
5. **Real-time data** -- connect to live transit APIs for current-day queries
6. **Shared conversations** -- generate shareable links to interesting analyses
7. **Custom dashboards from chat** -- "Show me a dashboard of just subway and tube recovery" generates a custom view

---

## 20. Definition of Done

MVP is complete when:

- [ ] Floating chat button appears on `/nyc` and `/london` dashboard pages
- [ ] Chat panel slides open/closed smoothly on desktop and mobile
- [ ] User can type a question and receive a streaming response
- [ ] AI correctly uses tools to query data when needed
- [ ] Cross-city comparisons work ("compare NYC subway to London tube")
- [ ] AI provides causal analysis, not just numbers
- [ ] Data tables render inline for tabular results
- [ ] Suggested prompts appear on empty state, context-aware per city
- [ ] Chat clears when switching cities
- [ ] Rate limiting works (429 after 20 messages/hour)
- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` succeeds
- [ ] Deployed to Vercel and functional on production URL
- [ ] Tested with at least 10 representative queries across both cities
- [ ] Not embarrassing to show someone

---

## 21. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should the chat panel be accessible from the landing page (`/`) or dashboard pages only? | **Resolved:** Dashboard pages only. Landing page has no city context. |
| 2 | Should conversation persist when switching between cities? | **Resolved:** No. Chat clears on city switch. Cross-city questions can be asked from either city page. |
| 3 | Which Claude model to use? | **Resolved:** Claude Sonnet (claude-sonnet-4-20250514). Balance of quality, speed, cost. |
| 4 | How to handle the AI calling a tool that takes too long? | **Open:** Set a 10-second timeout on tool execution. If exceeded, return a "tool timeout" error that the AI can explain to the user. Implement in Thread 1. |
| 5 | Should the chat show which tools are being called (transparency)? | **Open:** Leaning toward no for v1 (simpler UX). Could add a small "Querying data..." label during tool execution in v2. |

---

## Appendix A: Example Conversations

### Conversation 1: Simple Factual Query

**User:** What's the current NYC subway ridership?

**Assistant:** Based on the latest MTA data, NYC subway ridership is approximately **3.7 million daily riders**, which represents about **73% recovery** compared to pre-pandemic levels.

For context, subway ridership saw a 7-day change of +10.6%, suggesting an upward trend in the most recent week. The subway remains the backbone of NYC transit, accounting for about 64% of total MTA ridership.

*(No tool call needed -- answered from system prompt KPI data)*

---

### Conversation 2: Cross-City Comparison with Tool Call

**User:** How does NYC subway recovery compare to London tube recovery?

**Assistant:** Great question -- this is one of the most interesting comparisons in the data.

| Metric | NYC Subway | London Tube |
|--------|-----------|-------------|
| Current Recovery | 73% | 93% |
| Latest Daily Riders | 3.7M | 2.7M |
| Pre-Pandemic Baseline | ~5.5M/day | ~3.5M/day |

London's Tube has recovered significantly more than NYC's subway -- **93% vs 73%** of pre-pandemic levels. Several factors likely contribute:

1. **Work-from-home patterns:** NYC has seen a stronger shift to hybrid work, particularly in Manhattan office jobs that drove subway commuting. London has also adopted hybrid work but appears to have a higher return-to-office rate.

2. **System structure:** London's Tube serves a more distributed set of destinations (shopping, leisure, cross-city travel), while NYC subway ridership was more heavily concentrated on the office commute. This made NYC more vulnerable to WFH shifts.

3. **Fare and service factors:** TfL's contactless payment system and consistent service levels may have helped maintain rider confidence, while the MTA faced publicized safety and reliability concerns.

The gap has been narrowing -- NYC subway recovery was around 60% in early 2023 and has climbed to 73% -- but London's tube remains well ahead.

---

### Conversation 3: Anomaly Detection

**User:** Were there any unusual days for NYC subway ridership in 2024?

**Assistant:** I'll check for days with ridership significantly above or below the typical range.

*(Tool call: get_anomalies, city: nyc, mode: subway, date_range: 2024-01-01 to 2024-12-31)*

Here are the most notable anomalies for NYC subway in 2024:

| Date | Ridership | vs Average | Day | Likely Cause |
|------|-----------|-----------|-----|-------------|
| Dec 25 | 1.2M | -65% | Wednesday | Christmas Day |
| Jul 4 | 1.6M | -54% | Thursday | Independence Day |
| Nov 28 | 1.4M | -60% | Thursday | Thanksgiving |
| Jan 15 | 1.5M | -57% | Monday | MLK Day (observed) |
| Oct 31 | 5.0M | +43% | Thursday | Halloween (high evening ridership) |

The pattern is clear: major holidays cause dramatic drops (40-65% below average), while cultural events like Halloween produce noticeable spikes. The holiday drops are more pronounced in NYC than in London, where Boxing Day and Bank Holidays show smaller ridership declines -- likely because NYC subway ridership is more commute-dependent.

---

## Appendix B: Data File Quick Reference

### Field Name Mapping

| Data File | NYC Fields | London Fields |
|-----------|-----------|---------------|
| daily.json | `date`, `subway`, `bus`, `lirr`, `metroNorth`, `accessARide`, `bridgesTunnels`, `sir`, `total` | `date`, `tube`, `bus`, `overground`, `elizabeth`, `dlr`, `tram`, `total` |
| weekly.json | `weekStart`, `weekEnd`, `subway`, `bus`, `lirr`, `metroNorth`, `accessARide`, `bridgesTunnels`, `sir`, `total` | `date`, `tube`, `bus`, `overground`, `elizabeth`, `dlr`, `tram`, `total` |
| monthly.json | `month`, `subway`, `bus`, `lirr`, `metroNorth`, `accessARide`, `bridgesTunnels`, `sir`, `total` | `date`, `tube`, `bus`, `overground`, `elizabeth`, `dlr`, `tram`, `total` |
| recovery.json | `date`, `subwayPct`, `busPct`, `lirrPct`, `metroNorthPct`, `accessARidePct`, `bridgesTunnelsPct`, `sirPct` | `date`, `tubePct`, `busPct`, `overgroundPct`, `elizabethPct`, `dlrPct`, `tramPct`, `overallPct` |
| dow.json | `dayOfWeek` (string), `avgSubway`, `avgBus`, `avgLirr`, `avgMetroNorth`, `avgAccessARide`, `avgBridgesTunnels`, `avgSir`, `avgTotal` | `dayOfWeek` (number 0-6), `dayName`, `avgTube`, `avgBus`, `avgOverground`, `avgElizabeth`, `avgDlr`, `avgTram`, `avgTotal` |
| kpi.json | `totalRidership`, `change7d`, `change30d`, `recoveryPct`, `byMode.{mode}.ridership`, `byMode.{mode}.change`, `byMode.{mode}.recoveryPct` | `totalJourneys`, `change7d`, `change30d`, `recoveryPct`, `byMode.{mode}.current`, `byMode.{mode}.change7d`, `byMode.{mode}.recoveryPct`, `lastUpdated` |
| congestion-pricing.json | `event` (launch/pause/relaunch), `date`, `before30d`, `after30d`, `subwayDelta`, `bridgesDelta` | N/A |
| stations.json | `id`, `name`, `lat`, `lng`, `lines[]`, `borough`, `avgDailyRidership`, `recoveryPct` | `id`, `name`, `lat`, `lng`, `zone`, `lines[]`, `avgDailyJourneys`, `recoveryPct` |

### Data Ranges

| City | Data Start | Data End | Record Count (daily) |
|------|-----------|---------|---------------------|
| NYC | 2020-03-01 | 2025-01-31 | ~1776 |
| London | 2019-03-01 | 2025-01-31 | ~2161 |
| Overlap | 2020-03-01 | 2025-01-31 | ~1776 |

### Recovery Data Format Differences

| City | Format | Example | Meaning |
|------|--------|---------|---------|
| NYC | Decimal | `0.73` | 73% of pre-pandemic baseline |
| London | Percentage | `92` | 92% of pre-pandemic baseline |

Tool handlers MUST normalize these to a consistent format (percentage) before returning to the AI.

---

## Appendix C: Agent Notes

*This section is populated by agents during the build process.*

### Technical Architect
[Architecture decisions, rationale]

### UX/UI Designer
UX specification provided and incorporated into Section 8. Key decisions: 420px panel width, full-screen on mobile, pill-shaped suggestion chips, city badge with accent color, chat clears on city switch.

### DevSecOps
[Infrastructure notes, security considerations]

### Other Notes
[Anything else relevant]
