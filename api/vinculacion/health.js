import {json} from '../../lib/auth.js';

// Prueba de despliegue. No devuelve secretos ni información privada.
export function GET() {
  return json({ok:true,servicio:'portal-vinculacion',plataforma:'vercel'});
}
