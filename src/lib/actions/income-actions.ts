"use server";

import { revalidatePath } from "next/cache";
import { incomeFormSchema } from "@/lib/validation/income";
import { transactionStatusSchema } from "@/lib/validation/transaction-status";
import { incomeRepository } from "@/lib/repositories/income-repository";
import { requireSession } from "@/lib/auth-helpers";
import { getClientIp } from "@/lib/get-client-ip";
import type { TransactionStatus } from "@/generated/prisma/client";

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createIncomeAction(input: unknown, idempotencyKey: string) {
  const session = await requireSession();
  const parsed = incomeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    const { record, wasIdempotentReplay } = await incomeRepository.create(
      {
        date: new Date(data.date),
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        referenceNumber: emptyToNull(data.referenceNumber),
        notes: emptyToNull(data.notes),
        idempotencyKey,
      },
      actor,
    );
    revalidatePath("/income");
    revalidatePath("/dashboard");
    return { success: true as const, record, wasIdempotentReplay };
  } catch (error) {
    console.error("createIncomeAction failed:", error);
    return { success: false as const, error: "Failed to record income" };
  }
}

export async function updateIncomeStatusAction(id: string, status: TransactionStatus) {
  const session = await requireSession();
  const parsedStatus = transactionStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { success: false as const, error: "Invalid status" };
  }
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    await incomeRepository.updateStatus(id, parsedStatus.data, actor);
    revalidatePath("/income");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (error) {
    console.error("updateIncomeStatusAction failed:", error);
    return { success: false as const, error: "Failed to update status" };
  }
}
