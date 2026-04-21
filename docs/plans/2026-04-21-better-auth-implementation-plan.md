# Implementation Plan: Better Auth + Drizzle Persistence
**Date:** 2026-04-21  
**Design Reference:** `2026-04-21-better-auth-persistence-design.md`

## Execution Strategy
Implement in **vertical slices** — each slice is end-to-end testable (DB → API → Frontend). Deploy after each slice completes.

---

## Phase 1: Foundation & Package Setup

### Slice 1.1: Install Dependencies
**Goal:** Add all required packages to `package.json`

**Changes:**
- Add `better-auth@latest` — auth framework
- Add `drizzle-orm@latest` — ORM
- Add `drizzle-kit@latest` — (dev) migrations CLI
- Add `pg@latest` — PostgreSQL driver
- Add `@neondatabase/serverless@latest` — Neon serverless client
- Add `sonner@latest` — (already present, keep for toasts)
- Verify `@tanstack/react-query@^5.83` — already present

**No changes to:**
- Frontend deps (React, Vite, Tailwind, shadcn/ui)
- ESLint, TypeScript, Vitest

**Verification:**
- `npm install` completes without errors
- `npm run lint` passes
- `npm run build` succeeds

---

## Phase 2: Database Schema & Migrations

### Slice 2.1: Create Drizzle Schema File
**Goal:** Define all tables in Drizzle

**File:** `src/lib/db/schema.ts`

**Defines:**
- `users` — Better Auth table
- `accounts` — OAuth links
- `sessions` — Session records
- `userRoles` — role + metadata
- `workers` — worker-specific data
- `sites` — inspection sites
- `visits` — daily visits
- `inspections` — inspection records
- `photos` — inspection photos
- `invitations` — pending invites

**Key fields:**
- All timestamps: `createdAt`, `updatedAt` with `defaultNow()`
- Foreign keys with `onDelete: 'cascade'` for cleanup
- `isDemo` boolean on workers (default `false`)
- Indexes on frequently-queried fields (email, workerId, siteId, etc.)

**Verification:**
- Schema file has no TypeScript errors
- All relations are properly typed

### Slice 2.2: Generate & Run Migrations
**Goal:** Create database and tables on Neon

**Steps:**
1. Create `drizzle.config.ts` pointing to `src/lib/db/schema.ts`
2. Run `drizzle-kit generate:pg` — generates migration SQL
3. Run `drizzle-kit migrate:pg` — applies to Neon (uses `DATABASE_URL` from `.env.local`)

**Verification:**
- Login to Neon dashboard, verify tables exist
- Check table schemas match definitions in `schema.ts`
- Test connection: `psql $DATABASE_URL -c "SELECT count(*) FROM "user";"`

### Slice 2.3: Create Seed Migration
**Goal:** Populate demo users in database

**File:** `src/lib/db/seed.ts`

**Populates:**
1. 3 demo users in `users` table (with Better Auth password hashing)
2. 3 user_roles (admin + 2 workers)
3. 3 workers in `workers` table with `isDemo: true`
4. 10 demo sites (from current mock-data.ts)
5. ~28 days of demo visits with inspections + photos

**Script:** Add `npm run seed` to package.json, runs seed.ts

**Verification:**
- Run `npm run seed` completes without errors
- Query Neon: `SELECT email FROM "user" LIMIT 5;` → see demo emails
- Query Neon: `SELECT * FROM "worker" WHERE isDemo = true;` → see 2 workers

---

## Phase 3: Backend Auth & API Setup

### Slice 3.1: Configure Better Auth
**Goal:** Set up Better Auth with email + Google OAuth

**File:** `src/lib/auth.ts` (shared config for API routes)

**Config:**
- Database adapter: Drizzle + Neon
- Providers: email/password + Google
- Session strategy: database
- Redirect URLs: `http://localhost:8080/auth/callback` (dev), `https://<vercel-domain>/auth/callback` (prod)

**Uses env vars:**
- `DATABASE_URL` — Neon connection
- `BETTER_AUTH_SECRET` — already in `.env.local`
- `BETTER_AUTH_URL` — already in `.env.local`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — already in `.env.local`

**Verification:**
- `npm run build` completes without errors
- No TypeScript errors in `src/lib/auth.ts`

### Slice 3.2: Create Auth Middleware
**Goal:** Reusable auth check for API routes

**File:** `src/lib/api/middleware.ts`

