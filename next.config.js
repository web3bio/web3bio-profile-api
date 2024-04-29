/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    forceSwcTransforms: true,
  },
  rewrites: async () => [
    {
      source: "/:path*",
      destination: "/api/:path*",
    },
  ],
  redirects: async () => [
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
  ],
  headers: async () => [
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
  ],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
