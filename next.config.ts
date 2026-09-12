import type { NextConfig } from "next";

// R2_PUBLIC_URL is read at build time (next.config.ts runs in Node) so the
// CSP's img-src can allow exactly the bucket this app actually serves
// receipt/logo images from, instead of a blanket wildcard.
const r2Origin = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).origin : "";
  } catch {
    return "";
  }
})();

// Next.js's own hydration bootstrap scripts and Base UI's inline positioning
// styles aren't nonce-tagged in this app (that requires per-request nonce
// plumbing through proxy.ts), so script-src/style-src need 'unsafe-inline'
// here — a pragmatic middle ground, not a false claim of a strict CSP.
// object-src/base-uri/form-action/frame-ancestors are still fully locked
// down, which blocks the classic clickjacking and base-tag-hijack vectors
// regardless of the script-src concession.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${r2Origin ? ` ${r2Origin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${r2Origin ? ` ${r2Origin}` : ""}`,
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
