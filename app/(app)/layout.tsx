import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/app/AppLayout';

export const metadata: Metadata = {
  title: {
    default: 'GoatMaster — Herd Management',
    template: '%s | GoatMaster',
  },
  description: 'AI-powered goat herd management that works offline',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/site.webmanifest',
};

export default async function AppLayoutRoot({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  const user = token ? await verifyToken(token) : null;
  
  if (!user) {
    redirect('/login?redirect=/app');
  }

  const orgId = user.orgId as string;
  
  if (!orgId) {
    redirect('/no-organization');
  }

  return <AppLayout orgId={orgId}>{children}</AppLayout>;
}