import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// In production, NEXT_PUBLIC_API_URL is the Railway backend URL (e.g. https://api.yourapp.up.railway.app)
// In development it defaults to localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${API_URL}/ws/:path*`,
      },
    ];
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

  // Automatically tree-shake Sentry logger statements in production
  hideSourceMaps: true,
});
