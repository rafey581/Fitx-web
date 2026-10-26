import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Prisma client + MariaDB driver are server-only native-ish modules and
  // must not be bundled into the server build.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-mariadb",
    "mariadb",
    "sharp",
  ],
  experimental: {
    serverActions: {
      // Media uploads go through a server action; the default 1 MB is too small.
      bodySizeLimit: "30mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
