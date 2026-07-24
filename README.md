# APTSpace

APTSpace is a web-based housing and accommodation management system for Asia Pacific Theological Seminary (APTS).

**New to the project and need to run the server?** → see **[RUN-SERVER.md](RUN-SERVER.md)** (step-by-step guide for teammates).

## Quick start

```bash
npm run setup -- --install          # .env + dependencies
mysql -u root -p < client/database/schema.sql
npm run verify
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) · **Run guide:** [RUN-SERVER.md](RUN-SERVER.md)

**Admin:** `admin@aptspace.com` / `password` · **Verify:** `npm run verify`

## Local development

| Command | Env file | When |
|---------|----------|------|
| `npm run setup -- --install` | creates `client/server/.env` | First-time setup |
| `npm run verify` | `client/server/.env` | Check local setup |
| `npm run dev` | `client/server/.env` | Daily coding |
| `npm run docker:up` | Docker | Optional full-stack practice on your PC (port 3000) |

**Production hosting:** deployed on **hosting.com** via **cPanel** (not managed from this README).

## Configuration

The app reads **`client/server/.env`** only. The root `.env.example` is a template for your team — copy it to `client/server/.env`.

Required variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

On startup the server will:
1. Test the MySQL connection (exit if it fails)
2. Seed default users if missing (`ENABLE_SEED=true` on first production boot)
3. Seed demo users/bookings only when `ENABLE_DEMO_DATA=true` (off by default in production)

## Project structure

```txt
APSTPACE/
├── .env.example              ← team template (copy to client/server/.env)
├── package.json              ← root scripts (npm run dev, npm run setup)
├── scripts/
│   ├── setup.mjs             ← first-time env copy + next-step hints
│   ├── verify-local.mjs      ← local setup checks
│   └── run-server.mjs        ← production server launcher
└── client/
    ├── database/schema.sql
    ├── public/               ← static assets only (marketing + shared files)
    │   ├── index.html
    │   ├── components/       ← sidebar, header, modals (loaded by fetch)
    │   └── assets/
    │       ├── css/global|components|features/
    │       └── js/config|layout|services|features/
    │           └── config/guest-access.js  ← shared client/server guest rules
    └── server/
        ├── views/            ← app pages (served at same URLs as before)
        │   ├── auth/login.html
        │   ├── admin/*.html
        │   └── guest/*.html
        └── src/              ← Express API + page routes
```

**URLs are unchanged:** `/login.html`, `/admin/dashboard.html`, `/guest/reservations.html`, etc.  
App HTML lives in `client/server/views/`; CSS/JS live under `client/public/assets/`.

## API reference

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/health` | DB connectivity check |
| POST | `/api/auth/login` | Returns JWT + user |
| GET | `/api/auth/me` | Current user profile |
| PATCH | `/api/auth/me` | Update name and email notification preferences |
| PATCH | `/api/auth/me/password` | Change password (logged in) |
| POST | `/api/auth/forgot-password` | Sends reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/stats/summary` | Admin dashboard KPIs |
| GET | `/api/notifications` | In-app notification feed (admin + guest) |
| GET/PATCH | `/api/settings/fiscal-year` | Fiscal year config |
| GET/POST/PATCH/DELETE | `/api/bookings` | Room reservations |
| POST | `/api/bookings/stay-quote` | Itemized stay total (nights, meals, extras) |
| GET/POST/PATCH/DELETE | `/api/groups` | Group reservations |
| GET/POST/PATCH/DELETE | `/api/facility-bookings` | Venue bookings |
| GET/POST/PATCH/DELETE | `/api/rooms` | Room inventory |
| GET | `/api/rooms/overview` | Admin room board |
| GET/POST/PATCH/DELETE | `/api/facilities` | Meals, extras, venues catalog |
| GET/POST/PATCH | `/api/payments` | Payment records (office settlement — Cash / GCash / Bank Transfer) |
| GET/POST | `/api/recycle/*` | Soft-delete recycle bin (reservations + paid invoices) |
| GET/POST | `/api/users/guest-access/*` | External guest access workflow (Super Admin) |

Bookings auto-calculate price, season, and check room availability. Soft-deleted bookings return **404** on GET-by-id (list endpoints already exclude them).

## Project status

Core product modules are in place: room and group bookings, guest portal, auth and email flows, admin UX (dashboard, reservations, venues, billing, calendar, View-Only Admin, recycle bin), facilities/venues catalog, and office settlement payments (Cash / GCash / Bank Transfer — no online payment gateway by design).

**Recently shipped:** View-Only Admin role + read-only UI/API guards; soft-delete recycle bin for reservations and invoices; booking GET-by-id excludes recycled rows; Jul 2026 bug-fix pass (duplicate reservations, per-day meals, stay-quote, Prayer Mountain package, guest stay summary); domain seed migrations under `client/server/src/seed/migrations/`; guest browse redesign; in-app notifications; admin venue modify via wizard.

**Production:** hosted on **hosting.com** with **cPanel**.

## Automated tests

```bash
npm run install:server   # once — installs supertest
npm test                 # unit + integration (integration needs MySQL + .env)
npm run test:unit        # no database
npm run test:integration # needs MySQL + seeded .env
```

GitHub Actions (`.github/workflows/ci.yml`) runs unit tests, then integration tests against MySQL 8 on every push/PR to `main`.

Integration tests use `client/server/.env` and seeded users (`admin@aptspace.com`, `maria.santos@apts.edu.ph`, `viewer@aptspace.com` / `password`). They are skipped automatically when MySQL is unavailable.

**Covered:** auth, booking overlap, booking/user permissions, reservation flows (incl. soft-delete → 404), View-Only Admin, page smoke.

**Not covered yet:** full booking create/update CRUD assertions, guest-access end-to-end workflow, guest self-modify email delivery.

## Automated emails

Templates live in `client/server/src/services/email.service.js`. In development without SMTP, bodies are logged to the console (`[email dev]`).

Reservation-related emails (approvals, declines, modifications, invoices, receipts) always send to the guest's email on file.

| Email | When |
|-------|------|
| Guest access invite | Admin creates external guest account |
| Password reset | Forgot-password flow |
| Room / group confirmation | Booking approved |
| Room / group / venue declined | Admin declines a pending request |
| Room / group modified (admin) | Admin modifies with message |
| Guest self-modify (room / group / venue) | Guest updates pending or re-requests approved booking |
| Venue booking request received | Guest submits a pending venue request |
| Housing / venue invoice | Booking approved or admin sends from Billing |
| Payment receipt | Admin records payment |
| Support message | Guest submits support form (to `SUPPORT_EMAIL`) |

Verify SMTP: `node client/server/scripts/validate-smtp.mjs --send-test`

## Security notes

| Area | Status | Notes |
|------|--------|-------|
| API auth | Good | JWT on protected routes; role checks on admin endpoints |
| SQL injection | Good | Parameterized queries throughout |
| Rate limiting | Partial | Login, forgot-password, reset-password (20 / 15 min) |
| Password hashing | Good | bcrypt cost 10 |
| Page access | Good | Admin/guest HTML requires httpOnly session cookie; APIs enforce permissions |
| CORS | Configured | Set `ALLOWED_ORIGIN` in production |
| Secrets | Validated | Weak `JWT_SECRET` blocked at startup in production |
| Demo data | Guarded | Skipped when `NODE_ENV=production` |

**Implemented:** user IDOR guard, production seed guard, env validation, page auth middleware, single-session login, login lockout, httpOnly cookie for page routes, generic 500 errors in production.

**Still recommended:**
- Production SMTP (`SMTP_*` in `.env`) — password reset and booking emails will not deliver without it
- Use host env vars or a secrets manager (not committed `.env`)
- Expand automated tests (booking CRUD, guest-access, guest-modify emails)
- Move API JWT fully off `localStorage` (httpOnly cookie exists for pages only)
- Tighten CSP once Tailwind is built locally (remove CDN `unsafe-eval`)
