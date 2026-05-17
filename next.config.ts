// next.config.ts — Vault Next
// Security headers di sini berlaku untuk:
//   - development server (npm run dev)
//   - platform non-Vercel jika suatu saat deploy di sana
// vercel.json tetap dipertahankan untuk SW-specific caching headers
// dan sebagai primary security layer di production Vercel.

import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  {
    key:   'Content-Security-Policy',
    // Vault Next: offline-first, no Firebase, no CDN fonts, no third-party scripts
    // 'unsafe-inline' diperlukan untuk Next.js runtime scripts dan inline anti-FOUC script
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "worker-src 'self'",
    ].join('; '),
  },
];

const config: NextConfig = {
  reactStrictMode: true,

  // Error saat ada TS atau ESLint error — tidak pernah ignore
  typescript: { ignoreBuildErrors: false },
  eslint:     { ignoreDuringBuilds: false },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers — berlaku di dev server dan non-Vercel deploy
  // Di Vercel production, vercel.json headers diapply LEBIH DULU (lebih spesifik)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default config;
