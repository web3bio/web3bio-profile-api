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
            value: "GET, POST, OPTIONS, HEAD",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-Api-Key",
          },
          {
            key: "Access-Control-Expose-Headers",
            value: "Retry-After, X-Request-Platform",
          },
        ],
      },
      {
        source: "/profile/:path*",
        headers: [
          {
            key: "Link",
            value: '</llms.txt>; rel="describedby"; type="text/plain"',
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
