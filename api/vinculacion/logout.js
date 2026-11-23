import {json,sameOrigin,clearCookie} from '../../lib/auth.js';
export function POST(request) {
  if (!sameOrigin(request)) return json({ok:false,error:'Origen no permitido.'},403);
  return json({ok:true},200,{'Set-Cookie':clearCookie()});
}
