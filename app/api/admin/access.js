export { getAdminActor } from '@/lib/admin-auth';
export const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function pagination(searchParams, defaultLimit = 20) {
  const page = Math.min(100000, Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1));
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}
export function organizationInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const domain = typeof body.custom_domain === 'string' ? body.custom_domain.trim().toLowerCase() : null;
  if (!name || name.length > 100) return { error: 'Organization name must contain 1 to 100 characters' };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(slug)) return { error: 'Use a slug of up to 80 lowercase letters, numbers, and hyphens' };
  if (domain && (!new RegExp('^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,63}$').test(domain) || domain.length > 253)) return { error: 'Enter a hostname without a protocol or path' };
  return { name, slug, custom_domain: domain || null };
}
