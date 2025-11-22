/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  // Disable trailing slashes for cleaner URLs
  trailingSlash: false,
  // Hide Next.js from the response headers
  poweredByHeader: false,
  // Enable compression
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
          // CORS headers
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-Api-Key",
          },
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
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

export default nextConfig;
