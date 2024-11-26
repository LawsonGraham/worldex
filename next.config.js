/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure domains for next/image if needed
  images: {
    domains: ['worldcoin.org', 'id.worldcoin.org'],
  },
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_ACTION: process.env.NEXT_PUBLIC_ACTION,
    NEXT_PUBLIC_WALLETCONNECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ALCHEMY_RPC_URL: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL,
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
