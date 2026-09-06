import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["skulpt"],
  outputFileTracingIncludes: {
    "/api/challenges/submit": ["./node_modules/skulpt/main.js", "./node_modules/skulpt/package.json", "./node_modules/skulpt/dist/skulpt.min.js", "./node_modules/skulpt/dist/skulpt-stdlib.js"]
  }
};

export default nextConfig;
