-- =============================================================================
-- Ledger, audit, transaction-numbering and idempotency infrastructure.
--
-- None of this is expressible in prisma/schema.prisma — Prisma only manages
-- tables/columns/indexes/FKs. Everything below is hand-written SQL, applied
-- as a second migration on top of 20260906120000_init.
--
-- Design summary (see claude-code-prompt.md for the full spec this implements):
--
--  1. LEDGER BALANCE
--     - ledger_entries is append-only: a BEFORE UPDATE/DELETE trigger rejects
--       any mutation outright, and UPDATE/DELETE are also REVOKEd from PUBLIC
--       as defense in depth (note: REVOKE does not restrict the table owner —
--       the trigger is what actually makes this unbypassable by app code).
--     - income_transactions / sent_transactions each get a pair of triggers
--       (AFTER INSERT, AFTER UPDATE OF status) that fire only on the
--       transition INTO 'completed'. Pending/cancelled rows never post.
--     - Posting is serialized with pg_advisory_xact_lock so two concurrent
--       completions (one income, one sent) can never both read the same
--       "previous balance" and race — see fn_post_income_ledger /
--       fn_post_sent_ledger.
--     - get_current_balance() reads the single latest ledger_entries row via
--       the entry_seq index — O(1), never a re-sum of transaction tables.
--     - Sign convention: income credits +amount, sent debits -amount.
--       transfer_fee is treated as revenue reported separately in the Reports
--       module (SUM(transfer_fee)); it is not itself a ledger posting.
--
--  2. TRANSACTION NUMBERING
--     - income_transactions.transaction_number / sent_transactions.transaction_number
--       have no Prisma-level default (see schema.prisma's dbgenerated()).
--       A BEFORE INSERT trigger fills them from a dedicated sequence
--       (INC-000001, SNT-000001, ...) when the client leaves them NULL.
--       Sequences are concurrency-safe by construction.
--
--  3. AUDIT LOG
--     - fn_audit_log() is one generic trigger function attached to
--       customers, income_transactions, sent_transactions and settings. It
--       reads the acting user id / request IP from transaction-local GUCs
--       (`app.current_user_id`, `app.request_ip`) that the repository layer
--       sets with `set_config(..., true)` inside the same DB transaction
--       before the mutating statement — see lib/db.ts / lib/repositories.
--       If those GUCs were never set, the columns are simply NULL; nothing
--       errors. Because this runs as a DB trigger, no Server Action bug can
--       skip it — the only way to bypass it is to not go through Postgres
--       at all.
--     - login/logout/print/export are not row mutations on an audited table,
--       so they are NOT covered by this trigger. They're written directly by
--       the repository layer's auditLogRepository.log() helper instead.
--
--  4. UPDATED_AT
--     - Prisma's @updatedAt already sets this on every `.update()` call, but
--       a BEFORE UPDATE trigger sets it again at the DB level so any raw SQL
--       or manual fix-up outside Prisma can't leave it stale.
-- =============================================================================

-- gen_random_uuid() is a built-in core function since PostgreSQL 13 — no
-- extension needed (and Neon/most managed Postgres run 15+ anyway).

-- -----------------------------------------------------------------------------
-- 1. Transaction number generation
-- -----------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS income_transaction_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS sent_transaction_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION fn_set_income_transaction_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := 'INC-' || lpad(nextval('income_transaction_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_set_sent_transaction_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := 'SNT-' || lpad(nextval('sent_transaction_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_income_set_transaction_number
  BEFORE INSERT ON income_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_set_income_transaction_number();

CREATE TRIGGER trg_sent_set_transaction_number
  BEFORE INSERT ON sent_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_set_sent_transaction_number();

-- -----------------------------------------------------------------------------
-- 2. Ledger posting (income = credit, sent = debit)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_post_income_ledger()
RETURNS trigger AS $$
DECLARE
  v_prev_balance NUMERIC(18,2);
  v_new_balance  NUMERIC(18,2);
BEGIN
  -- Global lock around "read latest balance, append one row" so this can never
  -- interleave with another posting (income or sent) racing on the same read.
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger_entries_balance', 0));

  SELECT balance_after INTO v_prev_balance
  FROM ledger_entries
  ORDER BY entry_seq DESC
  LIMIT 1;

  v_new_balance := COALESCE(v_prev_balance, 0) + NEW.amount;

  INSERT INTO ledger_entries
    (id, entry_type, reference_table, reference_id, amount, direction, balance_after, created_at)
  VALUES
    (gen_random_uuid(), 'income', 'income_transactions', NEW.id, NEW.amount, 'credit', v_new_balance, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_post_sent_ledger()
RETURNS trigger AS $$
DECLARE
  v_prev_balance NUMERIC(18,2);
  v_new_balance  NUMERIC(18,2);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger_entries_balance', 0));

  SELECT balance_after INTO v_prev_balance
  FROM ledger_entries
  ORDER BY entry_seq DESC
  LIMIT 1;

  v_new_balance := COALESCE(v_prev_balance, 0) - NEW.amount;

  INSERT INTO ledger_entries
    (id, entry_type, reference_table, reference_id, amount, direction, balance_after, created_at)
  VALUES
    (gen_random_uuid(), 'sent', 'sent_transactions', NEW.id, NEW.amount, 'debit', v_new_balance, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire on INSERT ...status='completed' straight away, and separately on
-- UPDATE OF status transitioning INTO 'completed'. Split rather than combined
-- into one "INSERT OR UPDATE" trigger because a WHEN clause referencing OLD
-- is not valid for the INSERT event.

CREATE TRIGGER trg_income_insert_post_ledger
  AFTER INSERT ON income_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION fn_post_income_ledger();

CREATE TRIGGER trg_income_update_post_ledger
  AFTER UPDATE OF status ON income_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION fn_post_income_ledger();

CREATE TRIGGER trg_sent_insert_post_ledger
  AFTER INSERT ON sent_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION fn_post_sent_ledger();

CREATE TRIGGER trg_sent_update_post_ledger
  AFTER UPDATE OF status ON sent_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION fn_post_sent_ledger();

-- -----------------------------------------------------------------------------
-- 3. get_current_balance() — O(1) read of the latest ledger row
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_current_balance()
RETURNS NUMERIC(18,2) AS $$
  SELECT COALESCE(
    (SELECT balance_after FROM ledger_entries ORDER BY entry_seq DESC LIMIT 1),
    0
  );
$$ LANGUAGE sql STABLE;

-- -----------------------------------------------------------------------------
-- 4. Append-only guard on ledger_entries
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_ledger_append_only_guard()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_no_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION fn_ledger_append_only_guard();

CREATE TRIGGER trg_ledger_no_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION fn_ledger_append_only_guard();

-- Belt-and-suspenders: revoke at the grant level too. Has no effect on the
-- table owner/superuser role most app connections use, which is exactly why
-- the trigger above — not this REVOKE — is the real enforcement.
REVOKE UPDATE, DELETE ON ledger_entries FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- 5. Generic audit log trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS trigger AS $$
DECLARE
  v_user_id   TEXT;
  v_ip        TEXT;
  v_action    "AuditAction";
  v_record_id TEXT;
BEGIN
  -- Set by the repository layer via set_config('app.current_user_id', <id>, true)
  -- / set_config('app.request_ip', <ip>, true) inside the same DB transaction,
  -- BEFORE the mutating statement. true = transaction-local, so it can never
  -- leak across pooled connections or requests.
  v_user_id := NULLIF(current_setting('app.current_user_id', true), '');
  v_ip      := NULLIF(current_setting('app.request_ip', true), '');

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'edit';
    v_record_id := NEW.id;
  ELSE -- DELETE
    v_action := 'delete';
    v_record_id := OLD.id;
  END IF;

  INSERT INTO audit_logs
    (id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_ip,
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_income_transactions
  AFTER INSERT OR UPDATE OR DELETE ON income_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_sent_transactions
  AFTER INSERT OR UPDATE OR DELETE ON sent_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_settings
  AFTER INSERT OR UPDATE OR DELETE ON settings
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- -----------------------------------------------------------------------------
-- 6. updated_at touch trigger (defense in depth alongside Prisma's @updatedAt)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_income_updated_at
  BEFORE UPDATE ON income_transactions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_sent_updated_at
  BEFORE UPDATE ON sent_transactions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Seed the singleton settings row so `settings` always has exactly one row.
-- -----------------------------------------------------------------------------

INSERT INTO settings (id, company_name, updated_at)
VALUES ('default', 'Remittance Co.', now())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. Seed a minimal set of currencies — reference/lookup data (like the
--    settings row above), not sample business data. The full seed script
--    (a later step) adds customers/transactions on top of this.
-- -----------------------------------------------------------------------------

INSERT INTO currencies (code, name, symbol, is_active, created_at) VALUES
  ('USD', 'US Dollar', '$', true, now()),
  ('EUR', 'Euro', '€', true, now()),
  ('GBP', 'British Pound', '£', true, now()),
  ('KES', 'Kenyan Shilling', 'KSh', true, now())
ON CONFLICT (code) DO NOTHING;
