import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'carrefourar.vteximg.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jumboargentina.vteximg.com.br',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;