/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@copilotkit/runtime", 'pdf-parse', 'pdfjs-dist'],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
