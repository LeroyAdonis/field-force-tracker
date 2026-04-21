# Better Auth + Drizzle Persistence Design
**Date:** 2026-04-21  
**Status:** Approved

## Goal
Implement real authentication with Better Auth (email + Google OAuth) and persistent data layer using Drizzle ORM and Neon PostgreSQL. Keep demo users visible on login for testing/client viewing. Restrict new signups to admin-controlled invitations.

## Architecture: Monolithic with Vercel Functions

Single codebase deployed to Vercel with:
- `/api/*` — Vercel Functions for auth and data endpoints
- `/src/*` — Frontend React app
- Shared database schema in Drizzle
- Database sessions for auth state

## Database Schema

### Better Auth Tables (auto-generated)
- `user` — core identity (email, name)
- `account` — OAuth provider links (Google, etc.)
- `session` — active user sessions

### Domain Tables (aligned with existing types)

**user_roles**
- `id` — primary key
- `userId` — FK to user
- `role` — 'admin' | 'worker'
- `displayName` — user's display name
- `avatar` — avatar URL
- `createdAt` — timestamp

**workers** (extends user_roles)
- `id` — primary key
- `userRoleId` — FK to user_roles
- `jobTitle` — e.g., "Lead Inspector"
- `dailyKmTarget` — configurable per worker
- `active` — boolean
- `isDemo` — boolean (marks temporary test users)

**sites**
- `id` — primary key
- `name` — site name
- `address` — full address
- `zone` — zone identifier
- `active` — boolean

**visits**
- `id` — primary key
- `workerId` — FK to workers
- `siteId` — FK to sites
- `date` — ISO date (YYYY-MM-DD)
- `timestamp` — ISO datetime
- `km` — kilometers traveled
- `createdAt` — timestamp

**inspections**
- `id` — primary key
- `visitId` — FK to visits
- `type` — inspection type (e.g., "Structural Audit")
- `notes` — inspection notes
- `timestamp` — ISO datetime

**photos**
- `id` — primary key
- `inspectionId` — FK to inspections
- `dataUrl` — base64 image data or URL
- `caption` — optional photo caption

**invitations**
- `id` — primary key
- `email` — invitee email
- `role` — intended role for invitee
- `createdBy` — FK to user_roles (admin who created)
- `expiresAt` — invitation expiry timestamp
- `usedAt` — timestamp when accepted (null if pending)

## API Routes

### Auth Routes
- `/api/auth/[...routes]` — Better Auth handler (auto-generates sign-in, sign-up, sign-out, Google callback)

### User Routes
- `GET /api/users/me` — Get current authenticated user (returns user + user_roles + worker data if applicable)

### Worker Routes
- `GET /api/workers` — List all workers (admin only)
- `GET /api/workers/{id}` — Get worker details (admin or self)
- `POST /api/workers` — Create new worker via invitation (auth required)
- `PATCH /api/workers/{id}` — Update worker (admin or self)
- `DELETE /api/workers/{id}` — Remove worker (admin only)

### Site Routes
- `GET /api/sites` — List all sites (auth required)
- `GET /api/sites/{id}` — Get site details (auth required)
- `POST /api/sites` — Create site (admin only)
- `PATCH /api/sites/{id}` — Update site (admin only)
- `DELETE /api/sites/{id}` — Remove site (admin only)

### Visit Routes
- `GET /api/visits` — List visits filtered by worker (auth required)
- `GET /api/visits/{id}` — Get visit + inspection details (auth required)
- `POST /api/visits` — Create visit + inspection + photos (auth required)
- `PATCH /api/visits/{id}` — Update visit (auth required)
- `DELETE /api/visits/{id}` — Remove visit (auth required)

### Admin Routes
- `POST /api/admin/invitations` — Create invitation (admin only)
- `GET /api/admin/invitations` — List pending invitations (admin only)
- `PATCH /api/admin/invitations/{id}` — Accept/reject invitation (any user with matching email)

## Frontend Integration

### Auth Flow
1. **Login page stays visual the same:**
   - Email + password inputs
   - Demo user quick-login buttons (Eleanor, Marcus, Sarah)
   - "Forgot password" dialog (real email link)

2. **Demo user interaction:**
   - User clicks "Admin" button → auto-fills email: `admin@kinetic.enterprise`, password: `demo`
   - User clicks "Worker" button → fills email, password and logs in
   - All logins go through real Better Auth (`POST /api/auth/sign-in`)

3. **Protected routes:**
   - On mount, fetch `GET /api/users/me`
   - If authenticated, render AppShell + page
   - If not authenticated, redirect to login
   - If role mismatch, redirect to correct dashboard

4. **Data operations:**
   - Replace Zustand mutations with API calls
   - Example: `addVisit()` → `POST /api/visits` with form data
   - Use React Query to manage server state
   - Keep Zustand for ephemeral UI state only (filters, modals, etc.)

### Store Changes
- Remove: `loginAs()`, `logout()` (now via API)
- Remove: mock data initialization (seed via DB migrations)
- Keep: UI state (modals, filters, sorting, forms)
- Add: React Query hooks for server state (workers, sites, visits)

## Demo User Strategy

### Initial Seeding
On first Drizzle migration:
1. Create 3 demo users with deterministic IDs:
   - `admin@kinetic.enterprise` / password: `demo` → admin role
   - `marcus@kinetic.enterprise` / password: `demo` → worker (Marcus Kane)
   - `sarah@kinetic.enterprise` / password: `demo` → worker (Sarah Miller)

2. Set `isDemo: true` on all demo workers
3. Populate with demo sites and visits from current mock data

### Demo Visibility
- Demo users remain in database
- Login page shows quick-login buttons for demo accounts
- Admin can manually deactivate demo workers if desired
- No automatic cleanup

## Invitation Flow (Admin Dashboard)

1. Admin navigates to Workforce page
2. Clicks "Invite New User" button
3. Enters email + selects role (admin/worker)
4. System generates invitation record with 7-day expiry
5. Admin copies link or email is sent (TBD email provider)
6. Invitee clicks link → arrives at signup page pre-filled with email
7. Invitee signs up with Google or email/password
8. Account is auto-linked to invitation on email match
9. User gains their assigned role immediately

## Error Handling & Validation

**Auth errors:**
- Invalid email format → form-level validation
- Email not invited → "No account found or pending invitation"
- Wrong password → "Invalid credentials"
- Session expired → redirect to login

**Data errors:**
- Unauthorized access → 403 Forbidden
- Resource not found → 404
- Validation errors → 400 with field-level messages

**Network errors:**
- Handled by React Query retry logic
- Toast notifications for user feedback

## Testing Strategy

**Demo users:**
- Eleanor (admin) for admin workflows
- Marcus (worker) for worker workflows
- Sarah (worker, at-risk scenario) for risk workflows

**Real signup:**
- Admin can invite new test email via dashboard
- Invitation workflow tested with Google and email signup

**Role-based access:**
- Verify Protected routes redirect correctly
- Verify API endpoints reject unauthorized roles

## Security Considerations

- Better Auth handles password hashing and session management
- All data endpoints require valid session
- Role checks enforced on server (never trust client role)
- Google OAuth uses PKCE flow (Better Auth default)
- Database connections over SSL (Neon requirement)
- Environment variables for secrets (BETTER_AUTH_SECRET, DATABASE_URL)

## Success Criteria

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
