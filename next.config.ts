import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "pino", "pino-pretty"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
