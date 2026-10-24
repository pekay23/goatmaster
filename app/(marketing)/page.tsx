import { Metadata } from 'next';
import Script from 'next/script';
import Hero from '@/components/marketing/Hero';
import ProblemSolution from '@/components/marketing/ProblemSolution';
import FeaturesCarousel from '@/components/marketing/FeaturesCarousel';
import InteractiveTiers from '@/components/marketing/InteractiveTiers';
import SocialProof from '@/components/marketing/SocialProof';
import TechDepth from '@/components/marketing/TechDepth';
import Ecosystem from '@/components/marketing/Ecosystem';
import FooterCTA from '@/components/marketing/FooterCTA';

export const metadata: Metadata = {
  title: 'GoatMaster — AI-Powered Goat Farm Management',
  description: 'From pasture to precision. Offline-first herd management, AI health scanning, lineage tracking. Trusted by farmers across Ghana.',
  openGraph: {
    title: 'GoatMaster — AI-Powered Goat Farm Management',
    description: 'From pasture to precision. Offline-first herd management, AI health scanning, lineage tracking.',
    type: 'website',
    locale: 'en_GH',
    url: 'https://goatmaster.com',
    siteName: 'GoatMaster',
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
  robots: { index: true, follow: true },
  verification: {
    google: 'google-site-verification-code',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GoatMaster',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Cloud, Web, Mobile (PWA)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GHS',
    availability: 'https://schema.org/InStock',
    description: 'Free tier available. Paid plans from GHS 99/month.',
  },
  description: 'AI-powered goat herd management with offline-first sync, smart scanning, lineage tracking, and analytics.',
  featureList: [
    'Offline-first herd management',
    'AI-powered goat recognition',
    'Automatic lineage tracking',
    'Health & vaccination alerts',
    'Breeding management',
    'Feed optimization',
    'Analytics dashboard',
  ],
  author: {
    '@type': 'Organization',
    name: 'GoatMaster',
    url: 'https://goatmaster.com',
    logo: 'https://goatmaster.com/logo.png',
    sameAs: [
      'https://twitter.com/goatmasterapp',
      'https://linkedin.com/company/goatmaster',
      'https://github.com/goatmaster',
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  slogan: 'From Pasture to Precision',
  url: 'https://goatmaster.com',
};

export default function MarketingPage() {
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-green-50">
        <Hero />
        <ProblemSolution />
        <FeaturesCarousel />
        <InteractiveTiers />
        <SocialProof />
        <TechDepth />
        <Ecosystem />
        <FooterCTA />
      </main>
    </>
  );
}