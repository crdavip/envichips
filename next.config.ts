import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.179'],
  outputFileTracingIncludes: { "/*": ["lib/generated/prisma/**"] },
};

export default nextConfig;
