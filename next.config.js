/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep server-side firebase-admin out of the client bundle
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
