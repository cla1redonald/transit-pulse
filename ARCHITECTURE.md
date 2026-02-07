# Architecture

## System Overview

Transit Pulse is a multi-city transit ridership dashboard that consolidates two existing single-city dashboards (NYC and London) into a unified application. Users can navigate between cities, each with its own filter state, data, charts, and map. A shared landing page serves as the entry point with city selection.

The architecture follows a **city-module pattern**: shared UI primitives live in a common directory, while all city-specific logic (types, data, filter state, chart components, map components) is encapsulated within isolated city modules under `src/cities/`. This prevents cross-city type leakage and allows each city's FilterProvider to manage its own transit modes and date ranges independently.

### Source Projects

| Project | Location | Convention |
|---------|----------|------------|
| NYC Transit Pulse | `/Users/clairedonald/nyc-transit-pulse` | No `src/` dir; `@/*` maps to `./` |
| London Transit Pulse | `/Users/clairedonald/transit-dashboard` | Has `src/` dir; `@/*` maps to `./src/*` |

The combined project adopts London's convention: `src/` directory with `@/*` mapping to `./src/*`.

---

## Route Structure

```
/           -> Landing page (city picker hub)
/nyc        -> NYC dashboard (NycFilterProvider + NycDashboard)
/london     -> London dashboard (LondonFilterProvider + LondonDashboard)
```

Each city route is a **client component** that wraps its content in a city-specific `FilterProvider`. The root layout contains **only** the `ThemeProvider` -- no `FilterProvider` at root level.

---

## Complete Directory Structure

