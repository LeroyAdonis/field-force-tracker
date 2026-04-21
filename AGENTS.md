# AGENTS.md — Field Force Tracker

## Project Overview
Real-time field workforce KPI dashboard (React 18 + Vite 5 + shadcn/ui + Zustand). Client-side only — no backend, no real auth, no persistence. Data is seeded from `src/lib/mock-data.ts` into a Zustand store; page refresh resets all state. Scaffolded with [Lovable](https://lovable.dev); the `lovable-tagger` plugin is dev-only and adds component ID tags for the Lovable visual editor.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port **8080** (host `::`) |
| `npm run build` | Production build |
| `npm run lint` | ESLint on all `.ts/.tsx` |
| `npm run test` | Vitest single run |
| `npm run test:watch` | Vitest watch mode |

No CI, no pre-commit hooks, no Docker.

## Architecture
```
src/
├── App.tsx            # QueryClient + BrowserRouter + all routes
├── main.tsx           # createRoot entrypoint (imports index.css only)
├── index.css          # Design system: HSL CSS vars, Tailwind layers, custom utility classes
├── components/
│   ├── ui/            # 49 shadcn/ui primitives — DO NOT hand-edit; use CLI
│   ├── AppShell.tsx   # Sidebar + topbar + mobile bottom nav
│   └── ...            # Reusable app components (Protected, ErrorBoundary, etc.)
├── hooks/             # useDebouncedValue, useIsMobile, useToast (shadcn)
├── lib/
│   ├── store.ts       # Zustand: auth, CRUD for visits/sites/workers, KPI targets
│   ├── kpi.ts         # KPI computation: proportional progress (7am–7pm shift)
│   ├── mock-data.ts   # Seed data: 10 sites, 4 workers, 1 admin, ~28 days of visits
│   ├── types.ts       # TypeScript interfaces (Role, RiskStatus, Site, Worker, Visit, etc.)
│   └── utils.ts       # cn() = clsx + tailwind-merge
├── pages/
│   ├── admin/         # /admin/* — dashboard, workforce, at-risk, sites, reports, settings
│   └── worker/        # /worker/* — dashboard, log-visit, visit-history
└── test/
    ├── setup.ts       # jest-dom + window.matchMedia mock
    └── example.test.ts # Trivial placeholder (expect(true).toBe(true))
```
- **Routing**: react-router-dom v6. `Protected` component guards routes by role (`admin`|`worker`). `Index` page redirects based on role.
- **Auth**: No-op. `loginAs(role, workerId?)` in store sets session; `validateCredentials()` always returns true. Email prefix `admin*` → admin role.
- **KPI model**: Time-proportional — workers are flagged based on pace vs. expected progress through a 7am–7pm shift. <70% of expected = "missing", <90% = "at-risk". Worst of visits% and km% drives status.
- **Two toast systems coexist**: `sonner` (used in most pages) and shadcn `use-toast` (used in WorkerDetailDrawer). Both renderers are mounted in `App.tsx`.
- **React Query** is wired but unused (no API calls). `QueryClient` is mounted at root.

## Key Conventions
- **Path alias**: `@/*` → `src/*` (configured in vite, vitest, and tsconfig)
- **shadcn/ui components**: Add via `npx shadcn-ui@latest add <component>`, not by hand. Config in `components.json`.
- **Styling**: Tailwind v3 with HSL CSS variable design system. Custom component classes in `index.css` (`.surface-card`, `.surface-recessed`, `.chip`, `.display-num`, `.label-eyebrow`). Dark mode via `class` strategy.
- **File naming**: PascalCase for components (`AppShell.tsx`), kebab-case for hooks (`use-debounce.ts`).
- **Component exports**: Pages use `export default`; reusable components use named exports.
- **Code style**: 2-space indent, single quotes, semicolons, trailing commas.

## TypeScript & Lint Quirks
- **Strict mode is OFF**: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`. Do not add strict checks without a broader plan.
- **ESLint**: Flat config (v9). `@typescript-eslint/no-unused-vars` is explicitly **off**. `react-refresh/only-export-components` is warn-only with `allowConstantExport`.
- **No Prettier** configured. Follow existing formatting patterns.

## Testing
- **Vitest** with jsdom, globals enabled (`describe/it/expect` available without import via `types: ["vitest/globals"]`).
- **Test pattern**: `src/**/*.{test,spec}.{ts,tsx}`
- **Setup**: `src/test/setup.ts` mocks `window.matchMedia` and imports `@testing-library/jest-dom`.
- Current coverage is a single placeholder test. No coverage reporting configured.

## Gotchas
- **Dual lockfiles**: Both `bun.lock`/`bun.lockb` and `package-lock.json` exist. Use `npm` to stay consistent with `package-lock.json`.
- **`App.css` is dead code**: Legacy Vite template CSS, not imported by `main.tsx`. Do not use it.
- **No persistence**: All mutations are in-memory. Tests or demos that add/remove data will reset on refresh.
- **`@tanstack/react-query` is mounted but unused**: Don't assume data flows through queries.
- **`next-themes` is a dependency but dark mode toggle is not wired up**: Dark mode CSS vars exist but there's no runtime toggle.
