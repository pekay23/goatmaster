import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_jwt')?.value;
  const payload = token ? await verifyToken(token) : null;
  
  if (!payload) redirect('/admin-login');
  if (!['admin', 'super_admin', 'support', 'billing'].includes(String(payload.role)) || payload.type === 'impersonation') redirect('/unauthorized');

  return children;
}