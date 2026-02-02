/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Use built-in transpilePackages instead of next-transpile-modules
  transpilePackages: ['@jaedag/admin-portal-types', 'jd-date-utils'],
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize for production
  productionBrowserSourceMaps: true,
  // Disable static optimization for auth-heavy app
  output: 'standalone',
  // Custom webpack config for SVGR support
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          use: ['@svgr/webpack'],
          issuer: /\.[jt]sx?$/,
        },
        {
          loader: 'file-loader',
        },
      ],
    })

    return config
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_GRAPHQL_ENDPOINT:
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      'http://localhost:4000/graphql',
  },
  // API proxy
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig
