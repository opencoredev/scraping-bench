import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site: every number comes from src/data/results.json at build time.
  output: "export",
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
