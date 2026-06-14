import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't infer it from a
  // stray parent lockfile.
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
