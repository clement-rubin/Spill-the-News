/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Cover images travel through server actions, and the 1 MB default would
    // reject them before our own 5 MB check in lib/storage.ts ever runs.
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
