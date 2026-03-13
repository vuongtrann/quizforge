import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@quizforge/ui", "@quizforge/types"],
};

export default nextConfig;
