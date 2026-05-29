# BarangayConnect

A full-stack community request and announcement system for Philippine barangays — with an admin web dashboard and a resident-facing mobile app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — used as JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Admin Web: React + Vite + shadcn/ui + Wouter + Recharts
- Mobile: Expo (React Native) + Expo Router

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/` — generated React Query hooks + Zod schemas (from codegen)
- `lib/db/src/schema.ts` — Drizzle ORM schema (users, requests, announcements, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware + RBAC
- `artifacts/admin-web/src/` — Admin dashboard (React)
- `artifacts/mobile/` — Resident mobile app (Expo)

## Architecture decisions

- JWT auth stored in localStorage (admin web) and AsyncStorage (mobile), key: `barangay_token`
- Admin web patches `window.fetch` globally in `src/lib/api.ts` to add Bearer token header
- Mobile uses `setAuthTokenGetter` from `@workspace/api-client-react` to supply JWT
- `SESSION_SECRET` env var is used as the JWT signing secret
- Admin web QueryClient has `retry: false` to avoid hanging on auth 401 errors

## Product

**Admin Web Dashboard** (`/`) — For barangay officials only:
- Login with role check (admin only)
- Dashboard with stats, charts, recent requests
- Request management: list, filter, approve/reject with remarks
- Announcement management: create, edit, delete
- User management: list, view, enable/disable accounts
- Profile settings

**Mobile App** (`/mobile/`) — For residents:
- Register / Login
- Home: quick stats + latest announcements
- Submit requests (5 types: Barangay Clearance, Certificate of Residency, Business Permit, Complaint, Community Concern)
- Track own requests with status badges
- Read announcements
- Notifications with unread badge
- Profile management

## Sample Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@barangay.ph | admin123 |
| Resident | juan@example.com | resident123 |
| Resident | ana@example.com | resident123 |
| Resident | carlos@example.com | resident123 |
| Resident | liza@example.com | resident123 |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Admin web QueryClient must have `retry: false` to avoid "Loading..." hang when auth token is missing
- Layout component must use `<Redirect>` from wouter (not `setLocation`) to avoid React render-time setState error
- bcryptjs is NOT available in the code_execution sandbox — use bash with node + api-server/node_modules path to hash passwords for seeding
- Mobile app uses `EXPO_PUBLIC_DOMAIN` env var (injected by workflow) for the base URL

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
