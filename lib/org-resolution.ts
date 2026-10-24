import { query } from './db';

export type Tier = 'free' | 'basic' | 'pro';

export function resolveOrgSlug(hostname: string): string | null {
  // tenant.app.goatmaster.com -> tenant; app.goatmaster.com -> null
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  if (parts.length >= 3 && parts[1] === 'app') return parts[0];
  if (parts.length >= 3 && parts[0] !== 'app' && parts[0] !== 'admin' && parts[0] !== 'www') return parts[0];
  return null;
}

export async function resolveOrgBySlug(slug: string): Promise<{ id: string; tier: Tier } | null> {
  const res = await query('SELECT id, tier FROM organizations WHERE slug = $1', [slug]);
  if (res.rows.length === 0) return null;
  return { id: res.rows[0].id, tier: res.rows[0].tier as Tier };
}

export async function resolveOrgTier(orgId: string): Promise<Tier> {
  const res = await query('SELECT tier FROM organizations WHERE id = $1', [orgId]);
  if (res.rows.length === 0) return 'free';
  return (res.rows[0].tier as Tier) || 'free';
}
