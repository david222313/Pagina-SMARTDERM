# 🚀 SmartDerm v3 – Guía de Despliegue Completa

## Índice
1. [Supabase – Base de datos y autenticación](#supabase)
2. [Backend Proxy – Render.com](#backend)
3. [Frontend – Netlify (gratis)](#frontend)
4. [APIs Gratuitas integradas](#apis)
5. [Checklist final](#checklist)

---

## 1. SUPABASE – Base de datos y autenticación {#supabase}

### Paso 1: Crear proyecto
1. Ve a **https://supabase.com** → "Start your project" → crea cuenta gratis
2. Click "New project" → nombre: `smartderm` → elige una región (South America)
3. Guarda la contraseña de la DB en algún lugar seguro
4. Espera 2-3 minutos a que el proyecto se aprovisione

### Paso 2: Ejecutar el esquema SQL
1. En el panel de Supabase → **SQL Editor** → "New query"
2. Pega el contenido completo de `supabase_schema.sql`
3. Click "Run" (▶) → deberías ver: `✅ Esquema SmartDerm creado correctamente`

### Paso 3: Obtener credenciales
1. **Project Settings** (ícono ⚙️) → **API**
2. Copia:
   - **Project URL**: `https://sqdgojqvheqlmodzzvgv.supabase.co/rest/v1/`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Pégalos en `script.js`:
   ```javascript
   const SUPABASE_URL  = 'https://xxxxxxxxxxxx.supabase.co';
   const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

### Paso 4: Crear usuario admin inicial
1. En Supabase → **Authentication** → **Users** → "Add user"
2. Email: `admin@smartderm.co` | Password: `Admin2025!`
3. Luego en **SQL Editor**, ejecuta:
   ```sql
   UPDATE public.perfiles
   SET rol = 'admin'
   WHERE email = 'admin@smartderm.co';
   ```

### Paso 5: Habilitar Google OAuth (opcional)
1. **Authentication** → **Providers** → Google → Enable
2. Necesitas crear OAuth credentials en Google Cloud Console
3. Redirect URL: `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`

---

## 2. BACKEND PROXY – Render.com {#backend}

### Por qué es necesario
La API key de Claude NO puede vivir en el frontend (JavaScript en el navegador).
Cualquiera puede verla con F12. El proxy la mantiene en el servidor.

### Paso 1: Preparar el repositorio
Sube la carpeta `backend/` a un repositorio de GitHub:
```
backend/
  server.js
  package.json
```

### Paso 2: Desplegar en Render
1. Ve a **https://render.com** → "New" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `smartderm-proxy`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Paso 3: Variables de entorno en Render
En tu servicio → "Environment" → Add variables:

| Variable         | Valor                        | Dónde obtenerla |
|------------------|------------------------------|-----------------|
| `CLAUDE_API_KEY` | `sk-ant-api03-...`           | console.anthropic.com |
| `OPENUV_API_KEY` | `tu_key_aqui`               | openuv.io (gratis 50/día) |
| `NEWS_API_KEY`   | `tu_key_aqui`               | newsapi.org (gratis 100/día) |
| `ALLOWED_ORIGIN` | `https://smartderm.netlify.app` | tu URL de Netlify |

### Paso 4: Actualizar script.js
```javascript
const API_PROXY_URL = 'https://smartderm-proxy.onrender.com';
```

> ⚠️ **Nota Render Free**: el servicio gratuito duerme tras 15 min de inactividad.
> La primera petición tarda ~30s en despertar. Para producción usa el plan Starter ($7/mes).

---

## 3. FRONTEND – Netlify {#frontend}

### Opción A: Netlify (recomendado, gratis)
1. Ve a **https://netlify.com** → "Add new site" → "Deploy manually"
2. Arrastra la carpeta `smartderm_v3/` (sin la carpeta `backend/`)
3. Tu sitio queda en `https://nombre-aleatorio.netlify.app`
4. Puedes conectar un dominio propio gratis con Netlify

### Opción B: GitHub Pages (gratis)
1. Sube los archivos a un repositorio GitHub
2. Settings → Pages → Source: main branch
3. URL: `https://tuusuario.github.io/smartderm/`

### ⚠️ Recuerda añadir el CDN de Supabase en todos los HTML
En el `<head>` de cada `.html`, ANTES de cargar `script.js`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 4. APIs GRATUITAS INTEGRADAS {#apis}

### ✅ Sin registro (100% gratis, sin key)

| API | Uso en SmartDerm | Límite | Documentación |
|-----|-----------------|--------|---------------|
| **PubMed E-utilities** (NCBI) | Artículos científicos por curso | Sin límite formal | https://www.ncbi.nlm.nih.gov/books/NBK25497/ |
| **Open Beauty Facts** | Info de ingredientes cosméticos | Sin límite | https://world.openbeautyfacts.org/data |
| **Wikipedia REST API** | Descripciones de enfermedades | Sin límite | https://en.wikipedia.org/api/rest_v1/ |
| **Unsplash Source** | Imágenes de placeholder para cursos | Sin límite | https://source.unsplash.com/600x400/?skincare |

**Cómo usar Wikipedia en el frontend (directo, sin proxy):**
```javascript
async function getWikiInfo(termino) {
    const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termino)}`;
    const r   = await fetch(url);
    const d   = await r.json();
    return { titulo: d.title, resumen: d.extract, imagen: d.thumbnail?.source };
}
// Ejemplo: getWikiInfo('Psoriasis') → info en español
```

---

### 🔑 Con registro gratuito (key necesaria)

| API | Uso | Plan gratis | Registro |
|-----|-----|-------------|---------|
| **OpenUV** | Índice UV en tiempo real | 50 peticiones/día | https://www.openuv.io |
| **NewsAPI** | Noticias de dermatología | 100 peticiones/día | https://newsapi.org |
| **WeatherAPI** | Clima + índice UV alternativo | 1M peticiones/mes | https://www.weatherapi.com |
| **IPinfo** | Geolocalización por IP (para UV sin permiso) | 50K/mes | https://ipinfo.io |
| **Cloudinary** | Fotos de perfil de usuarios | 25GB almacenamiento | https://cloudinary.com |
| **Resend** | Emails transaccionales (bienvenida, certificados) | 3000 emails/mes | https://resend.com |
| **INCIDecoder API** | Análisis de ingredientes INCI | Freemium | https://incidecoder.com |

---

### 🌟 APIs recomendadas para SmartDerm (detalles de integración)

#### OpenUV – Índice UV (ya integrado en el proxy)
```
GET https://api.openuv.io/api/v1/uv?lat=4.71&lng=-74.07
Headers: x-access-token: TU_KEY
```
Respuesta útil: `result.uv`, `result.uv_max`, `result.uv_time`

#### NewsAPI – Noticias (ya integrado en el proxy)
```
GET https://newsapi.org/v2/everything?q=dermatolog%C3%ADa&language=es&pageSize=5&apiKey=TU_KEY
```

#### Cloudinary – Fotos de perfil
```javascript
// En perfil.html, reemplazar la lógica de dataURL por:
async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'smartderm_profiles'); // crear en Cloudinary settings
    const r = await fetch('https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload', {
        method: 'POST', body: formData
    });
    const d = await r.json();
    return d.secure_url; // guardar esta URL en Supabase perfiles.avatar_url
}
```

#### Resend – Email de bienvenida
Instala en el backend: `npm install resend`
```javascript
// En server.js, nueva ruta POST /api/send-welcome
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/send-welcome', async (req, res) => {
    const { email, nombre } = req.body;
    await resend.emails.send({
        from: 'SmartDerm <noreply@smartderm.co>',
        to:   email,
        subject: '¡Bienvenido/a a SmartDerm! 🌿',
        html: `<h1>Hola, ${nombre}!</h1><p>Tu cuenta en SmartDerm ha sido creada.</p>`
    });
    res.json({ ok: true });
});
```

---

## 5. CHECKLIST FINAL {#checklist}

### Antes de lanzar
- [ ] `SUPABASE_URL` y `SUPABASE_ANON` configurados en `script.js`
- [ ] `API_PROXY_URL` apunta al backend en Render
- [ ] SQL ejecutado en Supabase sin errores
- [ ] Usuario admin creado y con `rol = 'admin'` en tabla `perfiles`
- [ ] CDN de Supabase añadido en todos los HTML (antes de script.js)
- [ ] Variables de entorno configuradas en Render
- [ ] `ALLOWED_ORIGIN` en Render apunta exactamente a tu URL de Netlify
- [ ] Probado: registro, login, inscripción a curso, completar lección
- [ ] Google OAuth configurado (si lo quieres activar)
- [ ] Cloudinary configurado para fotos de perfil (si lo activas)

### Orden de pruebas recomendado
1. Registrar usuario estudiante → confirmar email
2. Login con estudiante → ver `mis-cursos.html` vacío
3. Ir a catálogo → inscribirse en curso 1
4. Ir a `curso-detalle.html?id=1` → completar 3 lecciones
5. Verificar progreso en `mis-cursos.html`
6. Login como admin → verificar estadísticas en dashboard
7. Crear curso nuevo desde admin → verificar que aparece en catálogo
8. Probar DermBot → debe responder (modo demo o con proxy)
9. Probar widget UV en `mis-cursos.html` o `index.html`

---

## Costos estimados (todo en producción real)

| Servicio | Plan gratuito | Plan de pago |
|----------|--------------|-------------|
| Supabase | 500MB DB, 2 proyectos | Pro: $25/mes |
| Render   | 750h/mes (duerme) | Starter: $7/mes (siempre activo) |
| Netlify  | 100GB bandwidth | Pro: $19/mes |
| Cloudinary | 25GB | Plus: $89/mes |
| **Total mínimo** | **$0** (con limitaciones) | **~$50/mes** (producción seria) |

---

*Generado para SmartDerm v3.0 – Mayo 2025*
