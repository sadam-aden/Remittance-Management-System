import { prisma } from "@/lib/db";
import type { AuditAction, Prisma } from "@/generated/prisma/client";

/**
 * For events that are NOT row mutations on an audited table (login/logout/
 * print/export) — those can't be caught by the DB trigger (fn_audit_log in
 * migration 20260906120100), so the app writes them directly here instead.
 * create/edit/delete on customers/income_transactions/sent_transactions/settings
 * are handled entirely by the trigger — do not also log them from here.
 */
export const auditLogRepository = {
  log(params: {
    userId?: string | null;
    action: AuditAction;
    tableName: string;
    recordId?: string | null;
    ipAddress?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  },

  async list(
    params: {
      search?: string;
      action?: AuditAction;
      tableName?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;

    const where: Prisma.AuditLogWhereInput = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.tableName ? { tableName: params.tableName } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            createdAt: {
              ...(params.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { tableName: { contains: params.search, mode: "insensitive" } },
              { recordId: { contains: params.search, mode: "insensitive" } },
              { user: { email: { contains: params.search, mode: "insensitive" } } },
              { user: { name: { contains: params.search, mode: "insensitive" } } },
              { ipAddress: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return { items, total, page, pageSize };
  },
};
