import { prisma } from "@/lib/db";

export const ledgerRepository = {
  /** O(1) read of the latest ledger_entries.balance_after — see get_current_balance() in migrations. */
  async getCurrentBalance(): Promise<number> {
    const rows = await prisma.$queryRaw<{ balance: string }[]>`SELECT get_current_balance() as balance`;
    return Number(rows[0]?.balance ?? 0);
  },
};
