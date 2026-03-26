import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["multer", "@anthropic-ai/sdk"],
};

export default nextConfig;