```
transit-pulse/
  .gitignore
  components.json                  # shadcn/ui config (new-york style, src/ convention)
  next.config.mjs                  # NO output: 'export'
  next-env.d.ts
  package.json
  package-lock.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts

  public/                          # Static assets (favicons, etc.)

  data/
    nyc/
      daily.json                   # from nyc-transit-pulse/data/daily.json
      weekly.json                  # from nyc-transit-pulse/data/weekly.json
      monthly.json                 # from nyc-transit-pulse/data/monthly.json
      dow.json                     # from nyc-transit-pulse/data/dow.json
      recovery.json                # from nyc-transit-pulse/data/recovery.json
      stations.json                # from nyc-transit-pulse/data/stations.json
      kpi.json                     # from nyc-transit-pulse/data/kpi.json
      congestion-pricing.json      # from nyc-transit-pulse/data/congestion-pricing.json
    london/
      daily.json                   # from transit-dashboard/data/daily.json
      weekly.json                  # from transit-dashboard/data/weekly.json
      monthly.json                 # from transit-dashboard/data/monthly.json
      dow.json                     # from transit-dashboard/data/dow.json
      recovery.json                # from transit-dashboard/data/recovery.json
      stations.json                # from transit-dashboard/data/stations.json
      kpi.json                     # from transit-dashboard/data/kpi.json

  src/
    app/
      globals.css                  # Merged CSS variables (see CSS Strategy below)
      layout.tsx                   # Root layout: ThemeProvider ONLY
      page.tsx                     # Landing hub page (city picker)
      nyc/
        page.tsx                   # NYC route: wraps NycFilterProvider + NycDashboard
      london/
        page.tsx                   # London route: wraps LondonFilterProvider + LondonDashboard

    components/                    # SHARED components (used by both cities)
      layout/
        Header.tsx                 # Shared header with city navigation tabs
        Footer.tsx                 # Shared footer
        DashboardShell.tsx         # Shared page shell (Header + main + Footer)
        ThemeToggle.tsx            # Dark/light theme toggle
        AnimatedSection.tsx        # Scroll-triggered fade-in (from London)
      kpi/
        KPICard.tsx                # Shared KPI card (London's version -- has icon, color, dimmed)
      charts/
        ChartSkeleton.tsx          # Loading skeleton for charts (from London)
      ui/                          # shadcn/ui primitives (shared)
        button.tsx                 # London's version (has asChild via @radix-ui/react-slot)
        card.tsx                   # Standard shadcn card (identical in both)
        badge.tsx                  # From London
        separator.tsx              # From London
        skeleton.tsx               # From London
        switch.tsx                 # From London (used for rolling average toggle)

    lib/                           # SHARED utilities
      utils.ts                     # cn() helper (clsx + tailwind-merge)
      format.ts                    # Merged formatting functions (see below)

    types/
      shared.ts                    # Shared type definitions (DatePreset, CityId)

    cities/
      nyc/
        types/
          transit.ts               # NYC TransitMode, DailyRidership, etc. (from nyc-transit-pulse/types/transit.ts)
        lib/
          filter-context.tsx       # NYC FilterProvider + useNycFilters (from nyc-transit-pulse/lib/filter-context.tsx)
          colors.ts                # NYC MODE_COLORS, MODE_LABELS, SUBWAY_LINE_COLORS (from nyc-transit-pulse/lib/colors.ts)
          constants.ts             # NYC_EVENT_MARKERS, CONGESTION_PRICING_EVENTS, etc. (from nyc-transit-pulse/lib/constants.ts)
          format.ts                # NYC-specific formatters (formatCompactNumber, formatMonth, getChangeColor)
        components/
          NycDashboard.tsx         # Main NYC dashboard layout (adapted from nyc-transit-pulse/app/page.tsx)
          charts/
            RidershipTrendChart.tsx     # from nyc-transit-pulse/components/charts/RidershipTrendChart.tsx
            ModeComparisonChart.tsx     # from nyc-transit-pulse/components/charts/ModeComparisonChart.tsx
            PandemicRecoveryChart.tsx   # from nyc-transit-pulse/components/charts/PandemicRecoveryChart.tsx
            CongestionPricingChart.tsx  # from nyc-transit-pulse/components/charts/CongestionPricingChart.tsx
            DayOfWeekChart.tsx          # from nyc-transit-pulse/components/charts/DayOfWeekChart.tsx
            CustomTooltip.tsx           # from nyc-transit-pulse/components/charts/CustomTooltip.tsx
          filters/
            GlobalFilters.tsx      # from nyc-transit-pulse/components/filters/GlobalFilters.tsx
          kpi/
            KPISection.tsx         # from nyc-transit-pulse/components/kpi/KPISection.tsx
          map/
            StationMap.tsx         # from nyc-transit-pulse/components/map/StationMap.tsx
            StationMarker.tsx      # from nyc-transit-pulse/components/map/StationMarker.tsx
            StationPopover.tsx     # from nyc-transit-pulse/components/map/StationPopover.tsx
            MapLegend.tsx          # from nyc-transit-pulse/components/map/MapLegend.tsx

      london/
        types/
          transit.ts               # London TransitMode, DailyRidership, etc. (from transit-dashboard/src/types/transit.ts)
        lib/
          filter-context.tsx       # London FilterProvider + useLondonFilters (from transit-dashboard/src/lib/filter-context.tsx)
          colors.ts                # London MODE_COLORS, MODE_LABELS (from transit-dashboard/src/lib/colors.ts)
          constants.ts             # PANDEMIC_EVENTS, DEFAULT_FILTER_STATE, etc. (from transit-dashboard/src/lib/constants.ts)
          format.ts                # London-specific formatters (formatPercent, formatAxisNumber, formatCompactDate)
        components/
          LondonDashboard.tsx      # Main London dashboard layout (adapted from transit-dashboard/src/app/page.tsx)
          charts/
            RidershipTrendChart.tsx     # from transit-dashboard/src/components/charts/RidershipTrendChart.tsx
            ModeComparisonChart.tsx     # from transit-dashboard/src/components/charts/ModeComparisonChart.tsx
            PandemicRecoveryChart.tsx   # from transit-dashboard/src/components/charts/PandemicRecoveryChart.tsx
            RecoveryKPIBars.tsx         # from transit-dashboard/src/components/charts/RecoveryKPIBars.tsx
            DayOfWeekChart.tsx          # from transit-dashboard/src/components/charts/DayOfWeekChart.tsx
          filters/
            GlobalFilters.tsx      # from transit-dashboard/src/components/filters/GlobalFilters.tsx
            DateRangeSelector.tsx   # from transit-dashboard/src/components/filters/DateRangeSelector.tsx
            ModeFilter.tsx         # from transit-dashboard/src/components/filters/ModeFilter.tsx
          kpi/
            KPISection.tsx         # from transit-dashboard/src/components/kpi/KPISection.tsx
          map/
            StationMap.tsx         # from transit-dashboard/src/components/map/StationMap.tsx
            StationMarker.tsx      # from transit-dashboard/src/components/map/StationMarker.tsx
            StationPopover.tsx     # from transit-dashboard/src/components/map/StationPopover.tsx
            MapLegend.tsx          # from transit-dashboard/src/components/map/MapLegend.tsx

  __tests__/
    setup.ts                       # Vitest setup (merged from both)
    shared/
      format.test.ts               # Tests for shared format utilities
      kpi-card.test.tsx            # Tests for shared KPICard
      theme-toggle.test.tsx        # Tests for ThemeToggle
    nyc/
      charts.test.tsx              # from nyc-transit-pulse/__tests__/charts.test.tsx
      charts-integration.test.tsx  # from nyc-transit-pulse/__tests__/charts-integration.test.tsx
      congestion-pricing.test.tsx  # from nyc-transit-pulse/__tests__/congestion-pricing.test.tsx
      dashboard.test.tsx           # from nyc-transit-pulse/__tests__/dashboard.test.tsx
      dow-chart.test.tsx           # from nyc-transit-pulse/__tests__/dow-chart.test.tsx
      filter-context.test.tsx      # from nyc-transit-pulse/__tests__/filter-context.test.tsx
      format.test.ts               # from nyc-transit-pulse/__tests__/format.test.ts
      kpi-integration.test.tsx     # from nyc-transit-pulse/__tests__/kpi-integration.test.tsx
      process-data.test.ts         # from nyc-transit-pulse/__tests__/process-data.test.ts
      recovery-chart.test.tsx      # from nyc-transit-pulse/__tests__/recovery-chart.test.tsx
      station-map.test.tsx         # from nyc-transit-pulse/__tests__/station-map.test.tsx
    london/
      charts.test.tsx              # from transit-dashboard/__tests__/charts.test.tsx
      colors.test.ts               # from transit-dashboard/__tests__/colors.test.ts
      components.test.tsx          # from transit-dashboard/__tests__/components.test.tsx
      constants.test.ts            # from transit-dashboard/__tests__/constants.test.ts
      dashboard.test.tsx           # from transit-dashboard/__tests__/dashboard.test.tsx
      filter-context.test.tsx      # from transit-dashboard/__tests__/filter-context.test.tsx
      filter-context-edge-cases.test.tsx  # from transit-dashboard/__tests__/filter-context-edge-cases.test.tsx
      format.test.ts               # from transit-dashboard/__tests__/format.test.ts
      format-edge-cases.test.ts    # from transit-dashboard/__tests__/format-edge-cases.test.ts
      kpi-card.test.tsx            # from transit-dashboard/__tests__/kpi-card.test.tsx
      process-data.test.ts         # from transit-dashboard/__tests__/process-data.test.ts
      recovery-chart.test.tsx      # from transit-dashboard/__tests__/recovery-chart.test.tsx
      station-map.test.tsx         # from transit-dashboard/__tests__/station-map.test.tsx
    routing/
      navigation.test.tsx          # NEW: test city route navigation
      filter-isolation.test.tsx    # NEW: test that NYC/London filters don't leak
```

