"use server";

import { revalidatePath } from "next/cache";
import { sentFormSchema } from "@/lib/validation/sent";
import { sentRepository } from "@/lib/repositories/sent-repository";
import { beneficiaryRepository } from "@/lib/repositories/beneficiary-repository";
import { requireSession } from "@/lib/auth-helpers";
import { getClientIp } from "@/lib/get-client-ip";
import type { TransactionStatus } from "@/generated/prisma/client";

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function searchBeneficiariesAction(query: string) {
  await requireSession();
  return beneficiaryRepository.search(query);
}

export async function createSentAction(
  input: unknown,
  idempotencyKey: string,
  receiptImageUrl: string | null = null,
  beneficiaryId: string | null = null,
) {
  const session = await requireSession();
  const parsed = sentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    const { record, wasIdempotentReplay } = await sentRepository.create(
      {
        date: new Date(data.date),
        customerId: data.customerId,
        beneficiaryId,
        recipientName: data.recipientName,
        recipientPhone: emptyToNull(data.recipientPhone),
        country: data.country,
        city: emptyToNull(data.city),
        amount: data.amount,
        currency: data.currency,
        transferFee: data.transferFee,
        exchangeRate: data.exchangeRate,
        totalPaid: data.totalPaid,
        paymentMethod: data.paymentMethod,
        notes: emptyToNull(data.notes),
        idempotencyKey,
        receiptImageUrl,
      },
      actor,
    );
    revalidatePath("/sent");
    revalidatePath("/dashboard");
    return { success: true as const, record, wasIdempotentReplay };
  } catch (error) {
    console.error("createSentAction failed:", error);
    return { success: false as const, error: "Failed to record transfer" };
  }
}

export async function updateSentStatusAction(id: string, status: TransactionStatus) {
  const session = await requireSession();
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    await sentRepository.updateStatus(id, status, actor);
    revalidatePath("/sent");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (error) {
    console.error("updateSentStatusAction failed:", error);
    return { success: false as const, error: "Failed to update status" };
  }
}
