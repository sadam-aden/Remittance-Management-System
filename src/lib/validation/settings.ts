import { z } from "zod";

export const settingsFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  defaultCurrency: z.string().min(1, "Default currency is required"),
  businessAddress: z.string().max(500).optional().or(z.literal("")),
  phoneNumbers: z.string().max(200).optional().or(z.literal("")),
  receiptFooter: z.string().max(1000).optional().or(z.literal("")),
  taxEnabled: z.boolean().optional(),
  taxRate: z.coerce.number().min(0, "Tax rate can't be negative").max(100, "Tax rate can't exceed 100%").optional(),
});

// See income.ts for why input/output are split (z.coerce.number()'s input
// type differs from its output type, which trips up useForm's typing).
export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormOutput = z.output<typeof settingsFormSchema>;

export const exchangeRateFormSchema = z.object({
  baseCurrency: z.string().min(1, "Base currency is required"),
  quoteCurrency: z.string().min(1, "Quote currency is required"),
  rate: z.coerce.number({ message: "Rate is required" }).positive("Rate must be greater than 0"),
});

export type ExchangeRateFormInput = z.input<typeof exchangeRateFormSchema>;
export type ExchangeRateFormOutput = z.output<typeof exchangeRateFormSchema>;
