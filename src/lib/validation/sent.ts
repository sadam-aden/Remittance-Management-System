import { z } from "zod";

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money", "Card", "Other"] as const;

// The business only serves this corridor today — extend here (and nowhere
// else) if more destination countries are added later.
export const COUNTRIES = ["Somalia", "Djibouti"] as const;

// City dropdown is keyed off the selected country. Not exhaustive — the form
// always offers an "Other" option that reveals a free-text field, so a city
// missing from this list never blocks recording a transfer.
export const CITIES_BY_COUNTRY: Record<(typeof COUNTRIES)[number], string[]> = {
  Somalia: [
    "Mogadishu",
    "Hargeisa",
    "Kismayo",
    "Bosaso",
    "Berbera",
    "Galkayo",
    "Baidoa",
    "Beledweyne",
    "Jowhar",
    "Marka",
    "Garowe",
    "Burao",
    "Erigavo",
    "Las Anod",
    "Afgooye",
    "Qardho",
  ],
  Djibouti: ["Djibouti City", "Ali Sabieh", "Dikhil", "Tadjoura", "Obock", "Arta", "Holhol", "Yoboki"],
};
export const OTHER_CITY = "__other__";

// 2.5% of amount, e.g. $2.50 per $100 sent. Hardcoded until the Settings
// module exposes fee configuration (tax_settings), at which point this
// should read from there instead.
export const DEFAULT_FEE_RATE = 0.025;

export const sentFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  customerId: z.string().min(1, "Sender is required"),
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  recipientPhone: z.string().max(30).optional().or(z.literal("")),
  country: z.enum(COUNTRIES, { message: "Select a destination country" }),
  city: z.string().max(100).optional().or(z.literal("")),
  amount: z.coerce.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  transferFee: z.coerce.number({ message: "Fee is required" }).min(0, "Fee can't be negative"),
  exchangeRate: z.coerce
    .number({ message: "Exchange rate is required" })
    .positive("Exchange rate must be greater than 0"),
  totalPaid: z.coerce.number({ message: "Total paid is required" }).positive("Total paid must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

// See income.ts for why input/output are split (z.coerce.number()'s input
// type differs from its output type, which trips up useForm's typing).
export type SentFormInput = z.input<typeof sentFormSchema>;
export type SentFormOutput = z.output<typeof sentFormSchema>;