---

## Shared vs City-Specific Component Analysis

### Shared Components (in `src/components/`)

These components are functionally identical (or nearly so) in both projects and will be unified:

| Component | NYC Source | London Source | Merge Strategy |
|-----------|-----------|--------------|----------------|
| `DashboardShell` | `components/layout/DashboardShell.tsx` | `src/components/layout/DashboardShell.tsx` | Use London's (has `pt-14` for fixed header). Pass city prop for context. |
| `ThemeToggle` | `components/layout/ThemeToggle.tsx` | `src/components/layout/ThemeToggle.tsx` | Use London's (has `sr-only` label, hover scale). |
| `KPICard` | `components/kpi/KPICard.tsx` | `src/components/kpi/KPICard.tsx` | **Use London's.** It has `icon`, `color`, `dimmed`, and `prefers-reduced-motion` support that NYC's lacks. NYC's KPISection must be updated to pass the new props. |
| `AnimatedSection` | N/A (does not exist) | `src/components/layout/AnimatedSection.tsx` | Adopt from London. NYC can optionally use it. |
| `ChartSkeleton` | N/A (inline loading in page.tsx) | `src/components/charts/ChartSkeleton.tsx` | Adopt from London. |
| `Card` | `components/ui/card.tsx` | `src/components/ui/card.tsx` | Identical. Use either. |
| `Button` | `components/ui/button.tsx` | `src/components/ui/button.tsx` | **Use London's.** It supports `asChild` via `@radix-ui/react-slot` which is needed for the Header's GitHub link. |
| `utils.ts` (cn) | `lib/utils.ts` | `src/lib/utils.ts` | Identical. Use either. |

### New Shared Components (to be created)

