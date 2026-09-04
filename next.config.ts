import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Ya existentes
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
      // Coto
      {
        protocol: 'https',
        hostname: 'static.cotodigital3.com.ar',
        pathname: '/**',
      },
      // VTEX genérico (cubre Jumbo, Disco, Vea, Carrefour nuevos dominios)
      {
        protocol: 'https',
        hostname: '*.vtexassets.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vteximg.com.br',
        pathname: '/**',
      },
      // LA Anonima
      {
        protocol: 'https',
        hostname: 'd34zqip92wkcpm.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default withSerwist(nextConfig);