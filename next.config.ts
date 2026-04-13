import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      { protocol: "https", hostname: "gravatar.com" },
      { protocol: "https", hostname: "www.svgrepo.com" },
      { protocol: "https", hostname: "images.seeklogo.com" },
      { protocol: "https", hostname: "img.icons8.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "i.ebayimg.com" },
    ],
  },
};

export default nextConfig;
