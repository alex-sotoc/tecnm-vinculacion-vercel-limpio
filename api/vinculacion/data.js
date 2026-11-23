import {json,isAdmin} from '../../lib/auth.js';
const WF05_URL='https://servicio-social.app.n8n.cloud/webhook/ss-vinculacion-panel';
export async function GET(request) {
  if(!isAdmin(request)) return json({ok:false,error:'Inicia sesión para consultar las estadísticas.'},401);
  const secret=process.env.N8N_WEBHOOK_KEY;
  if(!secret || secret.length<20) return json({ok:false,error:'Falta N8N_WEBHOOK_KEY en Vercel Production.',codigo:'MISSING_KEY'},503);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  try {
    const upstream=await fetch(WF05_URL,{
      method:'GET',headers:{'X-Automation-Key':secret,'Accept':'application/json'},signal:controller.signal,redirect:'error',cache:'no-store'
    });
    if(!upstream.ok) {
      console.error('WF05_STATUS',upstream.status);
      return json({ok:false,error:`n8n respondió HTTP ${upstream.status}. Revisa Header Auth y el workflow publicado.`,codigo:'N8N_HTTP'},502);
    }
    const body=await upstream.text();
    if(body.length>8_000_000) return json({ok:false,error:'La respuesta de n8n supera el límite permitido.'},502);
    let payload;
    try {payload=JSON.parse(body);} catch {return json({ok:false,error:'n8n no devolvió un JSON válido.',codigo:'INVALID_JSON'},502);}
    if(payload?.ok!==true||!Array.isArray(payload.estudiantes)||!Array.isArray(payload.expedientes)||!Array.isArray(payload.documentos))
      return json({ok:false,error:'n8n devolvió un formato inesperado.',codigo:'INVALID_SHAPE'},502);
    const unique = (list, key) => [...new Map(list.filter(r=>r && r[key]!=null).map(r=>[String(r[key]),r])).values()];
    return json({ok:true,fetched_at:payload.fetched_at||new Date().toISOString(),
      estudiantes:unique(payload.estudiantes,'control'),
      expedientes:unique(payload.expedientes,'expediente_id'),
      documentos:unique(payload.documentos,'documento_id')});
  } catch(error) {
    console.error('WF05_FETCH_ERROR',error?.name,error?.message);
    return json({ok:false,error:error?.name==='AbortError'?'n8n no respondió dentro del tiempo permitido.':'No se pudo consultar n8n desde Vercel.',codigo:'FETCH_FAILED'},502);
  } finally {clearTimeout(timer);}
}
