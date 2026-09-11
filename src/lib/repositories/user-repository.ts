import { prisma } from "@/lib/db";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: {
    email: string;
    name?: string | null;
    passwordHash: string;
    role?: "admin" | "cashier";
  }) {
    return prisma.user.create({ data });
  },

  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  update(
    id: string,
    data: Partial<{ name: string | null; email: string; role: "admin" | "cashier"; passwordHash: string }>,
  ) {
    return prisma.user.update({ where: { id }, data });
  },

  // Historical FKs (customers.createdBy, income/sent processedBy/updatedBy,
  // beneficiaries.createdBy, audit_logs.userId) are all ON DELETE SET NULL —
  // deleting a user never fails, it just leaves those old records
  // unattributed. The UI's confirmation dialog is what actually protects
  // against this being done by accident.
  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
