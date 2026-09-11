import { prisma } from "@/lib/db";
import { withAuditContext, type ActorContext } from "@/lib/audit-context";
import { isUniqueConstraintViolation } from "@/lib/db-errors";
import type { Prisma, TransactionStatus } from "@/generated/prisma/client";

export interface SentListParams {
  search?: string;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "amount" | "createdAt" | "transactionNumber";
  sortDir?: "asc" | "desc";
}

export interface CreateSentInput {
  date?: Date;
  customerId: string;
  /** An existing Beneficiary matched via lookup; omit to create a new one from recipientName/recipientPhone/country/city. */
  beneficiaryId?: string | null;
  recipientName: string;
  recipientPhone?: string | null;
  country?: string | null;
  city?: string | null;
  amount: number;
  currency: string;
  transferFee?: number;
  /** Snapshotted at creation time — never recomputed from exchange_rates later. */
  exchangeRate: number;
  totalPaid: number;
  paymentMethod: string;
  notes?: string | null;
  status?: TransactionStatus;
  /** Client-generated UUID — a repeat submission with the same key returns the original row instead of erroring. */
  idempotencyKey?: string | null;
  /** Uploaded to R2 client-side before submit — see upload-actions.ts. */
  receiptImageUrl?: string | null;
}

export interface UpdateSentInput {
  date?: Date;
  customerId?: string;
  recipientName?: string;
  recipientPhone?: string | null;
  country?: string | null;
  city?: string | null;
  amount?: number;
  currency?: string;
  transferFee?: number;
  exchangeRate?: number;
  totalPaid?: number;
  paymentMethod?: string;
  notes?: string | null;
}

export const sentRepository = {
  async list(params: SentListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.SentTransactionWhereInput = {
      ...(params.status ? { status: params.status } : {}),
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
              { recipientName: { contains: params.search, mode: "insensitive" } },
              { recipientPhone: { contains: params.search, mode: "insensitive" } },
              { paymentMethod: { contains: params.search, mode: "insensitive" } },
              { customer: { fullName: { contains: params.search, mode: "insensitive" } } },
              { customer: { phone: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.sentTransaction.count({ where }),
      prisma.sentTransaction.findMany({
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
    return prisma.sentTransaction.findUnique({ where: { id }, include: { customer: true } });
  },

  /**
   * Creates a sent-money transaction (status defaults to `pending`; it only
   * debits the ledger once its status transitions to `completed`). Idempotent
   * on `idempotencyKey` — a double-submit returns the original row.
   *
   * When `beneficiaryId` is omitted, a new Beneficiary is created from
   * recipientName/recipientPhone/country/city in the SAME DB transaction as
   * the sent_transactions insert — if the idempotency check below rolls the
   * transaction back, the new beneficiary rolls back with it, so a retried
   * double-submit never leaves an orphan beneficiary behind.
   */
  async create(data: CreateSentInput, actor: ActorContext) {
    try {
      const record = await withAuditContext(actor, async (tx) => {
        const beneficiaryId =
          data.beneficiaryId ??
          (
            await tx.beneficiary.create({
              data: {
                fullName: data.recipientName,
                phone: data.recipientPhone,
                country: data.country,
                city: data.city,
                createdBy: actor.userId,
              },
            })
          ).id;

        return tx.sentTransaction.create({
          data: {
            date: data.date ?? new Date(),
            customerId: data.customerId,
            beneficiaryId,
            recipientName: data.recipientName,
            recipientPhone: data.recipientPhone,
            country: data.country,
            city: data.city,
            amount: data.amount,
            currency: data.currency,
            transferFee: data.transferFee ?? 0,
            exchangeRate: data.exchangeRate,
            totalPaid: data.totalPaid,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            status: data.status ?? "pending",
            idempotencyKey: data.idempotencyKey,
            receiptImageUrl: data.receiptImageUrl,
            processedBy: actor.userId,
          },
        });
      });
      return { record, wasIdempotentReplay: false as const };
    } catch (error) {
      if (data.idempotencyKey && isUniqueConstraintViolation(error, "idempotency_key")) {
        const existing = await prisma.sentTransaction.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existing) return { record: existing, wasIdempotentReplay: true as const };
      }
      throw error;
    }
  },

  /** Status workflow transition (pending -> completed | cancelled). Debits the ledger only on -> completed. */
  updateStatus(id: string, status: TransactionStatus, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.sentTransaction.update({
        where: { id },
        data: { status, updatedBy: actor.userId },
      }),
    );
  },

  update(id: string, data: UpdateSentInput, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.sentTransaction.update({
        where: { id },
        data: { ...data, updatedBy: actor.userId },
      }),
    );
  },
};
