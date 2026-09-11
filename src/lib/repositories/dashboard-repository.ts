import { prisma } from "@/lib/db";

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface DailyFlow {
  day: string;
  income: number;
  sent: number;
}

export interface MonthlyFlow {
  month: string;
  income: number;
  sent: number;
}

export interface TopCustomerSlice {
  name: string;
  amount: number;
  value: number;
}

export interface RecentTransactionRow {
  id: string;
  type: "income" | "sent";
  who: string;
  amount: number;
  currency: string;
  status: string;
  transactionNumber: string;
  date: Date;
}

// NOTE: card/chart totals sum `amount` across transactions regardless of
// currency (matching the single-$-denominated dashboard in the design
// reference) — proper multi-currency conversion belongs to the Reports
// module, not this simplification.
export const dashboardRepository = {
  async getCards() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const startOfLastMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, 1);

    const [
      todayIncome,
      todaySent,
      monthIncome,
      monthSent,
      lastMonthIncome,
      lastMonthSent,
      todaySentFees,
      todayIncomeCount,
      todaySentCount,
      incomeCount,
      sentCount,
      customerCount,
      newCustomersToday,
    ] = await Promise.all([
      prisma.incomeTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.sentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.incomeTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfMonth } },
      }),
      prisma.sentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfMonth } },
      }),
      prisma.incomeTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      prisma.sentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "completed", date: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      // Profit = transfer fees collected on completed sent transactions — a
      // reporting metric, not itself a ledger posting (see migration 20260906120100).
      prisma.sentTransaction.aggregate({
        _sum: { transferFee: true },
        where: { status: "completed", date: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.incomeTransaction.count({ where: { date: { gte: startOfToday, lt: endOfToday } } }),
      prisma.sentTransaction.count({ where: { date: { gte: startOfToday, lt: endOfToday } } }),
      prisma.incomeTransaction.count(),
      prisma.sentTransaction.count(),
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { gte: startOfToday, lt: endOfToday } } }),
    ]);

    const monthlyIncomeTotal = Number(monthIncome._sum.amount ?? 0);
    const monthlySentTotal = Number(monthSent._sum.amount ?? 0);
    const todayIncomeTotal = Number(todayIncome._sum.amount ?? 0);
    const todaySentTotal = Number(todaySent._sum.amount ?? 0);
    const todayProfitTotal = Number(todaySentFees._sum.transferFee ?? 0);

    return {
      currentBalanceTransactionsToday: todayIncomeCount + todaySentCount,
      todayIncome: todayIncomeTotal,
      todayIncomeCount,
      todaySent: todaySentTotal,
      todaySentCount,
      todayProfit: todayProfitTotal,
      todayProfitMargin: todayIncomeTotal > 0 ? (todayProfitTotal / todayIncomeTotal) * 100 : null,
      monthlyIncome: monthlyIncomeTotal,
      monthlyIncomeChangePct: pctChange(monthlyIncomeTotal, Number(lastMonthIncome._sum.amount ?? 0)),
      monthlySent: monthlySentTotal,
      monthlySentChangePct: pctChange(monthlySentTotal, Number(lastMonthSent._sum.amount ?? 0)),
      transactionCount: incomeCount + sentCount,
      customerCount,
      newCustomersToday,
    };
  },

  async getWeeklyFlow(): Promise<DailyFlow[]> {
    // `date` is stored as a naive (no-timezone) column holding whatever calendar
    // day the form recorded, and Prisma round-trips it UTC-literally (a stored
    // "2026-09-08 00:00:00" always comes back as the instant 2026-09-08T00:00:00Z,
    // regardless of server TZ). Building `start`/each `d` via local Date methods
    // (setHours, setDate) and then reading them with toISOString() mixes local-
    // clock construction with a UTC-based key — on a server whose local TZ isn't
    // UTC this silently shifts every day back by one, so today's real activity
    // never matches any of the 7 keys generated (verified against live data: the
    // "Tue" bar was landing on key "2026-09-07" while today's rows came back
    // keyed "2026-09-08"). Date.UTC(...) from local Y/M/D keeps every date here
    // in the same UTC-literal frame Prisma already uses for the column.
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 6));

    const [incomeRows, sentRows] = await Promise.all([
      prisma.$queryRaw<{ day: Date; total: string }[]>`
        SELECT date_trunc('day', date) as day, SUM(amount) as total
        FROM income_transactions
        WHERE status = 'completed' AND date >= ${start}
        GROUP BY 1
      `,
      prisma.$queryRaw<{ day: Date; total: string }[]>`
        SELECT date_trunc('day', date) as day, SUM(amount) as total
        FROM sent_transactions
        WHERE status = 'completed' AND date >= ${start}
        GROUP BY 1
      `,
    ]);

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);
    const incomeMap = new Map(incomeRows.map((r) => [dateKey(new Date(r.day)), Number(r.total)]));
    const sentMap = new Map(sentRows.map((r) => [dateKey(new Date(r.day)), Number(r.total)]));

    const days: DailyFlow[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
      const key = dateKey(d);
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        income: incomeMap.get(key) ?? 0,
        sent: sentMap.get(key) ?? 0,
      });
    }
    return days;
  },

  async getMonthlyTrend(months = 12): Promise<MonthlyFlow[]> {
    // Same UTC-literal fix as getWeeklyFlow — see the comment there.
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (months - 1), 1));

    const [incomeRows, sentRows] = await Promise.all([
      prisma.$queryRaw<{ month: Date; total: string }[]>`
        SELECT date_trunc('month', date) as month, SUM(amount) as total
        FROM income_transactions
        WHERE status = 'completed' AND date >= ${start}
        GROUP BY 1
      `,
      prisma.$queryRaw<{ month: Date; total: string }[]>`
        SELECT date_trunc('month', date) as month, SUM(amount) as total
        FROM sent_transactions
        WHERE status = 'completed' AND date >= ${start}
        GROUP BY 1
      `,
    ]);

    const monthKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const incomeMap = new Map(incomeRows.map((r) => [monthKey(new Date(r.month)), Number(r.total)]));
    const sentMap = new Map(sentRows.map((r) => [monthKey(new Date(r.month)), Number(r.total)]));

    const out: MonthlyFlow[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = monthKey(d);
      out.push({
        month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        income: incomeMap.get(key) ?? 0,
        sent: sentMap.get(key) ?? 0,
      });
    }
    return out;
  },

  async getTopCustomers(limit = 4): Promise<TopCustomerSlice[]> {
    const rows = await prisma.incomeTransaction.groupBy({
      by: ["customerId"],
      where: { status: "completed" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    if (rows.length === 0) return [];

    const total = rows.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);
    if (total === 0) return [];

    const top = rows.slice(0, limit);
    const rest = rows.slice(limit);

    const customers = await prisma.customer.findMany({
      where: { id: { in: top.map((r) => r.customerId) } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(customers.map((c) => [c.id, c.fullName]));

    const slices: TopCustomerSlice[] = top.map((r) => {
      const amount = Number(r._sum.amount ?? 0);
      return {
        name: nameById.get(r.customerId) ?? "Unknown",
        amount,
        value: Math.round((amount / total) * 100),
      };
    });

    const restTotal = rest.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);
    if (restTotal > 0) {
      slices.push({ name: "Others", amount: restTotal, value: Math.round((restTotal / total) * 100) });
    }
    return slices;
  },

  async getRecentTransactions(limit = 6): Promise<RecentTransactionRow[]> {
    const [income, sent] = await Promise.all([
      prisma.incomeTransaction.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { fullName: true } } },
      }),
      prisma.sentTransaction.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const merged: RecentTransactionRow[] = [
      ...income.map((tx) => ({
        id: tx.id,
        type: "income" as const,
        who: tx.customer.fullName,
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status,
        transactionNumber: tx.transactionNumber,
        date: tx.createdAt,
      })),
      ...sent.map((tx) => ({
        id: tx.id,
        type: "sent" as const,
        who: tx.recipientName,
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status,
        transactionNumber: tx.transactionNumber,
        date: tx.createdAt,
      })),
    ];

    merged.sort((a, b) => b.date.getTime() - a.date.getTime());
    return merged.slice(0, limit);
  },
};
