"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { userFormSchema, userEditFormSchema } from "@/lib/validation/user";
import { userRepository } from "@/lib/repositories/user-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { requireSession } from "@/lib/auth-helpers";
import { getClientIp } from "@/lib/get-client-ip";

// users isn't in the DB-trigger audit list (only customers/income/sent/
// settings/beneficiaries are) — logged directly here instead, same pattern
// as login/logout/print/export.
export async function createUserAction(input: unknown) {
  const session = await requireSession();
  const parsed = userFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    return { success: false as const, error: "A user with that email already exists." };
  }

  try {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
    });

    await auditLogRepository.log({
      userId: session.user.id,
      action: "create",
      tableName: "users",
      recordId: user.id,
      ipAddress: await getClientIp(),
    });

    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("createUserAction failed:", error);
    return { success: false as const, error: "Failed to create user" };
  }
}

export async function updateUserAction(id: string, input: unknown) {
  const session = await requireSession();
  const parsed = userEditFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await userRepository.findByEmail(data.email);
  if (existing && existing.id !== id) {
    return { success: false as const, error: "A user with that email already exists." };
  }

  try {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;
    await userRepository.update(id, {
      name: data.name,
      email: data.email,
      role: data.role,
      ...(passwordHash ? { passwordHash } : {}),
    });

    await auditLogRepository.log({
      userId: session.user.id,
      action: "edit",
      tableName: "users",
      recordId: id,
      ipAddress: await getClientIp(),
    });

    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("updateUserAction failed:", error);
    return { success: false as const, error: "Failed to update user" };
  }
}

export async function deleteUserAction(id: string) {
  const session = await requireSession();

  if (id === session.user.id) {
    return { success: false as const, error: "You can't delete your own account." };
  }

  try {
    await userRepository.delete(id);
    await auditLogRepository.log({
      userId: session.user.id,
      action: "delete",
      tableName: "users",
      recordId: id,
      ipAddress: await getClientIp(),
    });
    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("deleteUserAction failed:", error);
    return { success: false as const, error: "Failed to delete user" };
  }
}

export async function setUserActiveAction(id: string, isActive: boolean) {
  const session = await requireSession();

  if (id === session.user.id && !isActive) {
    return { success: false as const, error: "You can't deactivate your own account." };
  }

  try {
    await userRepository.setActive(id, isActive);
    await auditLogRepository.log({
      userId: session.user.id,
      action: "edit",
      tableName: "users",
      recordId: id,
      ipAddress: await getClientIp(),
    });
    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("setUserActiveAction failed:", error);
    return { success: false as const, error: "Failed to update user" };
  }
}
