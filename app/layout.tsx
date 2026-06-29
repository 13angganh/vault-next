import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import '@/styles/globals.css';

/* Google Fonts via next/font (no CDN, no layout shift) */
/* Inter menggantikan Outfit — lebih readable di ukuran kecil untuk data sensitif */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',  /* Nama variabel SAMA — tokens.css tidak perlu diubah */
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const APP_FULL_NAME = `${APP_NAME} v${APP_VERSION}`;

export const metadata: Metadata = {
  title: APP_FULL_NAME,
  description: 'Pengelola akun terenkripsi AES-256. Sepenuhnya offline, tanpa server.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
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
  // Mencegah layout shift saat keyboard virtual muncul di Android/iOS
  // 'resizes-visual' → keyboard hanya mengubah visual viewport, bukan layout viewport
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#07080f" />
        {/*
          v1.4.0: Anti-flash script untuk tema.
          Inline script ini WAJIB sync (tanpa async/defer) dan WAJIB di <head>
          agar dieksekusi sebelum browser mulai paint halaman. Ini mencegah
          "flash" tema gelap sekilas untuk user yang preferensinya terang,
          karena tanpa ini, html selalu mulai dari :root (= dark) sampai
          ThemeProvider's useEffect sempat berjalan setelah hydration.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('vault_theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="/sw-register.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
