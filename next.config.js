/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt'],
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
