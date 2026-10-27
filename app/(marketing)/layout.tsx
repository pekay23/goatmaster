import type { Metadata } from 'next';
import './marketing.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GoatMaster | Herd records',
    template: '%s | GoatMaster',
  },
  description: 'Keep goat profiles, health records, and breeding history together with GoatMaster.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'GoatMaster',
    title: 'GoatMaster | Herd records',
    description: 'Keep goat profiles, health records, and breeding history together with GoatMaster.',
    images: [
      {
        url: '/marketing/goat-portrait.jpg',
        width: 1400,
        height: 1977,
        alt: 'A goat looking toward the camera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoatMaster | Herd records',
    description: 'Keep goat profiles, health records, and breeding history together with GoatMaster.',
    images: ['/marketing/goat-portrait.jpg'],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-root min-h-screen bg-[#F5F0E1] text-[#1A1F2E] antialiased">{children}</div>;
}
