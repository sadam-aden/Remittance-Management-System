import { prisma } from "@/lib/db";

export const currencyRepository = {
  listActive() {
    return prisma.currency.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  },

  list() {
    return prisma.currency.findMany({ orderBy: { code: "asc" } });
  },

  create(data: { code: string; name: string; symbol: string }) {
    return prisma.currency.create({ data });
  },

  setActive(code: string, isActive: boolean) {
    return prisma.currency.update({ where: { code }, data: { isActive } });
  },
};
