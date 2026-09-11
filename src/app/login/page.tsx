import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { auth } from "@/auth";
import { userRepository } from "@/lib/repositories/user-repository";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in — Remittance Desk" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    // A JWT can stay cryptographically valid after its user is deleted or
    // deactivated (e.g. a local dev database reset) — don't bounce back to
    // /dashboard on a stale session, or a signed-out-but-still-cookied user
    // could never reach the form to sign back in. Falling through (rather
    // than clearing the cookie here) is deliberate: cookies can only be
    // written from a Server Action/Route Handler, not a page render: the
    // stale cookie is simply overwritten once they actually sign in again.
    const user = await userRepository.findById(session.user.id);
    if (user && user.isActive) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-void px-4">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-card p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income">
            <Wallet size={20} className="text-void" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-text-primary">
              Remittance Desk
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Sign in to manage transfers and balances
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
