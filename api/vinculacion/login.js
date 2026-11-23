import { json,configured,validatePassword,sameOrigin,createSession,sessionCookie } from '../../lib/auth.js';
export async function POST(request) {
  if (!configured()) return json({ok:false,error:'Configura ADMIN_PASSWORD y ADMIN_SESSION_SECRET en Vercel (Production).'},503);
  if (!sameOrigin(request)) return json({ok:false,error:'Origen no permitido.'},403);
  if (!(request.headers.get('content-type')||'').includes('application/json')) return json({ok:false,error:'Se requiere JSON.'},415);
  let body;
  try { body=await request.text(); if(body.length>2048) return json({ok:false,error:'Solicitud demasiado grande.'},413); body=JSON.parse(body); }
  catch { return json({ok:false,error:'Solicitud inválida.'},400); }
  const user=String(body?.usuario??'').trim().toLowerCase();
  const pass=String(body?.password??'');
  if (pass.length>256 || user!=='vinculacion' || !validatePassword(pass)) return json({ok:false,error:'Usuario o contraseña incorrectos.'},401);
  return json({ok:true,usuario:'vinculacion'},200,{'Set-Cookie':sessionCookie(createSession())});
}
export function GET() { return json({ok:false,error:'Usa POST.'},405); }
