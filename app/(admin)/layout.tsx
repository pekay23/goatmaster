import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;
  const payload = token ? await verifyToken(token) : null;
  
  if (!payload) redirect('/login');
  if (payload.role !== 'admin' && payload.role !== 'super_admin') redirect('/unauthorized');

  return children;
}