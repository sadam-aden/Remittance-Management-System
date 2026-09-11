"use server";

import { auth, signOut } from "@/auth";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { getClientIp } from "@/lib/get-client-ip";

export async function logoutAction() {
  const session = await auth();
  if (session?.user) {
    await auditLogRepository.log({
      userId: session.user.id,
      action: "logout",
      tableName: "users",
      recordId: session.user.id,
      ipAddress: await getClientIp(),
    });
  }
  await signOut({ redirectTo: "/login" });
}
