import type { NextConfig } from "next";
import dns from "node:dns";

// 🔥 FORCE NODE.JS TO USE GOOGLE DNS
// This fixes the "querySrv ECONNREFUSED" error on Windows
// by bypassing the broken default system DNS resolver.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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