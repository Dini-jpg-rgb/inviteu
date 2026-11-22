import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/designer",
        destination: "/designer/dashboard",
        permanent: false,
      },
      {
        source: "/designer/login",
        destination: "/login/designer",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/login/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
