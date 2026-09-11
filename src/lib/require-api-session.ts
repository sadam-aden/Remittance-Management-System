import { auth } from "@/auth";
import { userRepository } from "@/lib/repositories/user-repository";

/**
 * Route Handler equivalent of requireSession() (which uses redirect() —
 * meaningless for a file-download response). Returns null on failure; the
 * caller should respond with 401 rather than throw a raw error.
 */
export async function requireApiSession() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await userRepository.findById(session.user.id);
  if (!user || !user.isActive) return null;

  return session;
}
