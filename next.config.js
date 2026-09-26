/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep server-side firebase-admin out of the client bundle
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

module.exports = nextConfig;
