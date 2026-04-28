import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours browser cache for images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Compress responses
  compress: true,
  // Enable experimental features for faster builds & runtime
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Aggressive HTTP caching for static assets
  async headers() {
    return [
      {
        source: '/api/payment-methods',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate=60' },
        ],
      },
      {
        source: '/api/campaigns/:slug',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=30' },
        ],
      },
    ];
  },
};

export default nextConfig;
