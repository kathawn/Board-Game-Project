import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Driver SQL Server (qua @prisma/adapter-mssql) dùng module native của Node — không để bundler gộp vào bundle.
  serverExternalPackages: ["mssql", "@prisma/adapter-mssql", "tedious"],
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
