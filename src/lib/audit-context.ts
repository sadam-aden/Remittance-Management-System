import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type Tx = Prisma.TransactionClient;

export interface ActorContext {
  userId?: string | null;
  ipAddress?: string | null;
}

/**
 * Runs `fn` inside a DB transaction with app.current_user_id / app.request_ip
 * set as transaction-local GUCs (set_config(..., true)), so fn_audit_log
 * (migration 20260906120100) can attribute the row change to a user/IP.
 *
 * Read Committed (Prisma's default) is sufficient here — it does not need to
 * be SERIALIZABLE. Duplicate-submit races are prevented by the
 * idempotency_key unique constraint, not by isolation level (see
 * db-errors.ts / each repository's create()). Cross-table ledger balance
 * races are prevented by the advisory lock inside fn_post_income_ledger /
 * fn_post_sent_ledger, not by this transaction's isolation level either.
 */
export async function withAuditContext<T>(
  actor: ActorContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${actor.userId ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.request_ip', ${actor.ipAddress ?? ""}, true)`;
    return fn(tx);
  });
}
