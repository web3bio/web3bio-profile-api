/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/api",
        destination: "/",
        permanent: true,
      },
      {
        source: "/api/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
