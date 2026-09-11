-- Returning Customer / Beneficiary Lookup feature: recipients become a real,
-- searchable entity (by phone or name) instead of plain text repeated on
-- every sent_transactions row. sent_transactions keeps its recipient_name /
-- recipient_phone / country / city columns as a point-in-time snapshot (same
-- rationale as exchange_rate) and gains a required beneficiary_id link to the
-- canonical profile, so a beneficiary's full transaction history is queryable
-- and a repeat recipient's details don't need to be re-typed.

CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "beneficiaries_full_name_idx" ON "beneficiaries"("full_name");
CREATE INDEX "beneficiaries_phone_idx" ON "beneficiaries"("phone");

ALTER TABLE "beneficiaries"
  ADD CONSTRAINT "beneficiaries_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nullable first so this is safe against a table that already has rows.
ALTER TABLE "sent_transactions" ADD COLUMN "beneficiary_id" TEXT;

-- Backfill: one beneficiary per distinct (recipient_name, recipient_phone)
-- pair seen in existing sent_transactions, then point those rows at it.
-- On a fresh database sent_transactions is empty and this is a no-op.
INSERT INTO "beneficiaries" ("id", "full_name", "phone", "country", "city", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  t."recipient_name",
  t."recipient_phone",
  (array_agg(t."country" ORDER BY t."created_at" DESC))[1],
  (array_agg(t."city" ORDER BY t."created_at" DESC))[1],
  min(t."created_at"),
  now()
FROM "sent_transactions" t
GROUP BY t."recipient_name", t."recipient_phone";

UPDATE "sent_transactions" t
SET "beneficiary_id" = b."id"
FROM "beneficiaries" b
WHERE b."full_name" = t."recipient_name"
  AND b."phone" IS NOT DISTINCT FROM t."recipient_phone"
  AND t."beneficiary_id" IS NULL;

ALTER TABLE "sent_transactions" ALTER COLUMN "beneficiary_id" SET NOT NULL;

ALTER TABLE "sent_transactions"
  ADD CONSTRAINT "sent_transactions_beneficiary_id_fkey"
  FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "sent_transactions_beneficiary_id_idx" ON "sent_transactions"("beneficiary_id");

-- Reuse the existing generic triggers (see migration 20260906120100) —
-- beneficiaries is audited like customers, and gets the same updated_at guard.
CREATE TRIGGER trg_audit_beneficiaries
  AFTER INSERT OR UPDATE OR DELETE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
