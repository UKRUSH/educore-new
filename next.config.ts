import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["multer", "@anthropic-ai/sdk", "pdf-parse", "pdf-parse/lib/pdf-parse.js", "openai", "jsonrepair", "cloudinary"],
};

export default nextConfig;
