-- Add sent_transactions.customer_id — the paying customer at the counter,
-- mirroring income_transactions.customer_id. Originally omitted per the
-- initial spec (sent_transactions only carried recipient info), but every
-- outbound transfer has a known sender, and this lets a customer's history
-- span both money they sent in and money sent out on their behalf.

-- Nullable first so this is safe to run against a table that already has
-- rows (any pre-existing sent_transactions get backfilled below, then the
-- column is locked to NOT NULL) — on a fresh database this UPDATE is a no-op.
ALTER TABLE "sent_transactions" ADD COLUMN "customer_id" TEXT;

UPDATE "sent_transactions"
SET "customer_id" = (SELECT "id" FROM "customers" ORDER BY "created_at" ASC LIMIT 1)
WHERE "customer_id" IS NULL;

ALTER TABLE "sent_transactions" ALTER COLUMN "customer_id" SET NOT NULL;

ALTER TABLE "sent_transactions"
  ADD CONSTRAINT "sent_transactions_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "sent_transactions_customer_id_idx" ON "sent_transactions"("customer_id");
