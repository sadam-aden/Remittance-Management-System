import { headers } from "next/headers";

/**
 * Server-side client IP resolution for Server Actions / Route Handlers.
 * Never trust a client-supplied IP field in a request body — this only reads
 * headers set by the platform's edge network (Vercel sets x-forwarded-for).
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return h.get("x-real-ip");
}

/** Same idea, but for contexts that already hold a raw Request (e.g. NextAuth's authorize). */
export function getClientIpFromRequest(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip");
}
