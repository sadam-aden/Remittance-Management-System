import { z } from "zod";

export const USER_ROLES = ["admin", "cashier"] as const;

export const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES, { message: "Select a role" }),
});

export type UserFormInput = z.infer<typeof userFormSchema>;

// Password is optional here — leave it blank to keep the current one.
export const userEditFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  role: z.enum(USER_ROLES, { message: "Select a role" }),
});

export type UserEditFormInput = z.infer<typeof userEditFormSchema>;
