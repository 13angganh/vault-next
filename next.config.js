/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,       // SW baru langsung aktif tanpa nunggu tab tutup
  clientsClaim: true,      // SW baru langsung kontrol semua klien aktif
  disable: process.env.NODE_ENV === 'development',
  // Cache strategy: network-first untuk navigasi agar selalu fresh
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'vault-pages-v1',
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},  // diperlukan agar next-pwa (webpack plugin) tidak konflik
};

module.exports = withPWA(nextConfig);
