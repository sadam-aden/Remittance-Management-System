import { prisma } from "@/lib/db";

/**
 * exchange_rates is a reference table used only to default form values —
 * never join to it to compute historical totals. sent_transactions snapshots
 * its own exchangeRate at creation time (see sent-repository.ts).
 */
export const exchangeRateRepository = {
  list() {
    return prisma.exchangeRate.findMany({
      orderBy: { effectiveDate: "desc" },
      include: { base: true, quote: true },
    });
  },

  getLatestRate(baseCurrency: string, quoteCurrency: string) {
    return prisma.exchangeRate.findFirst({
      where: { baseCurrency, quoteCurrency },
      orderBy: { effectiveDate: "desc" },
    });
  },

  create(data: { baseCurrency: string; quoteCurrency: string; rate: number; effectiveDate?: Date }) {
    return prisma.exchangeRate.create({ data });
  },

  delete(id: string) {
    return prisma.exchangeRate.delete({ where: { id } });
  },
};
