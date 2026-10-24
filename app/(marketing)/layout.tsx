import type { Metadata } from 'next';
import './marketing.css';

export const metadata: Metadata = {
  title: {
    default: 'GoatMaster — AI-Powered Goat Farm Management',
    template: '%s | GoatMaster',
  },
  description: 'From pasture to precision. Offline-first herd management, AI health scanning, lineage tracking. Trusted by farmers across Ghana.',
  keywords: ['goat farming', 'herd management', 'livestock tracking', 'agriculture technology', 'Ghana farming', 'offline-first app', 'AI scanning'],
  authors: [{ name: 'GoatMaster Team' }],
  creator: 'GoatMaster',
  publisher: 'GoatMaster',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://goatmaster.com',
    siteName: 'GoatMaster',
    title: 'GoatMaster — AI-Powered Goat Farm Management',
    description: 'From pasture to precision. Offline-first herd management, AI health scanning, lineage tracking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GoatMaster - AI-Powered Goat Farm Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoatMaster — AI-Powered Goat Farm Management',
    description: 'From pasture to precision. Offline-first herd management, AI health scanning, lineage tracking.',
    images: ['/og-image.png'],
    creator: '@goatmasterapp',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.svg',
    apple: '/apple-touch-icon.svg',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GH">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.paystack.co" />
      </head>
      <body className="marketing-root min-h-screen bg-[#F5F0E1] text-[#1A1F2E] antialiased">
        {children}
      </body>
    </html>
  );
}