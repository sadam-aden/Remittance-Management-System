import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Production (Vercel) talks to Neon over its serverless/WebSocket driver;
// local dev talks to a disposable `prisma dev` Postgres over plain TCP, which
// the Neon adapter can't do. Keying off NODE_ENV instead of a manual swap
// means this can't be left in the wrong state before a deploy again.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter =
    process.env.NODE_ENV === "production"
      ? new PrismaNeon({ connectionString })
      : new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
