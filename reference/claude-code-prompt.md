# Build: Remittance Management System

You are a senior full-stack engineer. Build a production-grade Remittance Management System that replaces Excel spreadsheets for a money transfer business — automatic balance calculation, transaction recording, and reporting.

## Tech Stack (fixed — do not substitute)

- **Framework:** Next.js 14+ (App Router), TypeScript, all-in-one (Server Actions + Route Handlers, no separate backend service)
- **Database:** PostgreSQL, hosted on **Neon**
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth) with the Prisma adapter, credentials provider
- **UI:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Validation:** Zod + react-hook-form (shared schemas between client forms and server actions)
- **File storage:** Cloudflare R2 (S3-compatible) — company logo, generated receipt PDFs, report exports
- **PDF generation:** `@react-pdf/renderer`
- **QR / barcode:** `qrcode` + `jsbarcode`
- **Deployment target:** Vercel

Do not use Supabase or any other BaaS. Do not add a separate Express/Node API service.

## Scope: v1 is single-role (Admin only)

Every user has full access. Build the data model and authorization layer so a `role` field and repository-level permission checks can be extended to a Cashier role later, but do not build cashier-specific UI or restrictions now.

## Core architectural requirements

### 1. Ledger-first balance, not a subtraction of two tables
- `income_transactions` and `sent_transactions` are the transaction records.
- A separate **`ledger_entries`** table is **append-only** (no UPDATE or DELETE allowed at the DB level — enforce with a trigger or REVOKE, not just app logic). Every completed transaction writes exactly one ledger row via a Postgres trigger, storing `balance_after` computed from the prior ledger row.
- Current balance is read via a SQL function `get_current_balance()` that reads the latest `ledger_entries.balance_after` — O(1), never a full re-sum of transactions.
- A transaction only affects the ledger when its status transitions to `completed`. Pending/cancelled transactions never post to the ledger.

### 2. Exchange rate snapshotting
- `exchange_rates` is a reference table for defaulting form values only.
- Every `sent_transactions` row stores its own `exchange_rate` at time of creation. Never join to the live rates table to compute historical totals.

### 3. Audit logging via DB triggers, not app code
- A generic trigger function writes to `audit_logs` (user, action, table, record id, old/new JSON diff, IP address, timestamp) on INSERT/UPDATE/DELETE of all sensitive tables (customers, income_transactions, sent_transactions, settings).
- This must not be bypassable by a bug in a Server Action — it happens at the database level.
- IP address must be captured server-side (from request headers in the Server Action/Route Handler) and passed explicitly into the RPC/trigger context — never trust a client-supplied IP.

### 4. Concurrency & idempotency
- Transaction creation (income or sent) must happen as a single DB transaction that inserts the record and its ledger entry atomically, using row-level locking or `SERIALIZABLE` isolation to prevent race conditions from concurrent submits or double-clicks.
- Add an idempotency key (client-generated UUID) on transaction creation to reject duplicate submissions.

### 5. Repository pattern
- All DB access goes through a repository layer (e.g. `lib/repositories/*.ts`), not scattered Prisma calls in components or route handlers. This is where future role-based restrictions get added.

## Database schema

Tables: `users` (Auth.js), `profiles`, `customers`, `income_transactions`, `sent_transactions`, `currencies`, `exchange_rates`, `ledger_entries`, `audit_logs`, `settings`.

Field details:

**customers:** full_name, phone, email, national_id, country, city, address, notes, created_by, created_at, updated_at

**income_transactions:** transaction_number (auto, `INC-000123`), date, customer_id, amount, currency, payment_method, reference_number, notes, status (`pending`|`completed`|`cancelled`), created_by, updated_by, ip_address, created_at, updated_at

**sent_transactions:** transaction_number (`SNT-000123`), date, recipient_name, recipient_phone, country, city, amount, currency, transfer_fee, exchange_rate, total_paid, payment_method, status, notes, processed_by, updated_by, ip_address, created_at, updated_at

**ledger_entries:** entry_type (`income`|`sent`), reference_table, reference_id, amount, direction (`credit`|`debit`), balance_after, created_at — append-only

