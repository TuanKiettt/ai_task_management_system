/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix React hydration errors
  reactStrictMode: false,
  // Disable source maps in development to reduce 404 errors
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
      // Disable source maps for lucide-react
      config.module.rules.push({
        test: /\.js\.map$/,
        enforce: 'pre',
        use: ['ignore-loader']
      });
    }
    return config;
  },
}

export default nextConfig