**Exports:**
- `requireAuth(request)` — validates session from cookie, returns user or 401
- `requireRole(request, roles[])` — checks user role, returns 403 if mismatch

**Used by:** All protected API endpoints

**Verification:**
- TypeScript compilation succeeds

### Slice 3.3: Create Auth Routes (Better Auth Handler)
**Goal:** Auto-generated endpoints for login/signup/OAuth

**File:** `api/auth/[...routes].ts` (Vercel Functions)

**Provided by Better Auth:**
- `POST /api/auth/sign-in` — email + password login
- `POST /api/auth/sign-up` — new user signup (invite-only, enforced in Slice 4.2)
- `POST /api/auth/sign-out` — logout
- `GET /api/auth/callback` — Google OAuth callback
- `GET /api/auth/session` — get current session

**Verification:**
- Run `npm run build` → Vercel Functions compile
- Locally: `npm run dev`, visit `http://localhost:8080/api/auth/session` → returns `{ user: null }` initially

### Slice 3.4: Create User Info Endpoint
**Goal:** Get authenticated user + worker/admin data

**File:** `api/users/me.ts`

**Endpoint:** `GET /api/users/me`

**Logic:**
1. Call `requireAuth(request)` — get user or return 401
2. Query `user_roles` for user's role + metadata
3. If worker, JOIN to `workers` table for job title, kmTarget, etc.
4. Return full user profile (merge user + role + worker data)

**Response (example):**
```json
{
  "id": "user_123",
  "email": "marcus@kinetic.enterprise",
  "name": "Marcus Kane",
  "avatar": "...",
  "role": "worker",
  "title": "Field Inspector",
  "dailyKmTarget": 120,
  "active": true,
  "isDemo": true
}
```

**Verification:**
- Demo login → fetch `/api/users/me` → returns user object

---

## Phase 4: Data API Routes (CRUD)

### Slice 4.1: Create Workers API
**Goal:** GET/POST/PATCH/DELETE workers

**Files:**
- `api/workers/index.ts` — GET all, POST new
- `api/workers/[id].ts` — GET, PATCH, DELETE

**Endpoints:**
- `GET /api/workers` — list (admin only)
- `POST /api/workers` — create (admin only)
- `GET /api/workers/{id}` — get (admin or self)
- `PATCH /api/workers/{id}` — update (admin or self)
- `DELETE /api/workers/{id}` — delete (admin only)

**Auth:** All require `requireAuth()` + role check

**Verification:**
- Admin login → GET `/api/workers` → returns list
- Worker login → GET `/api/workers/<self-id>` → succeeds
- Worker login → GET `/api/workers/<other-id>` → 403

### Slice 4.2: Create Sites API
**Goal:** GET/POST/PATCH/DELETE sites

**Files:**
- `api/sites/index.ts` — GET all, POST new
- `api/sites/[id].ts` — GET, PATCH, DELETE

**Endpoints:**
- `GET /api/sites` — list (auth required)
- `POST /api/sites` — create (admin only)
- `GET /api/sites/{id}` — get (auth required)
- `PATCH /api/sites/{id}` — update (admin only)
- `DELETE /api/sites/{id}` — delete (admin only)

**Verification:**
- Any authenticated user → GET `/api/sites` → returns list
- Admin → POST `/api/sites` → succeeds
- Worker → POST `/api/sites` → 403

### Slice 4.3: Create Visits API
**Goal:** GET/POST/PATCH/DELETE visits with nested inspections + photos

**Files:**
- `api/visits/index.ts` — GET all (filtered), POST new
- `api/visits/[id].ts` — GET, PATCH, DELETE

**Endpoints:**
- `GET /api/visits` — list (auth required, workers see own visits)
- `POST /api/visits` — create with inspection + photos (auth required)
- `GET /api/visits/{id}` — get with inspection + photos (auth required)
- `PATCH /api/visits/{id}` — update visit (auth required)
- `DELETE /api/visits/{id}` — delete (auth required)

**POST /api/visits logic:**
1. Parse request body: { workerId, siteId, date, km, inspectionType, notes, photos[] }
2. Validate user is creating for themselves or admin is creating for others
3. Insert into `visits`, `inspections`, `photos`
4. Return created visit with relations

**Verification:**
- Worker login → POST `/api/visits` (own) → succeeds
- Worker login → POST `/api/visits` (other worker) → 403
- Admin login → POST `/api/visits` (any worker) → succeeds
- GET `/api/visits/{id}` → includes nested inspection + photos

