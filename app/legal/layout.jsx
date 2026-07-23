import './../globals.css';

export const metadata = {
  title: 'Goat Master — Legal',
  description: 'Privacy Policy, Terms of Service, and legal information for Goat Master — the AI-powered goat herd management app.',
  openGraph: {
    title: 'Goat Master — Legal',
    description: 'Privacy Policy, Terms of Service, and legal information for Goat Master.',
    url: 'https://goatmaster-tau.vercel.app/legal',
    siteName: 'Goat Master',
    locale: 'en_US',
    type: 'website',
    images: [{
      url: 'https://goatmaster-tau.vercel.app/icon-512.png',
      width: 512,
      height: 512,
      alt: 'Goat Master',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goat Master — Legal',
    description: 'Privacy Policy, Terms of Service, and legal information for Goat Master.',
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
