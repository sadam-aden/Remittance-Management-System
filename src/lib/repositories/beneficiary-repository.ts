import { prisma } from "@/lib/db";
import { withAuditContext, type ActorContext } from "@/lib/audit-context";

export interface BeneficiaryInput {
  fullName: string;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  notes?: string | null;
}

export interface BeneficiarySearchResult {
  id: string;
  fullName: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  lastTransactionDate: Date | null;
}

export const beneficiaryRepository = {
  /** Matches by phone OR name, per the "recipient mobile number or full name" lookup spec. */
  async search(query: string): Promise<BeneficiarySearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const results = await prisma.beneficiary.findMany({
      where: {
        OR: [
          { fullName: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { fullName: "asc" },
      include: {
        sentTransactions: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    });

    return results.map((b) => ({
      id: b.id,
      fullName: b.fullName,
      phone: b.phone,
      country: b.country,
      city: b.city,
      lastTransactionDate: b.sentTransactions[0]?.date ?? null,
    }));
  },

  findById(id: string) {
    return prisma.beneficiary.findUnique({ where: { id } });
  },

  create(data: BeneficiaryInput, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.beneficiary.create({ data: { ...data, createdBy: actor.userId } }),
    );
  },

  update(id: string, data: Partial<BeneficiaryInput>, actor: ActorContext) {
    return withAuditContext(actor, (tx) => tx.beneficiary.update({ where: { id }, data }));
  },
};