### Slice 4.4: Create Invitation API
**Goal:** Admin can invite new users

**Files:**
- `api/admin/invitations/index.ts` — GET list, POST create
- `api/admin/invitations/[id].ts` — PATCH accept/reject

**Endpoints:**
- `GET /api/admin/invitations` — list pending (admin only)
- `POST /api/admin/invitations` — create (admin only)
  - Body: `{ email, role }`
  - Returns: invitation record with `expiresAt` (7 days)
- `PATCH /api/admin/invitations/{id}` — accept (any user with matching email)
  - Creates user + user_roles entry
  - Links to invitation record
  - Sets `invitation.usedAt`

**Verification:**
- Admin → POST create invitation → invitation record in DB
- New user email matches → signup uses that role automatically

---

## Phase 5: Frontend Integration

### Slice 5.1: Replace Auth in Login Page
**Goal:** Integrate Better Auth into login form

**Changes to `src/pages/Login.tsx`:**
1. Remove `validateCredentials()` no-op function
2. Replace `submit()` handler:
   - Instead of `loginAs()`, call `POST /api/auth/sign-in`
   - On success: redirect to `/worker` or `/admin`
   - On error: display error message
3. Keep demo user quick-login buttons → they fill email + password, then submit

**Verification:**
- Click "Admin" button → logs in as admin
- Click "Worker" button → logs in as worker
- Invalid email → shows error
- Wrong password → shows error

### Slice 5.2: Add Session Restoration
**Goal:** Restore user on app startup

**Changes to `src/App.tsx`:**
1. Add `useEffect` on mount: fetch `GET /api/users/me`
2. If response valid, update Zustand store with user
3. If 401, user stays null (unauthenticated)

**File:** `src/hooks/useSession.ts` (custom hook)

```typescript
export function useSession() {
  const [loading, setLoading] = useState(true);
  const setUser = useApp(s => s.setUser); // add to store

  useEffect(() => {
    fetch('/api/users/me')
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { loading };
}
```

**Verification:**
- Refresh page → session is preserved
- Clear cookies → redirects to login
- Valid session → shows user info in AppShell

### Slice 5.3: Replace Data Mutations with API Calls
**Goal:** Replace Zustand mutations with React Query API calls

**Changes:**
- Add React Query mutations for: `addWorker`, `removeWorker`, `updateWorker`, `addSite`, `removeSite`, `updateSite`, `addVisit`, `removeVisit`, `updateVisit`
- Keep Zustand for: UI state (modals, filters, sorting)
- Fetch fresh data after mutations via query invalidation

**Files:**
- `src/hooks/useWorkers.ts` — `useQuery` + `useMutation`
- `src/hooks/useSites.ts` — `useQuery` + `useMutation`
- `src/hooks/useVisits.ts` — `useQuery` + `useMutation`

**Example:**
```typescript
export function useAddWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (worker) => fetch('/api/workers', { method: 'POST', body: JSON.stringify(worker) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workers'] }),
  });
}
```

**Verification:**
- Admin Workforce page → "Add Worker" → form submission hits API
- Worker VisitHistory → "Delete Visit" → API call succeeds, UI updates

### Slice 5.4: Replace Zustand State with Server State
**Goal:** Remove mock data initialization, fetch from API

**Changes to `src/lib/store.ts`:**
1. Remove: `workers: seedWorkers`, `sites: seedSites`, `visits: seedVisits`
2. Add: `user` state only
3. Remove: `loginAs()`, `logout()` (now done via API)
4. Remove: all CRUD actions (now done via React Query)
5. Keep: UI state (modals, filters, KPI targets, form state)

**Verification:**
- Page loads → no data until API calls complete
- Loading states show spinners / skeletons

### Slice 5.5: Update Protected Routes
**Goal:** Ensure Protected component checks real session

**Changes to `src/components/Protected.tsx`:**
1. Call `useSession()` hook
2. While loading, show `PageSkeleton`
3. When loaded:
   - If no user, redirect to `/login`
   - If user role doesn't match, redirect appropriately

**Verification:**
- Unauthenticated → visit `/admin` → redirects to `/login`
- Authenticated worker → visit `/admin` → redirects to `/worker`
- Authenticated admin → visit `/admin` → shows page

---

## Phase 6: Demo User & Seeding

