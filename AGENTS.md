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
| `npm run test -- <test-file>` | Run specific test file (e.g., `npm run test -- src/lib/kpi.test.ts`) |
| `npm run test -- --reporter=verbose` | Run tests with verbose output |
| `npm run test -- --watch` | Run tests in watch mode for specific files |

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
- **Running specific tests**: Use `npm run test -- src/path/to/test-file.test.ts`
- Current coverage is a single placeholder test. No coverage reporting configured.

## Code Style Guidelines

### Imports
1. **Order**: 
   - External libraries (react, etc.)
   - Absolute path aliases (@/...)
   - Relative paths (./../)
2. **Formatting**:
   - No unused imports (ESLint rule is off but maintain cleanliness)
   - Group similar imports together
   - One import per line
   - Default imports first, then named imports

### Formatting
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: Used in object literals, arrays, function parameters
- **Line length**: Aim for 80-100 characters, but prioritize readability
- **Function parameters**: Each on new line if more than 2 parameters
- **JSX**: Self-closing tags when no children, proper indentation

### Types & Interfaces
- **Naming**: Use `interface` for object shapes, `type` for unions/mappings
- **Export**: Export types from `src/lib/types.ts` for shared usage
- **Optional properties**: Use `?` marker, not `undefined | Type`
- **Enums**: Prefer union types (`"admin" | "worker"`) over actual enums
- **Generics**: Use when appropriate for reusable components

### Naming Conventions
- **Components**: PascalCase (e.g., `WorkerDashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useVisits.ts`)
- **Functions**: camelCase (e.g., `calculateKPI()`)
- **Variables**: camelCase (e.g., `dailyVisitCount`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Files**: 
  - Components: PascalCase.tsx
  - Hooks: kebab-case.ts
  - Utilities: kebab-case.ts
  - Tests: kebab-case.test.ts or kebab-case.spec.ts

### Error Handling
- **Async operations**: Use try/catch with meaningful error messages
- **Validation**: Validate inputs early with clear error conditions
- **User feedback**: Use toast/error boundaries for user-facing errors
- **Logging**: Console errors only in development; avoid in production
- **Boundary components**: Use `ErrorBoundary` component for graceful degradation

### React Specific
- **Component structure**: 
  - Export default for pages
  - Named exports for reusable components
- **Props**: 
  - Destructure in function signature
  - Use explicit PropTypes or TypeScript interfaces
  - Default props when appropriate
- **State**: 
  - Prefer Zustand for global state
  - Use useState/local state for component-specific state
  - Avoid deep nesting in state objects
- **Effects**: 
  - Clean up subscriptions/timers
  - Specify dependency arrays explicitly
  - Avoid useEffect for data fetching (store handles this)

### shadcn/ui Specific
- **Usage**: Import from `@/components/ui/*`
- **Customization**: Modify via `index.css` CSS variables
- **Extension**: Create wrapper components when needed (don't modify ui/* directly)
- **Consistency**: Use existing variants and sizes from the library

### Zustand Store Patterns
- **Structure**: Separate slices for different domains (auth, visits, sites, etc.)
- **Immutability**: Treat state as immutable despite using mutate
- **Selectors**: Create specific selectors in store.ts for derived data
- **Actions**: Keep actions small and focused
- **Persistence**: Not implemented (client-side only)

## Gotchas
- **Dual lockfiles**: Both `bun.lock`/`bun.lockb` and `package-lock.json` exist. Use `npm` to stay consistent with `package-lock.json`.
- **`App.css` is dead code**: Legacy Vite template CSS, not imported by `main.tsx`. Do not use it.
- **No persistence**: All mutations are in-memory. Tests or demos that add/remove data will reset on refresh.
- **`@tanstack/react-query` is mounted but unused**: Don't assume data flows through queries.
- **`next-themes` is a dependency but dark mode toggle is not wired up**: Dark mode CSS vars exist but there's no runtime toggle.
- **Two toast systems**: `sonner` (most pages) and shadcn `use-toast` (WorkerDetailDrawer) - both mounted in App.tsx
- **React Query**: Configured but not used for data fetching (store handles state)

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds