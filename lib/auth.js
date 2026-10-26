import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { query, runWithDbContext } from './db.js';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET environment variable is required');
const key = new TextEncoder().encode(secret);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const hashPassword = password => bcrypt.hash(password, 12);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export async function signToken(payload) {
  return new SignJWT({ ...payload, sessionVersion: payload.sessionVersion ?? 0 })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
    .setExpirationTime(payload.type === 'impersonation' ? '1h' : '7d').sign(key);
}

/** @typedef {{ sub: string, email: string, username: string, role: 'user'|'admin'|'super_admin'|'support'|'billing', orgId?: string, sessionVersion: number, type?: 'impersonation', impersonatedBy?: string, membershipRole?: string }} AuthUser */
/** @returns {Promise<AuthUser | null>} */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || !uuid.test(payload.sub)) return null;
    return await runWithDbContext({ role: 'service' }, async () => {
      const { rows } = await query(
        'SELECT id, email, username, role, organization_id, auth_version FROM users WHERE id = $1', [payload.sub]
      );
      const user = rows[0];
      if (!user || !['user', 'admin', 'super_admin', 'support', 'billing'].includes(user.role) || (payload.sessionVersion ?? 0) !== user.auth_version || payload.role !== user.role) return null;
      const orgId = typeof payload.orgId === 'string' && uuid.test(payload.orgId) ? payload.orgId : undefined;
      let membershipRole;
      if (payload.type === 'impersonation') {
        if (!['admin', 'super_admin'].includes(user.role) || payload.impersonatedBy !== user.id || typeof orgId !== 'string' || !uuid.test(orgId)) return null;
        const session = await query(
          'SELECT id FROM impersonation_sessions WHERE admin_id = $1 AND organization_id = $2 AND token_hash = $3 AND revoked_at IS NULL AND expires_at > NOW()',
          [user.id, orgId, hashToken(token)]
        );
        if (!session.rowCount) return null;
      } else if (orgId) {
        if (orgId !== user.organization_id) return null;
        const membership = await query(
          "SELECT user_id, role FROM organization_members WHERE user_id = $1 AND organization_id = $2 AND status = 'active'", [user.id, orgId]
        );
        if (!membership.rowCount) return null;
        membershipRole = membership.rows[0].role;
      } else if (user.organization_id) return null;
      return { sub: user.id, email: user.email, username: user.username, role: user.role, orgId, sessionVersion: user.auth_version, membershipRole, ...(payload.type === 'impersonation' ? { type: 'impersonation', impersonatedBy: user.id } : {}) };
    });
  } catch (error) { if (!(error && typeof error === 'object' && 'code' in error && String(error.code).startsWith('ERR_J'))) console.error('Session verification failed:',error instanceof Error?error.message:'Unknown failure'); return null; }
}

export async function getAuthUser(request) {
  let token;
  if (request.cookies?.get) token = request.cookies.get('jwt')?.value;
  else token = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith('jwt='))?.slice(4);
  return token ? verifyToken(token) : null;
}
