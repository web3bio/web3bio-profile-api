/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  // Rewrite all paths to /api/ for API routing
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/api/:path*",
      },
    ];
  },

  // Redirect /api to root
  async redirects() {
    return [
      {
        source: "/api",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Set CORS and security headers for all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS, HEAD",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-Api-Key",
          },
        ],
      },
    ];
  },

  // Disable image optimization for static export compatibility
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
