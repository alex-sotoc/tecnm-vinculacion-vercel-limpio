import {json,isAdmin} from '../../lib/auth.js';
export function GET(request) {
  const ok = isAdmin(request);
  return json({ok,usuario:ok?'vinculacion':null},ok?200:401);
}
