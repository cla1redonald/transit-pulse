# Tech Stack

Locked dependency manifest for Transit Pulse. Engineers MUST NOT introduce packages outside this manifest without flagging to the architect.

All versions are reconciled from both source projects (NYC Transit Pulse and London Transit Pulse). Where versions differ, the rationale for the chosen version is noted.

## Core

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| next | ^14.2.0 | Framework (App Router) | Both projects; use London's range |
| react | ^18.2.0 | UI library | Both projects (identical) |
| react-dom | ^18.2.0 | React DOM renderer | Both projects (identical) |
| typescript | ^5.4.0 | Language | London's minimum; NYC uses ^5 |

**CRITICAL:** React MUST remain pinned to 18.x. Next.js 14 requires React 18. Do NOT upgrade to React 19. Run `npm ls react` after install to verify.

## Styling

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| tailwindcss | ^3.4.0 | Utility-first CSS | Both projects |
| postcss | ^8.4.0 | CSS processing | Both projects |
| autoprefixer | ^10.4.0 | CSS vendor prefixes | Both projects |
| tailwindcss-animate | ^1.0.7 | Animation utilities for shadcn/ui | London only; NYC did not use it |
| class-variance-authority | ^0.7.1 | Component variant system (shadcn/ui) | Both projects (identical) |
| clsx | ^2.1.1 | Conditional classnames | Both projects (identical) |
| tailwind-merge | ^3.4.0 | Tailwind class deduplication | London's v3; NYC was on v2 |

**Note on tailwind-merge:** London uses v3.4.0, NYC uses v2.6.0. The v3 API is backward-compatible for the `twMerge()` usage in `cn()`. Use v3.

## UI Components (shadcn/ui)

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| @radix-ui/react-slot | ^1.2.4 | Slot component for Button `asChild` | London only; required for shared Header |
| @radix-ui/react-separator | ^1.1.8 | Separator component | London only |
| @radix-ui/react-switch | ^1.2.6 | Switch toggle (rolling average) | London only |

**shadcn/ui style:** `new-york` (from London's `components.json`).

## Data Visualization

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| recharts | ^3.7.0 | Chart library | London's v3; NYC was on v2. **Use v3.** |
| leaflet | ^1.9.4 | Map library | Both projects (identical) |
| react-leaflet | ^4.2.1 | React bindings for Leaflet | Both projects (identical) |

**IMPORTANT on Recharts:** NYC was on Recharts v2.15.0. London is on v3.7.0. The merged project MUST use v3. NYC chart components need verification that they compile and render correctly with v3. The v2->v3 migration is largely backward-compatible but some type signatures may differ.

## Utilities

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| date-fns | ^4.1.0 | Date manipulation (NYC filter-context) | Both projects (identical) |
| lucide-react | ^0.563.0 | Icon library | London's version (more recent than NYC's ^0.469.0) |
| next-themes | ^0.4.6 | Dark/light theme switching | London's version (more recent than NYC's ^0.4.4) |
| papaparse | ^5.5.3 | CSV parsing (data processing scripts) | London's version (more recent than NYC's ^5.4.1) |

## Dev Dependencies

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| vitest | ^4.0.18 | Test runner | London's v4; NYC was on v2. **Use v4.** |
| @testing-library/react | ^16.3.2 | React testing utilities | London's version (more recent) |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers for tests | London's version (more recent) |
| @testing-library/dom | ^10.4.1 | DOM testing utilities | London only; peer dep of @testing-library/react |
| @vitejs/plugin-react | ^5.1.3 | Vite React plugin (for vitest) | London's v5; NYC was on v4 |
| jsdom | ^28.0.0 | DOM environment for tests | London's version (more recent than NYC's ^25) |
| @types/node | ^20.0.0 | Node.js type definitions | London's range |
| @types/react | ^18.2.0 | React type definitions | Both projects (identical) |
| @types/react-dom | ^18.2.0 | ReactDOM type definitions | Both projects (identical) |
| @types/leaflet | ^1.9.21 | Leaflet type definitions | London's version (more recent) |
| @types/papaparse | ^5.5.2 | PapaParse type definitions | London's version (more recent) |
| eslint | ^8.57.0 | Linter | London's range |
| eslint-config-next | ^14.2.0 | Next.js ESLint config | London's range |
| tsx | ^4.21.0 | TypeScript execution (scripts) | London's version (more recent) |

## Deployment

- **Hosting:** Vercel
- **CI/CD:** Vercel Git integration (auto-deploy on push)
- **Build command:** `next build` (NOT static export)
- **Node.js:** 18.x or 20.x (Vercel default)
- **Package manager:** npm

## Explicitly Excluded

| Package | Reason |
|---------|--------|
| react@19 | Incompatible with Next.js 14. Causes runtime crashes (`React.use()` not available). See common-mistakes.md. |
| recharts@2 | NYC's old version. Unified on v3.7.0 for better TS support. |
| vitest@2 | NYC's old version. Unified on v4 for improved APIs. |
| tailwind-merge@2 | NYC's old version. London uses v3 which has better merge logic. |
| zustand / jotai / redux | No global state management needed. Filter state is per-city via React Context. |
| @supabase/* | No database needed. All data is static JSON. |
| framer-motion | Not needed. CSS animations + IntersectionObserver (AnimatedSection) suffice. |
| react-leaflet@5 | Requires React 19. Must stay on v4.x with React 18. |

## Version Conflict Resolution Log

| Package | NYC Version | London Version | Chosen | Reason |
|---------|-------------|----------------|--------|--------|
| recharts | ^2.15.0 | ^3.7.0 | ^3.7.0 | Better TS, smaller bundle, London already validated |
| vitest | ^2.1.8 | ^4.0.18 | ^4.0.18 | More stable, better performance |
| tailwind-merge | ^2.6.0 | ^3.4.0 | ^3.4.0 | Backward-compatible, better merge behavior |
| lucide-react | ^0.469.0 | ^0.563.0 | ^0.563.0 | More recent, more icons available |
| next-themes | ^0.4.4 | ^0.4.6 | ^0.4.6 | Bug fixes |
| papaparse | ^5.4.1 | ^5.5.3 | ^5.5.3 | Bug fixes, type improvements |
| @vitejs/plugin-react | ^4.3.4 | ^5.1.3 | ^5.1.3 | Required for vitest v4 compatibility |
| jsdom | ^25.0.1 | ^28.0.0 | ^28.0.0 | Required for vitest v4 compatibility |
| @types/node | ^22 | ^20.0.0 | ^20.0.0 | Broader compatibility; ^22 is fine too |

## Pre-Install Verification

After running `npm install`, engineers MUST run:

```bash
# Verify React 18 (NOT 19)
npm ls react

# Verify no peer dependency warnings for react version
npm ls react-leaflet

# Verify TypeScript compiles
npx tsc --noEmit

# Verify tests run
npx vitest run

# Verify build succeeds
npm run build
```

If `npm ls react` shows React 19, do NOT proceed. Fix the version conflict first. Never add `legacy-peer-deps=true` to `.npmrc` as a workaround.
