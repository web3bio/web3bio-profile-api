/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
}

module.exports = nextConfig
