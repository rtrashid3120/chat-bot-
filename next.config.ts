import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  process.env.AUTH_URL = "https://placeholder-url.vercel.app";
  process.env.NEXTAUTH_URL = "https://placeholder-url.vercel.app";
}
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
