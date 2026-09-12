import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/user-repository";

/**
 * Defense-in-depth session check for Server Actions / Server Components.
 * proxy.ts already blocks unauthenticated requests to protected routes, but
 * Next.js explicitly warns that a matcher change can silently remove that
 * coverage — every Server Action must verify the session itself too.
 *
 * This also re-validates the session's user against the database (not just
 * the JWT signature). With JWT sessions, a signed-in browser keeps working
 * off the token's embedded user id even if that user is later deleted or
 * deactivated — e.g. a stale admin id surviving a database reset — which
 * would otherwise surface as a raw foreign-key violation the first time a
 * mutation tries to record who did it. Catching it here turns that into a
 * clean redirect back to login instead.
 *
 * The DB row's name/email/role are also overlaid onto the returned session,
 * not just used for the active check — a JWT session otherwise keeps
 * whatever name/role it was issued with until the browser signs in again,
 * so editing your own profile (Settings > Users) wouldn't show up anywhere
 * that reads session.user.name/role until you logged out and back in.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await userRepository.findById(session.user.id);
  if (!user || !user.isActive) {
    redirect("/login?error=SessionExpired");
  }

  session.user.name = user.name;
  session.user.email = user.email;
  session.user.role = user.role;

  return session;
}

/**
 * Same as requireSession(), but additionally rejects non-admin accounts.
 * Use this for Server Actions that must be admin-only (user management,
 * settings, exchange rates, deleting customers) — role must be enforced
 * here, server-side; the UI hiding a button is not an authorization check.
 */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    redirect("/dashboard?error=Forbidden");
  }
  return session;
}