### Slice 6.1: Ensure Demo Users Seeded
**Goal:** Verify demo users exist after migration

**Done in:** Phase 2, Slice 2.3 (seed script)

**Verification:**
- Run `npm run seed`
- Query Neon: `SELECT email FROM "user" WHERE email LIKE '%@kinetic.enterprise%';` → 3 rows

### Slice 6.2: Preserve Demo User Visibility on Login
**Goal:** Demo quick-login buttons remain on Login page

**Changes:** None required (already designed in Slice 5.1)

**Verification:**
- Login page shows 3 demo buttons
- Clicking each logs in successfully
- Session persists across navigation

---

## Phase 7: Invitation System

### Slice 7.1: Create Invite Modal in Workforce Page
**Goal:** Admin can invite new users from UI

**Changes to `src/pages/admin/Workforce.tsx`:**
1. Add "Invite User" button
2. Opens dialog: email input + role dropdown
3. On submit: `POST /api/admin/invitations`
4. On success: show copy-able link or confirmation
5. Invitation expires in 7 days

**Verification:**
- Admin clicks "Invite User"
- Enters `newuser@example.com` + role "worker"
- API returns invitation record
- Share link with external user
- New user visits link → sees signup form pre-filled with email

### Slice 7.2: Create Signup/Accept Page
**Goal:** Invited users complete signup

**File:** `src/pages/Signup.tsx`

**Flow:**
1. User visits `/signup?inviteId=<id>`
2. Frontend fetches invitation details (email, role)
3. Shows signup form with email pre-filled
4. On submit: `POST /api/auth/sign-up` with password + Google option
5. Better Auth creates user + links to invitation
6. Redirect to dashboard

**Verification:**
- Admin invites `test@example.com`
- Visit invite link → shows signup form with email pre-filled
- Complete signup → account created with correct role
- Login with new credentials → works

---

## Phase 8: Testing & Verification

### Slice 8.1: Verify All Auth Flows
**Checklist:**
- [ ] Demo admin login works
- [ ] Demo worker login works
- [ ] Invalid email rejected
- [ ] Wrong password rejected
- [ ] Session persists on refresh
- [ ] Logout clears session
- [ ] Google OAuth flow works
- [ ] Unauthenticated redirects to login
- [ ] Role-based access control enforces

### Slice 8.2: Verify All Data CRUD
**Checklist:**
- [ ] Admin can list workers
- [ ] Worker can view own visits
- [ ] Worker cannot view other workers
- [ ] Admin can create/edit/delete sites
- [ ] Worker cannot modify sites
- [ ] Visits persist with inspections + photos
- [ ] Deleting visit cascades to inspections/photos

### Slice 8.3: Verify Invitation Flow
**Checklist:**
- [ ] Admin can create invitation
- [ ] Invited user receives link
- [ ] Signup with invitation auto-assigns role
- [ ] Invitation expires after 7 days
- [ ] Used invitations marked in database

### Slice 8.4: Production Readiness Checks
**Checklist:**
- [ ] `.env.local` secrets are NOT in git (check `.gitignore`)
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] No console errors in dev
- [ ] Error boundaries catch API failures gracefully
- [ ] Database migrations run on first Vercel deploy
- [ ] All env vars set in Vercel project settings

---

## Deployment Checkpoints

**After Phase 2:** Database schema deployed to Neon  
**After Phase 3:** Auth endpoints working locally  
**After Phase 4:** All CRUD APIs tested  
**After Phase 5:** Frontend fully integrated  
**After Phase 6:** Demo users visible, seed script runs  
**After Phase 7:** Invitation system end-to-end  
**After Phase 8:** Production deploy to Vercel  

---

## Rollback / Abort Strategy

If critical issue discovered:
1. Keep current branch, create `hotfix/*` branch
2. Revert last slice's changes
3. Fix and re-test
4. Re-deploy

Demo mode is preserved throughout — can always fall back to in-memory state if needed.

---

## Success Criteria (from Design)

✅ Users can log in with email/password  
✅ Users can log in with Google OAuth  
✅ Demo users remain accessible on login screen  
✅ Admin can invite new users via dashboard  
✅ New signups restricted to invited users  
✅ Multiple admins can be created via invite flow  
✅ All worker/site/visit data persists in database  
✅ Protected routes enforce role-based access  
✅ Sessions managed by Better Auth + database  
✅ Demo data visible on first login (seeds via migration)  
