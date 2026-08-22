import type { NextConfig } from "next";

// START GENAI
const nextConfig: NextConfig = {
  // Default 1MB body limit is too small for a phone-camera saree photo upload.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};
// END GENAI

export default nextConfig;
