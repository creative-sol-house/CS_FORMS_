import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /* 🔒 Hide route names from production browser bundles */
  productionBrowserSourceMaps: false,

  /* 🔒 Don't advertise the framework */
  poweredByHeader: false,
};

export default nextConfig;