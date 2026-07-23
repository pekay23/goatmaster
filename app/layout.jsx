import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Goat Master',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered goat herd management app: track profiles, health records, breeding logs, kidding dates, and identify goats with smart scanning.',
  url: 'https://goatmaster-tau.vercel.app',
  author: {
    '@type': 'Organization',
    name: 'Goat Master Team',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with optional paid upgrades',
  },
  browserRequirements: 'Requires JavaScript',
  featureList: [
    'Goat profile management',
    'Health record tracking',
    'Breeding and kidding logs',
    'AI-powered goat identification',
    'Breed classification',
    'Smart scan for bulk enrollment',
  ],
  screenshot: 'https://goatmaster-tau.vercel.app/icon-512.png',
};

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
  referrer: 'origin-when-cross-origin',
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
    images: [{
      url: 'https://goatmaster-tau.vercel.app/icon-512.png',
      width: 512,
      height: 512,
      alt: 'Goat Master',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goat Master — Smart Herd Management',
    description: 'AI-powered goat farming app for the modern shepherd.',
    images: ['https://goatmaster-tau.vercel.app/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'productivity',
  other: {
    'application-id': 'goatmaster',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#28a745' },
    { media: '(prefers-color-scheme: dark)',  color: '#1A7A35' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
