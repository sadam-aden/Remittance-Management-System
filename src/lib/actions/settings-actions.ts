"use server";

import { revalidatePath } from "next/cache";
import { settingsFormSchema, exchangeRateFormSchema } from "@/lib/validation/settings";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { exchangeRateRepository } from "@/lib/repositories/exchange-rate-repository";
import { requireSession } from "@/lib/auth-helpers";
import { getClientIp } from "@/lib/get-client-ip";

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function updateSettingsAction(input: unknown, logoUrl?: string | null) {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    return { success: false as const, error: "Admin access required." };
  }
  const parsed = settingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    await settingsRepository.update(
      {
        companyName: data.companyName,
        defaultCurrency: data.defaultCurrency,
        businessAddress: emptyToNull(data.businessAddress),
        phoneNumbers: emptyToNull(data.phoneNumbers),
        receiptFooter: emptyToNull(data.receiptFooter),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        taxSettings: { enabled: data.taxEnabled ?? false, rate: data.taxRate ?? 0 },
      },
      actor,
    );
    revalidatePath("/settings");
    revalidatePath("/reports-print");
    return { success: true as const };
  } catch (error) {
    console.error("updateSettingsAction failed:", error);
    return { success: false as const, error: "Failed to update settings" };
  }
}

export async function createExchangeRateAction(input: unknown) {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    return { success: false as const, error: "Admin access required." };
  }
  const parsed = exchangeRateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await exchangeRateRepository.create(parsed.data);
    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("createExchangeRateAction failed:", error);
    return { success: false as const, error: "Failed to add exchange rate" };
  }
}

export async function deleteExchangeRateAction(id: string) {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    return { success: false as const, error: "Admin access required." };
  }
  try {
    await exchangeRateRepository.delete(id);
    revalidatePath("/settings");
    return { success: true as const };
  } catch (error) {
    console.error("deleteExchangeRateAction failed:", error);
    return { success: false as const, error: "Failed to delete exchange rate" };
  }
}
