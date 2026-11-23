import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const DURATION = 8 * 60 * 60 * 1000;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY'
};
export function json(body, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(body), {status, headers: {...headers,...additionalHeaders}});
}
export function configured() {
  return typeof process.env.ADMIN_PASSWORD === 'string' && process.env.ADMIN_PASSWORD.length >= 12 &&
    typeof process.env.ADMIN_SESSION_SECRET === 'string' && process.env.ADMIN_SESSION_SECRET.length >= 32;
}
function sameBytes(a,b) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a,b);
}
export function validatePassword(pass) {
  const input = createHash('sha256').update(String(pass)).digest();
  const stored = createHash('sha256').update(process.env.ADMIN_PASSWORD ?? '').digest();
  return sameBytes(input,stored);
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const u = new URL(request.url);
  try { return new URL(origin).host === u.host && new URL(origin).protocol === u.protocol; }
  catch { return false; }
}
function sign(data) { return createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(data).digest('base64url'); }
export function createSession() {
  const now = Date.now();
  const data = Buffer.from(JSON.stringify({sub:'vinculacion',iat:now,exp:now+DURATION})).toString('base64url');
  return `${data}.${sign(data)}`;
}
export function isAdmin(request) {
  if (!configured()) return false;
  const cookies = request.headers.get('cookie') || '';
  const token = cookies.split(';').map(x=>x.trim()).find(x=>x.startsWith('ss_admin='))?.slice(9);
  if (!token || token.length > 1000) return false;
  const parts = token.split('.');
  if (parts.length!==2 || !parts[0] || !parts[1]) return false;
  try {
    const expected = Buffer.from(sign(parts[0]),'base64url');
    const actual = Buffer.from(parts[1],'base64url');
    if (!sameBytes(expected, actual)) return false;
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return payload.sub === 'vinculacion' && Number.isFinite(payload.iat) && Number.isFinite(payload.exp) &&
      payload.exp > Date.now() && payload.iat <= Date.now()+60000 && payload.exp-payload.iat === DURATION;
  } catch { return false; }
}
export function sessionCookie(token) { return `ss_admin=${token}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`; }
export function clearCookie() { return 'ss_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'; }
