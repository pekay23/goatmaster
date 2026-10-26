import './../globals.css';

export const metadata = {
  title: 'GoatMaster — Legal',
  description: 'Privacy Policy, Terms of Service, and legal information for GoatMaster — the AI-powered goat herd management app.',
  openGraph: {
    title: 'GoatMaster — Legal',
    description: 'Privacy Policy, Terms of Service, and legal information for GoatMaster.',
    url: 'https://goatmaster-tau.vercel.app/legal',
    siteName: 'GoatMaster',
    locale: 'en_US',
    type: 'website',
    images: [{
      url: 'https://goatmaster-tau.vercel.app/icon-512.png',
      width: 512,
      height: 512,
      alt: 'GoatMaster',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoatMaster — Legal',
    description: 'Privacy Policy, Terms of Service, and legal information for GoatMaster.',
    images: ['https://goatmaster-tau.vercel.app/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalLayout({ children }) {
  return children;
}
