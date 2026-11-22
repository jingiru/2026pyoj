import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pyodide", "skulpt"],
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" }
    ] }];
  },
  outputFileTracingIncludes: {
    "/api/challenges/submit": ["./public/python-worker.mjs", "./public/skulpt-worker.js", "./public/pyodide/**/*", "./node_modules/pyodide/**/*", "./node_modules/skulpt/main.js", "./node_modules/skulpt/package.json", "./node_modules/skulpt/dist/*.js"]
  }
};

export default nextConfig;
