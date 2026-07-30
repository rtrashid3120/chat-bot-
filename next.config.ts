import type { NextConfig } from "next";

function getSanitizedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const formatted =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    new URL(formatted);
    return formatted;
  } catch {
    return undefined;
  }
}

const safeUrl =
  getSanitizedUrl(process.env.AUTH_URL) ||
  getSanitizedUrl(process.env.NEXTAUTH_URL) ||
  getSanitizedUrl(process.env.VERCEL_URL) ||
  "http://localhost:3000";

process.env.AUTH_URL = safeUrl;
process.env.NEXTAUTH_URL = safeUrl;
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "zod/v3": "zod",
    };
    return config;
  },
};

export default nextConfig;
