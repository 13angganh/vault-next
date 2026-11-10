import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import '@/styles/globals.css';

/* Google Fonts via next/font (no CDN, no layout shift) */
/* Inter menggantikan Outfit — lebih readable di ukuran kecil untuk data sensitif */
/* v2.0.0 (Tahap 2) — PENTING: kelas `variable` kedua font di bawah dipasang pada
   <html>, BUKAN <body>. Token --font-sans/--font-mono (styles/tokens.css) berisi
   var(--font-outfit)/var(--font-jetbrains) dan dievaluasi di :root. Custom
   property yang berisi var() diselesaikan pada elemen tempat ia dideklarasikan,
   bukan tempat ia dipakai: bila --font-outfit hanya ada di <body>, di :root ia
   tidak terdefinisi sehingga --font-sans menjadi tidak valid dan SELURUH teks
   jatuh ke font bawaan browser (serif). Terbukti di Chromium pada build
   sebelum perbaikan ini (lihat LAPORAN-TAHAP-2.md). */
const inter = Inter({
  subsets: ['latin'],
  // v1.11.0: '800' ditambahkan — dipakai .vault-list-title (redesain
  // visual Tahap 3, dikonfirmasi user di preview v3). Tanpa weight ini
  // di-load eksplisit, font-weight:800 di CSS akan fallback ke 700
  // atau synthetic bold (buram di beberapa browser), bukan true bold.
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',  /* Nama variabel SAMA — tokens.css tidak perlu diubah */
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  // v2.0.0 (Tahap 2): '500' ditambahkan — .entry-field__value.mono memakai
  // font-weight:500 (redesign.css). Tanpa face 500, browser memilih 400 (bobot
  // yang diminta tidak pernah tampil). Terukur di Chromium (lab Tahap 2).
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const APP_FULL_NAME = `${APP_NAME} v${APP_VERSION}`;

export const metadata: Metadata = {
  title: APP_FULL_NAME,
  description: 'Aurum Vault — pengelola kata sandi offline dengan enkripsi AES-256. Tanpa server.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
  themeColor: '#05060b',
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
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#05060b" />
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
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="/sw-register.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
