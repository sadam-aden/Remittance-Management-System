import { z } from "zod";

export const customerFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  nationalId: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