| Component | Purpose |
|-----------|---------|
| `Header` | New unified header with: site title ("Transit Pulse"), city navigation tabs (NYC / London), ThemeToggle, GitHub link. Highlights active city based on current route. |
| `Footer` | New unified footer with combined data source links (MTA Open Data + TfL Open Data). |
| `format.ts` | Merged shared formatters: `formatNumber` (London's compact style), `formatDate` (supports both en-US and en-GB). City-specific formatters stay in city modules. |

### City-Specific Components (in `src/cities/{city}/`)

These MUST remain separate because they depend on different `TransitMode` types, different data shapes, and different filter contexts:

| Category | NYC Files | London Files | Why Separate |
|----------|-----------|--------------|--------------|
| **Types** | `TransitMode = 'subway' \| 'bus' \| 'lirr' \| ...` (7 modes) | `TransitMode = 'tube' \| 'bus' \| 'overground' \| ...` (6 modes) | Incompatible union types |
| **FilterProvider** | Hardcoded `LATEST_DATA_DATE`, no `latestDate` prop, exposes `filterDataByDateRange` on context | Takes `latestDate` prop, exports standalone `filterDataByDateRange` and `computeRollingAverage` functions | Different APIs, different mode defaults, different data start dates (MTA: 2020-03, TfL: 2019-01) |
| **Colors** | 7 mode colors + `SUBWAY_LINE_COLORS` map | 6 mode colors, no line-level colors | Different transit systems |
| **Constants** | `NYC_EVENT_MARKERS`, `CONGESTION_PRICING_EVENTS`, `BOROUGHS` | `PANDEMIC_EVENTS`, `DEFAULT_FILTER_STATE`, `CHART_HEIGHTS`, `BREAKPOINTS` | City-specific events and config |
| **KPISection** | 3 KPI cards (Avg Daily Ridership, Period Change, vs Pre-Pandemic) | 6 KPI cards (Avg Daily Journeys, Period Change, vs 2019, Tube, Bus, Rail) | Different card counts, different metrics |
| **Charts** | 5 charts including `CongestionPricingChart` (NYC-only) | 5 charts including `RecoveryKPIBars` (London-only) | Different data shapes, different Recharts usage |
| **GlobalFilters** | Single-file with inline date + mode chips | Composed from `DateRangeSelector` + `ModeFilter` sub-components | Different component decomposition |
| **Map** | NYC subway stations, borough-based, `StationData.borough` field | London tube stations, zone-based, `StationData.zone` field | Different geographic data |
| **Format** | `formatCompactNumber`, `formatMonth`, `getChangeColor` (uses `date-fns` `parse`) | `formatPercent`, `formatAxisNumber`, `formatCompactDate` (uses `toLocaleDateString`) | Different function names and locale formatting |

---

## Import Path Strategy

### tsconfig.json Path Alias

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Import Path Changes by File Type

**Shared components** import from `@/components/`, `@/lib/`, `@/types/`:
```typescript
// In any file
import { KPICard } from '@/components/kpi/KPICard';
import { cn } from '@/lib/utils';
import { CityId } from '@/types/shared';
```

**City-specific code** imports from `@/cities/{city}/`:
```typescript
// In src/cities/nyc/components/kpi/KPISection.tsx
import type { TransitMode, DailyRidership } from '@/cities/nyc/types/transit';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import { MODE_COLORS } from '@/cities/nyc/lib/colors';
import dailyData from '../../../../../data/nyc/daily.json';
```

**Data imports** use relative paths from city components to `data/{city}/`:
```typescript
// In src/cities/london/components/kpi/KPISection.tsx
import dailyData from '../../../../../data/london/daily.json';
```

### Migration Checklist (What Changes Per City)

For **NYC** files migrating from `@/*` (root-relative) to `@/cities/nyc/*`:

| Original Import | New Import |
|-----------------|------------|
| `@/types/transit` | `@/cities/nyc/types/transit` |
| `@/lib/filter-context` | `@/cities/nyc/lib/filter-context` |
| `@/lib/colors` | `@/cities/nyc/lib/colors` |
| `@/lib/constants` | `@/cities/nyc/lib/constants` |
| `@/lib/format` | `@/cities/nyc/lib/format` (city-specific) or `@/lib/format` (shared) |
| `@/lib/utils` | `@/lib/utils` (stays shared) |
| `@/components/ui/*` | `@/components/ui/*` (stays shared) |
| `@/components/kpi/KPICard` | `@/components/kpi/KPICard` (stays shared) |
| `@/components/layout/*` | `@/components/layout/*` (stays shared) |
| `@/data/daily.json` | Relative path to `data/nyc/daily.json` |

For **London** files migrating from `@/*` (src-relative) to `@/cities/london/*`:

| Original Import | New Import |
|-----------------|------------|
| `@/types/transit` | `@/cities/london/types/transit` |
| `@/lib/filter-context` | `@/cities/london/lib/filter-context` |
| `@/lib/colors` | `@/cities/london/lib/colors` |
| `@/lib/constants` | `@/cities/london/lib/constants` |
| `@/lib/format` | `@/cities/london/lib/format` (city-specific) or `@/lib/format` (shared) |
| `@/lib/utils` | `@/lib/utils` (stays shared) |
| `@/components/ui/*` | `@/components/ui/*` (stays shared) |
| `@/components/kpi/KPICard` | `@/components/kpi/KPICard` (stays shared) |
| `@/components/layout/*` | `@/components/layout/*` (stays shared) |
| `../../data/daily.json` | Relative path to `data/london/daily.json` |

### NYC Recharts v2 to v3 Migration Notes

NYC currently uses Recharts `^2.15.0`. The merged project uses Recharts `3.7.0`. Key changes:

1. **Import paths are unchanged** -- `recharts` exports remain the same.
2. **`CartesianGrid`** -- `strokeDasharray` prop is unchanged.
3. **Tooltip/Legend** -- API is compatible; custom tooltip components work unchanged.
4. **`ResponsiveContainer`** -- Works the same way.
5. **Type imports** -- Some generic type params may have changed. Verify `tsc --noEmit` passes after migration.

NYC charts use a **hardcoded per-mode block pattern** (explicit `<Line>` for each mode). London charts use a **`.map()` pattern** (iterating over modes array). Both patterns work with Recharts v3. No mandatory refactor, but the `.map()` pattern is preferred for consistency.

---

## CSS / Theme Integration Strategy

### The Problem

Both projects define CSS custom properties for their transit mode colors. They conflict:

| Variable | NYC Value | London Value |
|----------|-----------|--------------|
| `--color-bus` | `255 99 25` (MTA Orange #FF6319) | `340 93% 46%` (TfL Red #CE1249) |

Additionally, the CSS variable format differs:
- **NYC** uses space-separated RGB values: `--color-subway: 0 57 166;` consumed via `hsl()` wrapper in Tailwind config
- **London** uses HSL triplets: `--color-tube: 217 100% 33%;` consumed via `hsl()` wrapper in Tailwind config

London also defines extra surface variables (`--surface`, `--surface-raised`, `--surface-overlay`) that NYC does not have.

### The Solution: Scoped City Variables via `data-city` Attribute

The root layout applies no `data-city` attribute (landing page uses only shared theme variables). Each city route page sets `data-city="nyc"` or `data-city="london"` on its wrapping `<div>`.

**globals.css structure:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ===== SHARED THEME (used on landing page and as base) ===== */
  :root {
    /* Base theme variables -- London's dark theme as default (more polished) */
    --background: 222 47% 5%;
    --surface: 222 43% 7%;
    --surface-raised: 228 31% 15%;
    --surface-overlay: 228 22% 19%;
    --foreground: 240 13% 94%;
    --card: 222 43% 7%;
    --card-foreground: 240 13% 94%;
    --popover: 228 31% 15%;
    --popover-foreground: 240 13% 94%;
    --primary: 217 91% 60%;
    --primary-foreground: 240 13% 94%;
    --secondary: 240 5% 15%;
    --secondary-foreground: 240 13% 94%;
    --muted: 240 9% 35%;
    --muted-foreground: 240 6% 59%;
    --accent: 228 31% 15%;
    --accent-foreground: 240 13% 94%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 240 13% 94%;
    --border: 228 29% 22%;
    --input: 228 29% 22%;
    --ring: 217 91% 60%;
    --radius: 0.5rem;
    --chart-1: 217 91% 60%;
    --chart-2: 340 93% 46%;
    --chart-3: 25 88% 49%;
    --chart-4: 262 35% 48%;
    --chart-5: 178 100% 34%;
  }

  .light {
    /* Shared light theme variables (London's light palette) */
    --background: 240 38% 98%;
    --surface: 0 0% 100%;
    --surface-raised: 240 14% 96%;
    --surface-overlay: 240 14% 94%;
    --foreground: 228 31% 15%;
    --card: 0 0% 100%;
    --card-foreground: 228 31% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 228 31% 15%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 228 31% 15%;
    --muted: 240 6% 59%;
    --muted-foreground: 240 9% 35%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 228 31% 15%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 7% 82%;
    --input: 240 7% 82%;
    --ring: 217 91% 60%;
  }

  /* ===== NYC MODE COLORS (scoped) ===== */
  [data-city="nyc"] {
    --color-mode-1: 220 100% 33%;   /* Subway: #0039A6 */
    --color-mode-2: 24 100% 55%;    /* Bus: #FF6319 */
    --color-mode-3: 48 97% 51%;     /* LIRR: #FCCC0A */
    --color-mode-4: 153 100% 33%;   /* Metro-North: #00A65C */
    --color-mode-5: 303 54% 49%;    /* Access-A-Ride: #B933AD */
    --color-mode-6: 0 0% 44%;       /* Bridges & Tunnels: #6D6E71 */
    --color-mode-7: 213 71% 39%;    /* SIR: #1D5DA8 */
  }

  /* ===== LONDON MODE COLORS (scoped) ===== */
  [data-city="london"] {
    --color-mode-1: 217 100% 33%;   /* Tube: #0019A8 */
    --color-mode-2: 340 93% 46%;    /* Bus: #CE1249 */
    --color-mode-3: 25 88% 49%;     /* Overground: #E86A10 */
    --color-mode-4: 262 35% 48%;    /* Elizabeth: #6950A1 */
    --color-mode-5: 178 100% 34%;   /* DLR: #00AFAD */
    --color-mode-6: 86 100% 40%;    /* Tram: #66CC00 */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}
```

**Important:** The `--color-mode-N` CSS variables are defined for CSS-level scoping only. City components still use their own `colors.ts` constants (hex values) for Recharts, Leaflet markers, and inline styles. The CSS variables serve the Tailwind-based styling and any CSS-level color references. Each city's `colors.ts` file remains the single source of truth for programmatic mode colors.

### How City Components Reference Colors

City chart components and filter chips reference colors via their city-specific `colors.ts`:

```typescript
// In src/cities/nyc/lib/colors.ts -- unchanged from source
import type { TransitMode } from '@/cities/nyc/types/transit';

export const MODE_COLORS: Record<TransitMode, string> = {
  subway: '#0039A6',
  bus: '#FF6319',
  // ...
};
```

```typescript
// In src/cities/london/lib/colors.ts -- unchanged from source
import { TransitMode } from '@/cities/london/types/transit';

export const MODE_COLORS: Record<TransitMode, string> = {
  tube: '#0019A8',
  bus: '#CE1249',
  // ...
};
```

There is no cross-city color collision because each city module imports from its own `colors.ts`.

---

## FilterProvider Isolation

### Architecture Rule (Non-Negotiable)

**FilterProvider MUST be scoped per-city route, NOT in root layout.**

NYC and London have incompatible filter state:
- NYC `TransitMode` has 7 modes; London has 6
- NYC `FilterProvider` uses a hardcoded `LATEST_DATA_DATE`; London's takes a `latestDate` prop
- NYC exposes `filterDataByDateRange` as a context method; London exports it as a standalone function
- NYC defaults to all 7 modes active; London defaults to 5 of 6 (excludes `tram`)
- NYC `DatePreset` is exported from filter-context; London defines it in `FilterState` type

### Route Page Structure

```typescript
// src/app/nyc/page.tsx
'use client';

import { NycFilterProvider } from '@/cities/nyc/lib/filter-context';
import { NycDashboard } from '@/cities/nyc/components/NycDashboard';

export default function NycPage() {
  return (
    <div data-city="nyc">
      <NycFilterProvider>
        <NycDashboard />
      </NycFilterProvider>
    </div>
  );
}
```

```typescript
// src/app/london/page.tsx
'use client';

import { LondonFilterProvider, getLatestDate } from '@/cities/london/lib/filter-context';
import { LondonDashboard } from '@/cities/london/components/LondonDashboard';
import { DailyRidership } from '@/cities/london/types/transit';
import dailyData from '../../../data/london/daily.json';

const latestDate = getLatestDate(dailyData as DailyRidership[]);

export default function LondonPage() {
  return (
    <div data-city="london">
      <LondonFilterProvider latestDate={latestDate}>
        <LondonDashboard />
      </LondonFilterProvider>
    </div>
  );
}
```

### FilterProvider Renaming

To avoid naming collisions, rename the exports:

| Source | Renamed To |
|--------|------------|
| NYC `FilterProvider` | `NycFilterProvider` |
| NYC `useFilters` | `useNycFilters` |
| London `FilterProvider` | `LondonFilterProvider` |
| London `useFilters` | `useLondonFilters` |

Each city's internal components import only their own hooks. No cross-city filter access is possible.

---

## Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Transit Pulse — Multi-City Ridership Dashboard',
  description: 'Interactive dashboard visualizing transit ridership data for NYC and London.',
  authors: [{ name: 'Claire Donald' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key differences from source projects:
- **No FilterProvider** at this level
- London's `disableTransitionOnChange={false}` and font variable pattern adopted
- Generic metadata covering both cities

---

## Shared Header with City Navigation

The new `Header` component replaces both city-specific headers. It includes:
1. Site title ("Transit Pulse") with a pulsing dot (London's animation)
2. City navigation tabs (NYC / London) -- highlights active city based on `usePathname()`
3. ThemeToggle
4. GitHub link

```typescript
// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CITIES = [
  { id: 'nyc', label: 'NYC', href: '/nyc' },
  { id: 'london', label: 'London', href: '/london' },
] as const;

export function Header() {
  const pathname = usePathname();
  const activeCity = CITIES.find(c => pathname.startsWith(c.href))?.id ?? null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Title + City Tabs */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              Transit Pulse
            </h1>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          </Link>

          {/* City Tabs */}
          <nav className="flex items-center gap-1" aria-label="City selection">
            {CITIES.map(city => (
              <Link
                key={city.id}
                href={city.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeCity === city.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {city.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Theme Toggle + GitHub */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Shared DashboardShell

Uses London's pattern (fixed header with `pt-14` offset):

```typescript
// src/components/layout/DashboardShell.tsx
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

---

## Shared Format Utilities

The shared `src/lib/format.ts` merges common functions. City-specific formatters remain in their city modules.

```typescript
// src/lib/format.ts -- SHARED
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
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    case 'compact':
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    case 'short':
    default:
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
```

**NYC-specific formatters** (stay in `src/cities/nyc/lib/format.ts`):
- `formatCompactNumber` (different rounding than shared `formatNumber`)
- `formatMonth` (uses `date-fns` `parse`)
- `formatChange`
- `getChangeColor`

**London-specific formatters** (stay in `src/cities/london/lib/format.ts`):
- `formatAxisNumber`
- `formatCompactDate`

---

## Shared Type Definitions

```typescript
// src/types/shared.ts
export type CityId = 'nyc' | 'london';

export type DatePreset = '7d' | '30d' | '90d' | 'ytd' | '1y' | 'all' | 'custom';

export interface CityConfig {
  id: CityId;
  name: string;
  subtitle: string;
  dataSource: string;
  dataSourceUrl: string;
}

export const CITIES: Record<CityId, CityConfig> = {
  nyc: {
    id: 'nyc',
    name: 'New York City',
    subtitle: 'MTA Ridership Dashboard',
    dataSource: 'MTA Open Data',
    dataSourceUrl: 'https://data.ny.gov/Transportation/MTA-Daily-Ridership-Data-2020-2025/vxuj-8kew',
  },
  london: {
    id: 'london',
    name: 'London',
    subtitle: 'TfL Ridership Dashboard',
    dataSource: 'TfL Open Data',
    dataSourceUrl: 'https://tfl.gov.uk/info-for/open-data-users/',
  },
};
```

---

## Data Flow Diagram

```
                    +-----------------+
                    |   Root Layout   |
                    | (ThemeProvider) |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
         /page.tsx      /nyc/page.tsx  /london/page.tsx
         (Landing)      (NYC Route)    (London Route)
              |              |              |
              |    +---------+--------+    +---------+---------+
              |    | data-city="nyc"  |    | data-city="london"|
              |    | NycFilterProvider|    | LondonFilterProv. |
              |    +--------+---------+    +--------+----------+
              |             |                       |
              |    +--------v--------+     +--------v---------+
              |    |  NycDashboard   |     | LondonDashboard  |
              |    |                 |     |                  |
              |    | GlobalFilters   |     | GlobalFilters    |
              |    | KPISection      |     | KPISection       |
              |    | Charts (5)      |     | Charts (5)       |
              |    | StationMap      |     | StationMap       |
              |    +--------+--------+     +--------+---------+
              |             |                       |
              |    +--------v--------+     +--------v---------+
              |    | data/nyc/*.json |     | data/london/*.json|
              |    +-----------------+     +-------------------+
              |
     +--------v--------+
     |  Landing Page    |
     | (city picker)    |
     | CityCard x 2    |
     +-----------------+

Data flows DOWNWARD only:
  1. JSON files are imported statically at module level
  2. FilterProvider receives data and computes latestDate (London)
     or uses hardcoded LATEST_DATA_DATE (NYC)
  3. Components call useFilters() to get filter state
  4. Components filter/transform data locally using filter state
  5. Recharts/Leaflet renders the filtered data

There is NO cross-city data flow. NYC and London are fully isolated.
```

---

## Shared KPICard Interface

The merged KPICard uses London's enhanced version:

```typescript
// src/components/kpi/KPICard.tsx
interface KPICardProps {
  label: string;
  value: number;
  delta?: number;
  icon?: LucideIcon;
  color?: string;           // Hex color for icon background
  sparklineData?: number[];
  dimmed?: boolean;          // Reduces opacity when mode is inactive
  valueFormat?: 'number' | 'percent';
}
```

NYC's `KPISection` must be updated to pass `icon` props (currently does not). This is optional -- the `icon` prop defaults to `undefined` and the card renders fine without it.

---

## Landing Page

```typescript
// src/app/page.tsx
import Link from 'next/link';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CITIES, CityId } from '@/types/shared';

export default function Home() {
  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto py-12">
        <h2 className="text-3xl font-bold text-center mb-2">
          Transit Pulse
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Explore ridership trends across major transit systems
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(CITIES) as CityId[]).map(cityId => {
            const city = CITIES[cityId];
            return (
              <Link
                key={cityId}
                href={`/${cityId}`}
                className="group block rounded-lg border bg-card p-8 hover:border-primary transition-colors"
              >
                <h3 className="text-2xl font-semibold mb-1 group-hover:text-primary transition-colors">
                  {city.name}
                </h3>
                <p className="text-muted-foreground">{city.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
```

---

## Key Decisions

### 1. New Repository vs Forking

**Decision:** New repository at `/Users/clairedonald/transit-pulse`

**Rationale:** Clean start avoids git history confusion. Both source projects remain intact as references. The new project cherry-picks code rather than carrying baggage from either project.

**Trade-off:** Requires manual file copying rather than git history preservation. Acceptable because neither project is large enough for history to be valuable.

### 2. `src/` Directory Convention

**Decision:** Use `src/` directory with `@/*` mapping to `./src/*`

**Rationale:** London already uses this convention. It clearly separates application code from config files, data, and tests. The `cities/` module pattern fits naturally inside `src/`.

**Trade-off:** NYC files need path alias updates. Mechanical, verified by `tsc --noEmit`.

### 3. Recharts v3.7.0 (London's Version)

**Decision:** Pin Recharts to `3.7.0` for the merged project.

**Rationale:** v3 has better TypeScript support and smaller bundle. London is already on v3 and its charts work. NYC charts need minor migration but the API is backward-compatible.

**Trade-off:** NYC charts may need minor adjustments if any v2-specific patterns were used. Verify with `tsc --noEmit` after migration.

### 4. FilterProvider Per-City Route (Not Root)

**Decision:** Each city route wraps its own FilterProvider. No shared FilterProvider.

**Rationale:** The FilterProvider types are incompatible between cities (different `TransitMode` unions, different APIs). A shared provider would require a union type that loses type safety. Per-route providers maintain full type safety and isolation.

**Trade-off:** Some conceptual duplication in filter logic. Acceptable because the implementations genuinely differ.

### 5. London's KPICard as Shared Version

**Decision:** Use London's `KPICard` implementation for both cities.

**Rationale:** London's version is a strict superset of NYC's. It adds `icon`, `color`, `dimmed`, and `prefers-reduced-motion` support. All of NYC's usage patterns work with London's component (the added props are optional).

**Trade-off:** NYC's KPISection does not currently pass `icon` or `color` props. The cards will render without icons initially. Engineers can add icons in a polish pass.

### 6. London's Button Component (with `asChild`)

**Decision:** Use London's `Button` component which supports the `asChild` prop via `@radix-ui/react-slot`.

**Rationale:** The shared Header needs `asChild` for the GitHub link (`<Button asChild><Link>...</Link></Button>`). NYC's button lacks this because it does not use `@radix-ui/react-slot`.

**Trade-off:** Adds `@radix-ui/react-slot` as a dependency. Tiny package, already in London's deps.

### 7. Remove `output: 'export'` from Next.js Config

**Decision:** Do NOT use `output: 'export'` in `next.config.mjs`.

**Rationale:** NYC's `next.config.js` uses `output: 'export'` for static export. The merged project uses dynamic routing (`/nyc`, `/london`) and may need API routes or middleware in the future. Static export is incompatible with these patterns.

**Trade-off:** Requires a Node.js server (Vercel handles this automatically). Cannot be hosted on a purely static CDN.

### 8. Data Files in `/data` (Not `/src/data`)

**Decision:** Keep JSON data files in `/data/nyc/` and `/data/london/` at the project root, outside `src/`.

**Rationale:** Data files are processed artifacts, not application source code. Keeping them at root level (same as both source projects) avoids confusion. Components import via relative paths.

**Critical lesson from London project:** Do NOT add `/data/` to `.gitignore`. The application imports directly from these files. If they are gitignored, they will not reach the Vercel deploy target, causing "Module not found" build failures.

### 9. Vitest v4 (London's Version)

**Decision:** Use Vitest `^4.0.18` (London's version).

**Rationale:** More recent, better stability. NYC is on `^2.1.8` -- test syntax is compatible across versions. Setup files may need minor adjustments.

**Trade-off:** Some deprecated vitest v2 APIs may need updating in NYC tests. Generally backward-compatible.

---

## Configuration Files

### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NO output: 'export' -- dynamic routing requires server
};

export default nextConfig;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/cities/**/*.{js,ts,jsx,tsx,mdx}',  // IMPORTANT: include city modules
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

Key change: `content` array includes `./src/cities/**/*.{js,ts,jsx,tsx,mdx}` to scan city module files for Tailwind classes.

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Complexity Assessment

| Area | Level | Notes |
|------|-------|-------|
| Scaffold (configs, deps, structure) | Low | Mechanical file creation and config merging |
| Shared components (Header, Footer, KPICard) | Low-Medium | Minor adaptation from existing code |
| NYC city module migration | Medium | Import path mass-rename + Recharts v2->v3 |
| London city module migration | Low | Import path rename only, already on v3 |
| Landing page | Low | New but simple static page |
| CSS variable merging | Medium | Must verify no conflicts; test both themes |
| Test migration | Medium | Import path updates + setup file merge |
| Filter isolation verification | Medium | Need integration tests proving isolation |

---

## Verification Checklist

Before considering the build complete:

1. `tsc --noEmit` -- zero type errors
2. `npx vitest run` -- all tests pass
3. `npm run build` -- clean Next.js build (no "Module not found" errors)
4. Manual navigation: `/` -> `/nyc` -> `/london` -> `/` works
5. NYC: filters change charts and KPIs
6. London: filters change charts and KPIs
7. Switching between `/nyc` and `/london` does NOT carry filter state
8. Dark mode and light mode work on all three routes
9. Mobile responsive on all three routes
10. Deploy to Vercel, verify production URL
