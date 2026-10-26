import { verifyToken } from './auth.js';
const all = ['overview:read', 'organizations:read', 'organizations:write', 'users:read', 'users:write', 'audit:read', 'billing:read', 'billing:write', 'tiers:read', 'tiers:write', 'support:impersonate', 'session:self'];
const grants = { admin: all, super_admin: all, support: ['overview:read', 'organizations:read', 'users:read', 'audit:read', 'session:self'], billing: ['overview:read', 'organizations:read', 'billing:read', 'billing:write', 'tiers:read', 'session:self'] };
export function adminPermissions(user) { return user && user.type !== 'impersonation' ? grants[user.role] ?? [] : []; }
export function hasAdminPermission(user, capability) { return adminPermissions(user).includes(capability); }
export async function getAdminUser(request) { const token = request.cookies?.get?.('admin_jwt')?.value; return token ? verifyToken(token) : null; }
export async function getAdminActor(request, capability) { const user = await getAdminUser(request); return hasAdminPermission(user, capability) ? user : null; }
export function permissionForAdminPath(path, method) {
  const read = ['GET', 'HEAD'].includes(method);
  if (path.startsWith('/api/admin/auth/')) return 'session:self';
  if (path.includes('/impersonate')) return 'support:impersonate';
  if (path.startsWith('/api/admin/billing') || path.startsWith('/admin/billing')) return read ? 'billing:read' : 'billing:write';
  if (path.startsWith('/api/admin/tiers') || path.startsWith('/admin/tiers')) return read ? 'tiers:read' : 'tiers:write';
  if (path.startsWith('/api/admin/users') || path.startsWith('/admin/users')) return read ? 'users:read' : 'users:write';
  if (path.startsWith('/api/admin/organizations/') && path.endsWith('/tier') && !read) return 'billing:write';
  if (path.startsWith('/api/admin/organizations') || path.startsWith('/admin/organizations')) return read ? 'organizations:read' : 'organizations:write';
  if (path.startsWith('/api/admin/audit-logs') || path.startsWith('/admin/audit-logs')) return 'audit:read';
  return 'overview:read';
}
