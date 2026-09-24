import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@base/auth",
    "@base/authorization",
    "@base/db-control",
    "@base/db-tenant",
    "@base/shared",
    "@base/ui",
    "@domain/activity-booking",
  ],
};

export default nextConfig;
