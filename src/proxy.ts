import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// A second, lightweight NextAuth instance built from the edge-safe config only
// (no providers/adapter/bcrypt/Prisma) — this is what actually runs on every
// matched request, so it must not pull in Node-only dependencies.
// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (same mechanism, new name);
// Next's build-time check for this file wants a literal function export, so
// wrap the destructured `auth` handler rather than re-exporting it directly.
const { auth } = NextAuth(authConfig);

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args);
}

export const config = {
  // Everything except: all of /api, Next internals, and static assets.
  // /api is excluded on purpose — an unauthenticated request there should get
  // a clean 401 from the route handler's own check (see requireApiSession()),
  // not an HTML redirect to /login that a 200-following API client would
  // silently treat as success. Pages still get the redirect-to-login UX via
  // this proxy; API routes protect themselves. Per Next.js's own guidance,
  // this is a coarse first line of defense either way — every Server Action /
  // repository call must independently verify the session too.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};
