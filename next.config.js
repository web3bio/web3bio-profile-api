/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => ({
    beforeFiles: [
      {
        has: [
          {
            type: "host",
            value: "api.web3.bio",
          },
        ],
        source: "/:path*",
        destination: "/api/:path*",
      },
    ],
  }),
  redirects: async () => [
    {
      has: [
        {
          type: "host",
          value: "api.web3.bio",
        },
      ],
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
}

module.exports = nextConfig
