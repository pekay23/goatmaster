import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://goatmaster-tau.vercel.app'),
  title: {
    default: 'Goat Master — Smart Herd Management',
    template: '%s · Goat Master',
  },
  description: 'Track your goat herd: profiles, health records, breeding logs, kidding dates, and AI-powered scanning to identify individual goats and breeds.',
  applicationName: 'Goat Master',
  authors: [{ name: 'Goat Master Team' }],
  keywords: ['goat farming', 'herd management', 'livestock', 'breeding tracker', 'goat breeds', 'goat health log', 'farm app'],
  creator: 'Goat Master',
  publisher: 'Goat Master',
  formatDetection: { telephone: false, address: false, email: false },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Goat Master',
    startupImage: '/splashscreen.png',
  },
  icons: {
    icon: [
      { url: '/favicon.ico',     sizes: 'any' },
      { url: '/favicon-16.png',  sizes: '16x16',   type: 'image/png' },
      { url: '/favicon-32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/icon-192.png',    sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png',    sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://goatmaster-tau.vercel.app',
    siteName: 'Goat Master',
    title: 'Goat Master — Smart Herd Management',
    description: 'AI-powered goat farming app: identify individual goats, classify breeds, and track health & breeding all in one place.',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Goat Master' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goat Master — Smart Herd Management',
    description: 'AI-powered goat farming app for the modern shepherd.',
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'productivity',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#28a745' },
    { media: '(prefers-color-scheme: dark)',  color: '#1A7A35' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
