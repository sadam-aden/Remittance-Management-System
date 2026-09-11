import { prisma } from "@/lib/db";
import { withAuditContext, type ActorContext } from "@/lib/audit-context";
import { isUniqueConstraintViolation } from "@/lib/db-errors";
import type { Prisma, TransactionStatus } from "@/generated/prisma/client";

export interface IncomeListParams {
  search?: string;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "amount" | "createdAt" | "transactionNumber";
  sortDir?: "asc" | "desc";
}

export interface CreateIncomeInput {
  date?: Date;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  status?: TransactionStatus;
  /** Client-generated UUID — a repeat submission with the same key returns the original row instead of erroring. */
  idempotencyKey?: string | null;
}

export interface UpdateIncomeInput {
  date?: Date;
  customerId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export const incomeRepository = {
  async list(params: IncomeListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.IncomeTransactionWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            date: {
              ...(params.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { transactionNumber: { contains: params.search, mode: "insensitive" } },
              { referenceNumber: { contains: params.search, mode: "insensitive" } },
              { paymentMethod: { contains: params.search, mode: "insensitive" } },
              { customer: { fullName: { contains: params.search, mode: "insensitive" } } },
              { customer: { phone: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.incomeTransaction.count({ where }),
      prisma.incomeTransaction.findMany({
        where,
        include: { customer: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { [params.sortBy ?? "date"]: params.sortDir ?? "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  },

  findById(id: string) {
    return prisma.incomeTransaction.findUnique({
      where: { id },
      include: { customer: true },
    });
  },

  /**
   * Creates an income transaction (status defaults to `pending`; it only
   * posts to the ledger once its status transitions to `completed` — see
   * migration 20260906120100). If `idempotencyKey` collides with an existing
   * row — a double-submitted/double-clicked form — returns that row instead
   * of throwing, so retries are safely idempotent.
   */
  async create(data: CreateIncomeInput, actor: ActorContext) {
    try {
      const record = await withAuditContext(actor, (tx) =>
        tx.incomeTransaction.create({
          data: {
            date: data.date ?? new Date(),
            customerId: data.customerId,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
            status: data.status ?? "pending",
            idempotencyKey: data.idempotencyKey,
            createdBy: actor.userId,
          },
        }),
      );
      return { record, wasIdempotentReplay: false as const };
    } catch (error) {
      if (data.idempotencyKey && isUniqueConstraintViolation(error, "idempotency_key")) {
        const existing = await prisma.incomeTransaction.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existing) return { record: existing, wasIdempotentReplay: true as const };
      }
      throw error;
    }
  },

  /** Status workflow transition (pending -> completed | cancelled). Posts to the ledger only on -> completed. */
  updateStatus(id: string, status: TransactionStatus, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.incomeTransaction.update({
        where: { id },
        data: { status, updatedBy: actor.userId },
      }),
    );
  },

  update(id: string, data: UpdateIncomeInput, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.incomeTransaction.update({
        where: { id },
        data: { ...data, updatedBy: actor.userId },
      }),
    );
  },
};
