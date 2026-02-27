import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// In production, NEXT_PUBLIC_API_URL is the Railway backend URL (e.g. https://api.yourapp.up.railway.app)
// In development it defaults to localhost:8000.
// Validate the value — if it doesn't start with http/https we ignore it so the build never fails.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const API_URL =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl
    : 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      // beforeFiles: empty — Next.js Route Handlers (app/api/**/route.ts) must win
      beforeFiles: [],

      // afterFiles: only applied when NO filesystem route matched.
      // This proxies unrecognised /api/* paths to the Railway backend.
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${API_URL}/api/:path*`,
        },
        {
          source: '/ws/:path*',
          destination: `${API_URL}/ws/:path*`,
        },
      ],

      fallback: [],
    };
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation + project (set SENTRY_ORG and SENTRY_PROJECT env vars in CI)
  silent: !process.env.CI,          // Only log Sentry build output in CI
  disableLogger: true,

  // Upload source maps only when DSN is configured
  sourcemaps: {
    disable: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  },

});