**audit_logs:** user_id, action (`login`|`logout`|`create`|`edit`|`delete`|`print`|`export`), table_name, record_id, old_data (jsonb), new_data (jsonb), ip_address, created_at

**settings:** company_name, logo_url, default_currency, receipt_footer, business_address, phone_numbers, tax_settings (jsonb), updated_at

Write raw SQL for triggers/functions in a Prisma migration's custom SQL block, since Prisma doesn't manage these natively.

## Modules to build

1. **Auth** — login, session handling, protected route middleware
2. **Dashboard** — see design spec below
3. **Customers** — CRUD, search, transaction history per customer
4. **Income** — record incoming transfers, status workflow, list with search/filter/pagination/sort
5. **Sent Money** — record outgoing transfers, status workflow, list with search/filter/pagination/sort
6. **Reports** — Daily / Weekly / Monthly / Yearly / Customer / Income / Sent / Profit reports, filterable by date and customer, export to PDF/Excel/CSV, print view
7. **Receipts** — printable receipt per transaction: company logo, transaction ID, customer, recipient, amount, fee, total, cashier, QR code, barcode, print button, PDF download
8. **Audit Log** — searchable, read-only view of `audit_logs`
9. **Settings** — company info, logo upload, default currency, exchange rates, receipt footer, business address, tax settings

Search must cover: transaction ID, customer name, recipient name, phone number, reference number, date, amount, status.

Every action shows a success toast (e.g. "Income Recorded Successfully", "Transfer Sent Successfully", "Customer Added", "Report Exported").

## Design direction (dashboard)

Dark theme, professional finance dashboard. Follow this exact token system:

**Color:**
- Background (void): `#0A0E12`
- Sidebar panel: `#10151B`
- Card surface: `#141A21`
- Hairline border: `#1F2830`
- Text primary: `#EDF2F6`
- Text muted: `#7E8C98`
- Income (green): `#2FBF71`
- Sent (red): `#F0453A`
- Reports/balance (blue): `#3E8EF7`

**Type:** Headlines and big stat numbers in `Space Grotesk` (weight 600–700). Body/UI text in `IBM Plex Sans`.

**Layout:** Fixed left sidebar (grouped nav: Overview / Analytics / System sections, small uppercase group labels). Main content: greeting header with live-status pill and search bar, a grid of stat cards (Current Balance gets a wider/larger card as the hero metric), then a two-column row of Income-vs-Sent bar chart + Top Customers donut, then a second row of Monthly Trend line chart + Recent Transactions list. Rounded-2xl cards, no drop shadows — rely on the hairline border and dark elevation instead.

**Stat cards:** label on top (muted, small), large number below in Space Grotesk, a small delta indicator (▲/▼ + %), and a thin colored progress-style underline matching the metric's semantic color (green/red/blue).

Dashboard cards required: Current Balance, Today's Income, Today's Sent, Today's Profit, Monthly Income, Monthly Sent, Number of Transactions, Number of Customers. Charts required: Income vs Sent, Monthly Trend, Top Customers, Recent Transactions.

Support light mode as a secondary theme (invert surfaces, keep the same three semantic accent colors).

## Security requirements

- Every mutation validated with Zod on both client and server.
- Parameterized queries only (Prisma handles this — never raw string interpolation into SQL).
- Sensitive fields (national ID, phone) — plan for column-level encryption or at minimum restrict which queries can select them.
- CSRF protection via Auth.js defaults; secure, httpOnly session cookies.

## Deliverables, in this order

1. Prisma schema + migration files (tables, triggers, functions, indexes)
2. Auth.js setup + protected layout/middleware
3. Repository layer for each entity
4. Customers module (CRUD + search)
5. Income module
6. Sent Money module
7. Dashboard (cards + charts wired to real queries)
8. Reports module + exports
9. Receipt generation (PDF, QR, barcode, print)
10. Audit log viewer
11. Settings module
12. Seed script with realistic sample data (customers, transactions spanning several months, so charts have real trend data)
13. Unit tests for the ledger/balance logic and repository layer (this is the part that must not silently break)
14. README with setup, environment variables, migration, and deployment instructions for Vercel + Neon

Build in this order as separate, reviewable steps rather than generating everything at once — confirm the schema and ledger triggers are correct before building UI on top of them.
