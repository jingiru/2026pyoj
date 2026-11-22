import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pyodide"],
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" }
    ] }];
  },
  outputFileTracingIncludes: {
    "/api/challenges/submit": ["./public/python-worker.mjs", "./public/pyodide/**/*", "./node_modules/pyodide/**/*"]
  }
};

export default nextConfig;
