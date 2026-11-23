# Portal de Vinculación | Vercel + GitHub + n8n

Proyecto COMPLETO para un **repositorio nuevo**, sin código de Cloudflare. Conserva interfaz, login, consulta de estudiantes, expedientes, estadísticas y generación PDF directamente en el navegador.

## Por qué hubo conflicto

El archivo antiguo `functions/api/vinculacion/data.js` pertenecía a Cloudflare Pages. **Vercel no utiliza esa ruta**: aquí la API se encuentra en `api/vinculacion/`. El conflicto «File does not exist on main» ocurre cuando intentas fusionar un cambio antiguo con una rama que ya no contiene ese archivo. No resuelvas ese merge añadiendo el archivo de Cloudflare: abandona ese merge y usa este paquete en un repositorio nuevo.

## Publicar 100% en línea

1. GitHub -> **New repository**. Nombre sugerido: `tecnm-vinculacion-vercel-limpio`. No inicialices con README ni .gitignore.
2. Descomprime el ZIP y en GitHub -> **uploading an existing file** arrastra **todo el contenido** (incluidas carpetas `api` y `lib`) a la raíz. `index.html` y `package.json` deben quedar visibles en la raíz. Confirma **Commit changes** en `main`.
3. Vercel -> https://vercel.com/new -> **Import Git Repository** -> elige el repositorio nuevo. **Framework Preset: Other**. **Root Directory: `./`**. No configures Build Command ni Output Directory. Importa y despliega.
4. Vercel -> Project -> Settings -> Environment Variables: agrega en **Production**:
   - `ADMIN_PASSWORD`: contraseña nueva de 12+ caracteres.
   - `ADMIN_SESSION_SECRET`: secreto aleatorio nuevo de 32+ caracteres (diferente de la contraseña).
   - `N8N_WEBHOOK_KEY`: nueva clave aleatoria de al menos 20 caracteres; debe ser exactamente igual al valor de la credencial Header Auth de n8n.
   Importante: la clave anterior quedó expuesta. Rótala. **Nunca subas secretos a GitHub**.
5. **Redeploy** en Vercel después de agregar secretos; selecciona el despliegue de **Production**.
6. En n8n, el WF-05 debe estar publicado, usando `GET`, path `ss-vinculacion-panel`, Authentication `Header Auth` con **Name** `X-Automation-Key` y **Value** el mismo secreto de `N8N_WEBHOOK_KEY`. En el nodo Code los nombres esperados son `Leer estudiantes`, `Leer expedientes` y `Leer documentos`.

## Pruebas, una por una

- `https://TU-DOMINIO.vercel.app/api/vinculacion/health`: **debe mostrar** `{"ok":true,"servicio":"portal-vinculacion","plataforma":"vercel"}`. No requiere contraseña ni n8n. Si sale 404 o HTML, revisa estructura de `api/` y qué repo importa Vercel.
- `https://TU-DOMINIO.vercel.app/api/vinculacion/login` (GET): **debe mostrar** `{"ok":false,"error":"Usa POST."}`. No introduzcas contraseña en la URL.
- Abre el sitio, inicia sesión como `vinculacion` usando `ADMIN_PASSWORD`.
- En el **mismo dominio**, visita `/api/vinculacion/session`: debe mostrar `ok:true` tras iniciar sesión.
- En el **mismo dominio**, visita `/api/vinculacion/data`: debe devolver `ok:true` y tres listas, o un error JSON específico. Si falla consulta en Vercel **Logs**, que no registra las claves.
- En **Reportes**, el botón PDF genera el archivo localmente desde JavaScript, sin workflow extra.

## Estructura correcta

```
index.html
styles.css
app.js
pdf.js
package.json
.gitignore
README.md
api/vinculacion/health.js
api/vinculacion/login.js
api/vinculacion/logout.js
api/vinculacion/session.js
api/vinculacion/data.js
lib/auth.js
```

No agregues `functions/`: esa carpeta es de Cloudflare Pages.

## Seguridad y datos

Esta aplicación es un prototipo académico. Para expedientes reales necesitarás controles adicionales (MFA, limitación de intentos, auditoría y permisos institucionales). El repositorio puede ser público **solo si no contiene datos privados ni secretos**. El servidor consulta n8n; no hagas llamadas con el secreto desde frontend.

La API deduplica registros por identificador. Revisa los datos de origen de Sheets antes de emitir reportes oficiales. La interfaz convierte créditos 0.76 a 76 % cuando corresponde.
