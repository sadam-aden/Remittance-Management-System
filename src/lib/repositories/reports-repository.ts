import { prisma } from "@/lib/db";
import type { TransactionStatus } from "@/generated/prisma/client";

export interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  customerId?: string;
  type?: "income" | "sent"; // omitted = both
  sortBy?: "date" | "amount" | "transactionNumber";
  sortDir?: "asc" | "desc";
}

export interface ReportRow {
  id: string;
  type: "income" | "sent";
  transactionNumber: string;
  date: Date;
  customerName: string;
  counterpartyName: string | null; // recipient name for sent, null for income
  amount: number;
  fee: number;
  totalPaid: number;
  currency: string;
  paymentMethod: string;
  status: TransactionStatus;
}

export interface ReportSummary {
  totalIncome: number;
  totalSent: number;
  totalProfit: number;
  transactionCount: number;
}

// Reports only ever read data — no writes, so no audit-context/actor plumbing needed here.
export const reportsRepository = {
  async getTransactions(filters: ReportFilters): Promise<ReportRow[]> {
    const dateRange = { gte: filters.dateFrom, lte: filters.dateTo };

    const [income, sent] = await Promise.all([
      filters.type === "sent"
        ? []
        : prisma.incomeTransaction.findMany({
            where: {
              date: dateRange,
              ...(filters.customerId ? { customerId: filters.customerId } : {}),
            },
            include: { customer: { select: { fullName: true } } },
            orderBy: { date: "desc" },
          }),
      filters.type === "income"
        ? []
        : prisma.sentTransaction.findMany({
            where: {
              date: dateRange,
              ...(filters.customerId ? { customerId: filters.customerId } : {}),
            },
            include: { customer: { select: { fullName: true } } },
            orderBy: { date: "desc" },
          }),
    ]);

    const rows: ReportRow[] = [
      ...income.map((tx): ReportRow => ({
        id: tx.id,
        type: "income",
        transactionNumber: tx.transactionNumber,
        date: tx.date,
        customerName: tx.customer.fullName,
        counterpartyName: null,
        amount: Number(tx.amount),
        fee: 0,
        totalPaid: Number(tx.amount),
        currency: tx.currency,
        paymentMethod: tx.paymentMethod,
        status: tx.status,
      })),
      ...sent.map((tx): ReportRow => ({
        id: tx.id,
        type: "sent",
        transactionNumber: tx.transactionNumber,
        date: tx.date,
        customerName: tx.customer.fullName,
        counterpartyName: tx.recipientName,
        amount: Number(tx.amount),
        fee: Number(tx.transferFee),
        totalPaid: Number(tx.totalPaid),
        currency: tx.currency,
        paymentMethod: tx.paymentMethod,
        status: tx.status,
      })),
    ];

    const sortBy = filters.sortBy ?? "date";
    const sortDir = filters.sortDir ?? "desc";
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortBy === "amount") return (a.amount - b.amount) * dir;
      if (sortBy === "transactionNumber") return a.transactionNumber.localeCompare(b.transactionNumber) * dir;
      return (a.date.getTime() - b.date.getTime()) * dir;
    });
    return rows;
  },

  // Financial totals only ever count completed transactions — pending/cancelled
  // never posted to the ledger, so they shouldn't count as real income/sent/profit.
  async getSummary(filters: ReportFilters): Promise<ReportSummary> {
    const dateRange = { gte: filters.dateFrom, lte: filters.dateTo };

    const [incomeAgg, sentAgg] = await Promise.all([
      filters.type === "sent"
        ? null
        : prisma.incomeTransaction.aggregate({
            _sum: { amount: true },
            _count: true,
            where: {
              status: "completed",
              date: dateRange,
              ...(filters.customerId ? { customerId: filters.customerId } : {}),
            },
          }),
      filters.type === "income"
        ? null
        : prisma.sentTransaction.aggregate({
            _sum: { amount: true, transferFee: true },
            _count: true,
            where: {
              status: "completed",
              date: dateRange,
              ...(filters.customerId ? { customerId: filters.customerId } : {}),
            },
          }),
    ]);

    return {
      totalIncome: Number(incomeAgg?._sum.amount ?? 0),
      totalSent: Number(sentAgg?._sum.amount ?? 0),
      totalProfit: Number(sentAgg?._sum.transferFee ?? 0),
      transactionCount: (incomeAgg?._count ?? 0) + (sentAgg?._count ?? 0),
    };
  },
};
