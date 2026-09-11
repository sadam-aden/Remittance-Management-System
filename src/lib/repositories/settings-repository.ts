import { prisma } from "@/lib/db";
import { withAuditContext, type ActorContext } from "@/lib/audit-context";
import type { Prisma } from "@/generated/prisma/client";

export interface SettingsInput {
  companyName?: string;
  logoUrl?: string | null;
  defaultCurrency?: string;
  receiptFooter?: string | null;
  businessAddress?: string | null;
  phoneNumbers?: string | null;
  taxSettings?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

// The migration seeds a single row with id 'default' and settings is audited
// (fn_audit_log trigger) like customers/income/sent — every write needs an actor.
export const settingsRepository = {
  get() {
    return prisma.settings.findUniqueOrThrow({ where: { id: "default" } });
  },

  update(data: SettingsInput, actor: ActorContext) {
    return withAuditContext(actor, (tx) =>
      tx.settings.update({ where: { id: "default" }, data }),
    );
  },
};
