import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/styles/globals.css';

/* Google Fonts via next/font (no CDN, no layout shift) */
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vault Next',
  description: 'Pengelola akun terenkripsi AES-256. Sepenuhnya offline, tanpa server.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vault Next',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-152x152.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'google-site-verification': 'lUWKvqnjdB0FNmPRDnJFjbXO-0-y5g9TNVhE_o5TXwQ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07080f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-flash: set data-theme sebelum render untuk hindari flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vault_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}})();`,
          }}
        />
        <meta name="theme-color" content="#07080f" />
      </head>
      {/* className hanya inject CSS variables (--font-sans, --font-mono).
          Font diterapkan ke body via base.css: body { font-family: var(--font-sans); }
          Ini intentional — app tidak menggunakan Tailwind, jadi tidak ada class font-sans. */}
      <body className={`${outfit.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
