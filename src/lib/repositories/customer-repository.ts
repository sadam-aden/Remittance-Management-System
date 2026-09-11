import { prisma } from "@/lib/db";
import { withAuditContext, type ActorContext } from "@/lib/audit-context";
import type { Prisma } from "@/generated/prisma/client";

export interface CustomerListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "fullName" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface CustomerInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  notes?: string | null;
}

export const customerRepository = {
  async list(params: CustomerListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.CustomerWhereInput = params.search
      ? {
          OR: [
            { fullName: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { country: { contains: params.search, mode: "insensitive" } },
            { city: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { [params.sortBy ?? "createdAt"]: params.sortDir ?? "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  },

  findById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  },

  /** Customer detail + their income/sent transaction history, for the customer profile page. */
  async findByIdWithHistory(id: string) {
    const [customer, incomeTransactions, sentTransactions] = await Promise.all([
      prisma.customer.findUnique({ where: { id } }),
      prisma.incomeTransaction.findMany({
        where: { customerId: id },
        orderBy: { date: "desc" },
      }),
      prisma.sentTransaction.findMany({
        where: { customerId: id },
        orderBy: { date: "desc" },
      }),
    ]);
    return { customer, incomeTransactions, sentTransactions };
  },

  create(data: CustomerInput, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.customer.create({ data: { ...data, createdBy: actor.userId } }),
    );
  },

  update(id: string, data: Partial<CustomerInput>, actor: ActorContext) {
    return withAuditContext(actor, (tx) => tx.customer.update({ where: { id }, data }));
  },

  delete(id: string, actor: ActorContext) {
    return withAuditContext(actor, (tx) => tx.customer.delete({ where: { id } }));
  },
};
