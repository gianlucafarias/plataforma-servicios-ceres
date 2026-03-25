import type { NextConfig } from "next";

function buildRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!publicBaseUrl) {
    return patterns;
  }

  try {
    const url = new URL(publicBaseUrl);
    const basePath = url.pathname.replace(/\/+$/, "");

    patterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || "",
      pathname: `${basePath || ""}/**`,
    });
  } catch (error) {
    console.warn("Invalid R2_PUBLIC_BASE_URL for next/image remotePatterns:", error);
  }

  return patterns;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: buildRemotePatterns(),
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
