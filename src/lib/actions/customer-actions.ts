"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { customerFormSchema } from "@/lib/validation/customer";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { requireSession } from "@/lib/auth-helpers";
import { getClientIp } from "@/lib/get-client-ip";

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function toCustomerData(data: ReturnType<typeof customerFormSchema.parse>) {
  return {
    fullName: data.fullName,
    phone: emptyToNull(data.phone),
    email: emptyToNull(data.email),
    nationalId: emptyToNull(data.nationalId),
    country: emptyToNull(data.country),
    city: emptyToNull(data.city),
    address: emptyToNull(data.address),
    notes: emptyToNull(data.notes),
  };
}

export async function createCustomerAction(input: unknown) {
  const session = await requireSession();
  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    const customer = await customerRepository.create(toCustomerData(parsed.data), actor);
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true as const, customer };
  } catch (error) {
    console.error("createCustomerAction failed:", error);
    return { success: false as const, error: "Failed to create customer" };
  }
}

export async function updateCustomerAction(id: string, input: unknown) {
  const session = await requireSession();
  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    const customer = await customerRepository.update(id, toCustomerData(parsed.data), actor);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { success: true as const, customer };
  } catch (error) {
    console.error("updateCustomerAction failed:", error);
    return { success: false as const, error: "Failed to update customer" };
  }
}

export async function deleteCustomerAction(id: string) {
  const session = await requireSession();
  const actor = { userId: session.user.id, ipAddress: await getClientIp() };

  try {
    await customerRepository.delete(id, actor);
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false as const,
        error: "Cannot delete a customer with existing transactions.",
      };
    }
    console.error("deleteCustomerAction failed:", error);
    return { success: false as const, error: "Failed to delete customer" };
  }
}
