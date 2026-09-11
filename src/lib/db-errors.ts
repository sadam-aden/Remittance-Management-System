import { Prisma } from "@/generated/prisma/client";

interface P2002Meta {
  // Classic query-engine shape: an array of column names.
  target?: string[];
  // Prisma 7 driver-adapter shape (@prisma/adapter-pg / @prisma/adapter-neon)
  // — there is no `target`; the offending constraint comes back nested here.
  driverAdapterError?: {
    cause?: {
      constraint?: { index?: string; fields?: string[] };
    };
  };
}

/** True if `error` is a Prisma unique-constraint violation (P2002) on `field`. */
export function isUniqueConstraintViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const meta = error.meta as P2002Meta | undefined;

  if (Array.isArray(meta?.target) && meta.target.includes(field)) return true;

  const constraint = meta?.driverAdapterError?.cause?.constraint;
  if (constraint?.fields?.includes(field)) return true;
  // Prisma's default constraint-naming convention is `<table>_<field>_key`.
  if (constraint?.index?.includes(field)) return true;

  return false;
}
