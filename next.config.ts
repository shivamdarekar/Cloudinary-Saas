import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
};

export default nextConfig;
