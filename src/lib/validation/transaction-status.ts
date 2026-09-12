import { z } from "zod";

// Mirrors the Prisma TransactionStatus enum — kept as an explicit Zod schema
// so status-transition actions validate at the same layer as every other
// action, rather than relying solely on Postgres rejecting a bad enum value.
export const transactionStatusSchema = z.enum(["pending", "completed", "cancelled"]);
