import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_URL) process.env.AUTH_URL = "https://placeholder-url.vercel.app";
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = "https://placeholder-url.vercel.app";
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
