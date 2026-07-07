import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
const key = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getAuthUser(request) {
  const token = request.cookies.get('jwt')?.value;
  if (!token) return null;
  return await verifyToken(token);
}
