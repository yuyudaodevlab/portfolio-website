import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/", destination: "/ja", permanent: false }];
  },
};

export default nextConfig;
