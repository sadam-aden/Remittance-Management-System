import { z } from "zod";

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money", "Card", "Other"] as const;

export const incomeFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

// z.coerce.number() has a different input type (unknown, e.g. a string from
// a native <input>) than its output type (number) — split so the form can be
// typed with the loose input shape while onSubmit receives the parsed output.
export type IncomeFormInput = z.input<typeof incomeFormSchema>;
export type IncomeFormOutput = z.output<typeof incomeFormSchema>;
