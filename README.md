# Remittance Management System

A production-grade remittance/money-transfer back office: ledger-first balance
tracking, customer and transaction records, receipts, reports, and an
append-only audit trail. Next.js (App Router) + PostgreSQL on Neon + Prisma +
Auth.js.

> **Status:** in progress. This README is updated as each module lands —
> see the project plan for the full build order.

## Tech stack

- Next.js 16 (App Router, Server Actions + Route Handlers — no separate API service)
- PostgreSQL on [Neon](https://neon.tech), accessed via Prisma 7 + `@prisma/adapter-neon`
- Auth.js (NextAuth v5) with the Prisma adapter, Credentials provider
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- Recharts, `@react-pdf/renderer`, `qrcode` + `jsbarcode`, Cloudflare R2 (S3-compatible)

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres project (free tier is fine)
- A Cloudflare R2 bucket (for logo/receipt/report file storage — needed from the Settings/Receipts steps onward)

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values, see below
```

### Environment variables

See [.env.example](.env.example) for the full list. Key ones:

- `DATABASE_URL` — Neon's **pooled** connection string (the `-pooler` host). Used by the app at runtime.
- `DIRECT_URL` — Neon's **direct/unpooled** connection string. Used only by Prisma Migrate/Studio (pooled connections don't support the advisory locks Migrate needs).
- `AUTH_SECRET` — generate with `npx auth secret` or `openssl rand -base64 32`.
- `R2_*` — Cloudflare R2 credentials (account id, access key, secret, bucket, endpoint, public URL).

### Database migrations

Schema and hand-written SQL (triggers/functions for the ledger, audit log,
transaction numbering, and idempotency) live in `prisma/migrations/`. Apply
them against Neon with:

```bash
npx prisma migrate deploy
```

`prisma/schema.prisma` documents the append-only ledger design and the
`get_current_balance()` function; see the comments at the top of
`prisma/migrations/20260906120100_ledger_and_audit_triggers/migration.sql`
for the full rationale.

### First admin login

Auth is single-role (admin) in v1. Create the first login:

```bash
npm run create-admin
# or override the defaults:
ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='a-strong-password' npm run create-admin
```

### Run the app

```bash
npm run dev
```

## Architecture notes

- **Ledger-first balance.** `income_transactions` / `sent_transactions` are
  records; `ledger_entries` is a separate, DB-enforced append-only table.
  A Postgres trigger posts exactly one ledger row when (and only when) a
  transaction's status transitions to `completed`. Current balance is read
  via the `get_current_balance()` SQL function — O(1), never a re-sum.
- **Audit logging is a DB trigger**, not app code, on `customers`,
  `income_transactions`, `sent_transactions`, and `settings` — so it can't be
  bypassed by a bug in a Server Action. `login`/`logout`/`print`/`export`
  aren't row mutations, so those are written directly by the repository layer.
- **Repository layer** (`src/lib/repositories/*.ts`) is the only thing that
  talks to Prisma — no scattered DB calls in components or route handlers.
  This is where a future Cashier role's permission checks get added.
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`.** `src/proxy.ts` is the
  first line of defense for protected routes; every Server Action also
  independently checks the session (`src/lib/auth-helpers.ts`) per Next's own
  guidance that a matcher change can silently remove proxy coverage.

## Deployment (Vercel + Neon)

1. Create a Neon project; copy its pooled and direct connection strings into
   Vercel's environment variables (`DATABASE_URL`, `DIRECT_URL`).
2. Set `AUTH_SECRET`, `NEXTAUTH_URL` (your production URL), and the `R2_*` variables in Vercel.
3. Run `npx prisma migrate deploy` against the Neon database (from CI or locally with the production `DIRECT_URL`) before or as part of your first deploy.
4. Deploy — `npm run build` runs `prisma generate` via the `postinstall` script, so no extra Vercel build-command changes are needed.
5. Run `npm run create-admin` once (locally, pointed at the production `DATABASE_URL`) to create the first login.
