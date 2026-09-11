import type { NextAuthConfig } from "next-auth";

/**
 * Split from auth.ts on purpose: this half has no Prisma/bcrypt imports, so
 * it's safe to load from proxy.ts even if a future deploy target puts Proxy
 * back on the Edge runtime. The `authorized` callback is what proxy.ts's
 * `auth` wrapper calls on every matched request.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      // Always allow /login to render — do NOT redirect an apparently-logged-in
      // request straight to /dashboard here. This callback only sees a JWT's
      // signature validity, not whether that user still exists in the database
      // (this config deliberately has no Prisma import, see file header). The
      // login page itself (src/app/login/page.tsx) re-checks against the DB and
      // redirects a *genuinely* valid session away — doing that redirect here
      // instead, for a stale session bounced here with ?error=SessionExpired,
      // creates an infinite loop: proxy sends it to /dashboard, the layout's
      // DB check rejects it and sends it back to /login, forever.
      if (isLoginPage) {
        return true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
