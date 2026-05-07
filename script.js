// ══════════════════════════════════════════════════════════════════
//  SmartDerm – script.js  v3.0  (Supabase Edition)
//  Reemplaza todo el sistema localStorage de usuarios por Supabase Auth
//
//  SETUP: antes de usar, configura tus credenciales de Supabase:
//  1. Ve a tu proyecto Supabase → Project Settings → API
//  2. Copia Project URL y anon key
//  3. Pégalos en las constantes de abajo
// ══════════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN SUPABASE ─────────────────────────────────────────
const SUPABASE_URL    = 'https://sqdgojqvheqlmodzzvgv.supabase.co/rest/v1/';   // ← cambia esto
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZGdvanF2aGVxbG1vZHp6dmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDg2OTksImV4cCI6MjA5MzY4NDY5OX0.80qcTP6Dsdi8aB9VQE9oyZh5_BnVpkoeH_xUmEQiV8U';                  // ← cambia esto

// URL de tu backend proxy (Render o Railway)
// En desarrollo local usa: 'http://localhost:3000'
const API_PROXY_URL   = 'https://smartderm-proxy.onrender.com'; // ← cambia esto

// ── CLIENTE SUPABASE (CDN, sin npm) ───────────────────────────────
// Asegúrate de incluir en el <head> de cada HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const { createClient } = window.supabase || supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let currentUser    = null;   // { id, email, nombre, rol }
let userCourses    = {};     // { curso_id: { progreso, completado } }
let CURSOS_INFO    = {};     // se carga desde Supabase
let currentPreviewCourse = null;
let currentEvalCourse    = null;

// ── INICIALIZACIÓN ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    await initSession();
    await loadCursos();
    actualizarNavbar();

    const path = window.location.pathname;
    if (path.endsWith('mis-cursos.html'))        await initMisCursos();
    if (path.endsWith('cursos-disponibles.html')) await renderCatalogoPublico();
    if (path.endsWith('index.html') || path === '/') renderDestacados();

    // Escuchar cambios de sesión (login/logout en otras pestañas)
    db.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN')  { await initSession(); actualizarNavbar(); }
        if (event === 'SIGNED_OUT') { currentUser = null; userCourses = {}; actualizarNavbar(); }
    });
});

// ── SESIÓN ────────────────────────────────────────────────────────
async function initSession() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { currentUser = null; return; }

    const { data: perfil } = await db
        .from('perfiles')
        .select('id, nombre, email, rol, avatar_url')
        .eq('id', session.user.id)
        .single();

    if (perfil) {
        currentUser = perfil;
        await loadUserCourses();
    }
}

async function loadUserCourses() {
    if (!currentUser) return;
    const { data } = await db
        .from('inscripciones')
        .select('curso_id, progreso, completado')
        .eq('usuario_id', currentUser.id);

    userCourses = {};
    (data || []).forEach(i => {
        userCourses[i.curso_id] = { progress: i.progreso, completed: i.completado };
    });
}

async function loadCursos() {
    const { data } = await db
        .from('cursos')
        .select('*')
        .eq('activo', true)
        .order('id');

    CURSOS_INFO = {};
    (data || []).forEach(c => {
        CURSOS_INFO[c.id] = {
            nombre:      c.nombre,
            descripcion: c.descripcion,
            nivel:       c.nivel,
            instructor:  c.instructor,
            duracion:    c.duracion,
            img:         c.imagen_url,
            videoId:     c.video_intro_id,
            sinCertificacion: c.sin_cert
        };
    });
}

// ── AUTH – REGISTRO ───────────────────────────────────────────────
function getMinPasswordLength() {
    // Se puede extender para leer de config_plataforma en Supabase
    return 6;
}

async function register() {
    const nombre = document.getElementById('name').value.trim();
    const email  = document.getElementById('regEmail').value.trim();
    const pass   = document.getElementById('regPassword').value;
    const rol    = document.getElementById('regRole').value;

    if (!nombre)            { alert('Por favor ingresa tu nombre.'); return; }
    if (!isValidEmail(email)) { alert('Email inválido.'); return; }
    if (pass.length < getMinPasswordLength()) {
        alert(`La contraseña debe tener al menos ${getMinPasswordLength()} caracteres.`); return;
    }

    const { data, error } = await db.auth.signUp({
        email, password: pass,
        options: { data: { nombre, rol } }
    });

    if (error) { alert('Error al registrar: ' + error.message); return; }

    alert('✅ ¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
    toggleRegister();
}

// ── AUTH – LOGIN ──────────────────────────────────────────────────
const _loginAttempts = {};
async function login() {
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('password').value;

    if (!isValidEmail(email)) { alert('Email inválido.'); return; }
    if (!pass)                { alert('Ingresa tu contraseña.'); return; }

    // Bloqueo local de intentos (Supabase también bloquea en servidor)
    const e = _loginAttempts[email];
    if (e && e.count >= 5 && (Date.now() - e.ts) < 300000) {
        alert('Cuenta bloqueada temporalmente. Espera 5 minutos.');
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

    if (error) {
        if (!_loginAttempts[email]) _loginAttempts[email] = { count:0, ts: Date.now() };
        _loginAttempts[email].count++;
        _loginAttempts[email].ts = Date.now();
        alert('Credenciales incorrectas.');
        return;
    }

    delete _loginAttempts[email];
    await initSession();
    actualizarNavbar();

    // Redirigir según rol
    const rol = currentUser?.rol;
    if (rol === 'admin') {
        window.location.href = 'admin.html';
    } else if (rol === 'docente') {
        window.location.href = 'perfil.html';
    } else {
        window.location.href = 'mis-cursos.html';
    }
}

// ── AUTH – GOOGLE OAuth ───────────────────────────────────────────
async function loginWithGoogle() {
    const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/mis-cursos.html' }
    });
    if (error) alert('Error con Google: ' + error.message);
}

// ── AUTH – LOGOUT ─────────────────────────────────────────────────
async function logout() {
    await db.auth.signOut();
    currentUser = null;
    userCourses = {};
    window.location.href = 'index.html';
}

// ── AUTH – MODALES ────────────────────────────────────────────────
function showLogin() {
    document.getElementById('auth').style.display = 'flex';
    document.getElementById('loginForm').style.display    = 'block';
    document.getElementById('registerForm').style.display = 'none';
}
function toggleRegister() {
    const lf = document.getElementById('loginForm');
    const rf = document.getElementById('registerForm');
    const show = rf.style.display === 'none';
    lf.style.display = show ? 'none'  : 'block';
    rf.style.display = show ? 'block' : 'none';
}

// ── NAVBAR ────────────────────────────────────────────────────────
function actualizarNavbar() {
    const btnLoginNav  = document.getElementById('btn-login-nav');
    const userNavInfo  = document.getElementById('nav-user-info-nav');
    const userNameNav  = document.getElementById('nav-user-name-nav');
    const adminLink    = document.getElementById('nav-admin-link');
    // Index/showcase elements
    const btnLogin     = document.getElementById('btn-login');
    const navUserInfo  = document.getElementById('nav-user-info');
    const navUserName  = document.getElementById('nav-user-name');

    if (currentUser) {
        if (btnLogin)    btnLogin.style.display    = 'none';
        if (navUserInfo) { navUserInfo.style.display = 'inline-flex'; if (navUserName) navUserName.textContent = currentUser.nombre; }
        if (btnLoginNav) btnLoginNav.style.display  = 'none';
        if (userNavInfo) {
            userNavInfo.style.display = 'flex';
            if (userNameNav) userNameNav.textContent = currentUser.nombre;
            if (adminLink)   adminLink.style.display = currentUser.rol === 'admin' ? 'list-item' : 'none';
        }
    } else {
        if (btnLogin)    btnLogin.style.display    = 'inline-block';
        if (navUserInfo) navUserInfo.style.display = 'none';
        if (btnLoginNav) btnLoginNav.style.display = 'list-item';
        if (userNavInfo) userNavInfo.style.display = 'none';
    }
}

// ── INSCRIPCIÓN ───────────────────────────────────────────────────
async function enrollCourse(cursoId) {
    if (!currentUser) { alert('Debes iniciar sesión primero.'); showLogin(); return; }

    if (userCourses[cursoId]) { alert('Ya estás inscrito en este curso.'); return; }

    const { error } = await db.from('inscripciones').insert({
        usuario_id: currentUser.id,
        curso_id:   parseInt(cursoId),
        progreso:   0,
        completado: false
    });

    if (error) { alert('Error al inscribirse: ' + error.message); return; }

    userCourses[cursoId] = { progress: 0, completed: false };
    const ir = confirm('¡Te has inscrito al curso! ¿Ir a Mis Cursos ahora?');
    if (ir) window.location.href = 'mis-cursos.html';
}

// ── MODAL PREVIEW ─────────────────────────────────────────────────
async function showCoursePreview(cursoId) {
    const curso = CURSOS_INFO[cursoId];
    if (!curso) return;
    currentPreviewCourse = cursoId;

    document.getElementById('preview-title').textContent       = curso.nombre;
    document.getElementById('preview-duracion').textContent    = curso.duracion;
    document.getElementById('preview-nivel').textContent       = curso.nivel;
    document.getElementById('preview-instructor').textContent  = curso.instructor;
    document.getElementById('preview-description').textContent = curso.descripcion;

    // Video
    const vw = document.getElementById('preview-video-wrapper');
    vw.innerHTML = curso.videoId
        ? `<iframe src="https://www.youtube.com/embed/${curso.videoId}?rel=0&modestbranding=1" title="${curso.nombre}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        : `<div class="video-placeholder"><div class="play-icon">▶</div><p>Video próximamente</p></div>`;

    // Temario desde Supabase
    const { data: lecciones } = await db
        .from('lecciones')
        .select('orden, titulo, duracion_min')
        .eq('curso_id', cursoId)
        .order('orden');

    const temarioEl = document.getElementById('preview-temario');
    if (lecciones && lecciones.length > 0) {
        temarioEl.innerHTML = lecciones.map(l =>
            `<li><span class="modulo-num">${String(l.orden).padStart(2,'0')}</span><span>${l.titulo}<em style="color:#999;font-size:12px;margin-left:8px;">(${l.duracion_min} min)</em></span></li>`
        ).join('');
    } else {
        temarioEl.innerHTML = '<li>Contenido próximamente</li>';
    }

    // Progreso
    const progressEl = document.getElementById('preview-progress');
    if (progressEl) {
        const ins = userCourses[cursoId];
        progressEl.innerHTML = ins
            ? `<div style="margin:10px 0;"><p style="color:#00897b;font-weight:bold;margin-bottom:6px;">✅ Inscrito – Progreso: ${ins.progress}%</p><div class="progress-bar-container"><div class="progress-bar" style="width:${ins.progress}%">${ins.progress}%</div></div></div>`
            : '';
    }

    // Botón
    const btn = document.querySelector('.btn-inscribirse');
    if (btn) {
        if (userCourses[cursoId]) {
            btn.textContent = 'Continuar curso';
            btn.onclick = () => { closePreviewModal(); window.location.href = `curso-detalle.html?id=${cursoId}`; };
        } else {
            btn.textContent = 'Inscribirme al Curso';
            btn.onclick = enrollFromPreview;
        }
    }

    document.getElementById('coursePreviewModal').style.display = 'flex';
}

function closePreviewModal() {
    const modal = document.getElementById('coursePreviewModal');
    if (!modal) return;
    const iframe = modal.querySelector('iframe');
    if (iframe) iframe.src = iframe.src;
    modal.style.display = 'none';
}
function enrollFromPreview() {
    if (currentPreviewCourse) { enrollCourse(currentPreviewCourse); closePreviewModal(); }
}

// ── MIS CURSOS ────────────────────────────────────────────────────
async function initMisCursos() {
    if (!currentUser) { window.location.href = 'index.html'; return; }
    const el = document.getElementById('user-name');
    if (el) el.textContent = currentUser.nombre;
    await renderMisCursos();
}

async function renderMisCursos() {
    const grid = document.getElementById('mis-cursos-grid');
    if (!grid) return;
    await loadUserCourses();

    let html = '';
    for (const id in userCourses) {
        const curso   = CURSOS_INFO[id];
        if (!curso) continue;
        const prog      = userCourses[id].progress  || 0;
        const completed = userCourses[id].completed || false;
        const sinCert   = !!curso.sinCertificacion;

        const evalBtn = !sinCert
            ? `<button onclick="startEval(${id})" ${completed ? 'disabled' : ''} class="btn-eval-curso" style="margin-top:6px;${completed?'opacity:.55;cursor:not-allowed;':''}">
                   ${completed ? '✅ Completado' : 'Realizar evaluación'}
               </button>`
            : `<p style="font-size:12px;color:#888;margin-top:8px;font-style:italic;">ℹ️ Curso libre – sin evaluación</p>`;

        html += `<div class="curso-card" data-curso-id="${id}">
            <img src="${curso.img}" alt="${curso.nombre}" onerror="this.src='https://placehold.co/600x400/e0f2f1/00897b?text=SmartDerm';this.onerror=null;">
            <h3>${curso.nombre}</h3>
            <div class="progress-bar-container"><div class="progress-bar" style="width:${prog}%;">${prog}%</div></div>
            <button class="btn-ver-curso" onclick="window.location.href='curso-detalle.html?id=${id}'">📖 Continuar curso</button>
            <button onclick="showCoursePreview(${id})" style="margin-top:4px;background:none;border:1.5px solid #00b894;color:#00b894;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:13px;">Ver info</button>
            ${evalBtn}
        </div>`;
    }

    if (!html) {
        html = `<div style="text-align:center;padding:40px 20px;color:#777;">
            <p style="font-size:18px;margin-bottom:10px;">📚 Aún no tienes cursos inscritos</p>
            <a href="cursos-disponibles.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#00b894;color:#fff;border-radius:8px;font-weight:bold;">Ver cursos disponibles</a>
        </div>`;
    }
    grid.innerHTML = html;
}

// ── CATÁLOGO PÚBLICO ──────────────────────────────────────────────
async function renderCatalogoPublico() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid || Object.keys(CURSOS_INFO).length === 0) return;

    grid.innerHTML = Object.entries(CURSOS_INFO).map(([id, c]) => `
        <div class="info-card" style="cursor:pointer;" onclick="showCoursePreview(${id})">
            <img src="${c.img}" alt="${c.nombre}" style="width:100%;border-radius:8px;margin-bottom:12px;height:160px;object-fit:cover;" onerror="this.src='https://placehold.co/600x400/e0f2f1/00897b?text=SmartDerm';this.onerror=null;">
            <span class="tag">${c.sinCertificacion ? 'Libre' : '🎓 Con certificado'}</span>
            <h3>${c.nombre}</h3>
            <p>${c.descripcion?.slice(0,100)}...</p>
            <p style="margin-top:8px;font-size:13px;color:#888;"><strong>${c.nivel}</strong> · ${c.duracion} · ${c.instructor}</p>
            <button onclick="event.stopPropagation();enrollCourse(${id})" style="margin-top:12px;width:100%;padding:9px;background:#00b894;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Inscribirme</button>
        </div>`).join('');
}

// ── DESTACADOS (index.html) ───────────────────────────────────────
function renderDestacados() {
    const grid = document.getElementById('destacados-grid');
    if (!grid || Object.keys(CURSOS_INFO).length === 0) return;
    const primeros = Object.entries(CURSOS_INFO).slice(0, 4);
    grid.innerHTML = primeros.map(([id, c]) => `
        <div class="curso-card" onclick="showCoursePreview(${id})" style="cursor:pointer;">
            <img src="${c.img}" alt="${c.nombre}" onerror="this.src='https://placehold.co/600x400/e0f2f1/00897b?text=SmartDerm';this.onerror=null;">
            <h3>${c.nombre}</h3>
            <p style="font-size:13px;color:#777;">${c.nivel} · ${c.duracion}</p>
        </div>`).join('');
}

// ── EVALUACIÓN ────────────────────────────────────────────────────
async function startEval(cursoId) {
    if (!userCourses[cursoId]) { alert('No estás inscrito en este curso.'); return; }
    if (userCourses[cursoId].completed) { alert('Ya completaste este curso. ✅'); return; }
    const curso = CURSOS_INFO[cursoId];
    if (curso?.sinCertificacion) { alert('Este curso no requiere evaluación.'); return; }

    currentEvalCourse = cursoId;

    // Cargar preguntas desde Supabase
    const { data: preguntas } = await db
        .from('evaluaciones')
        .select('*')
        .eq('curso_id', cursoId);

    const evalPreg = preguntas && preguntas.length > 0 ? preguntas : _genPreguntas(cursoId);
    window._evalPreg = evalPreg;

    const titleEl = document.getElementById('eval-title');
    if (titleEl) titleEl.textContent = 'Evaluación: ' + (curso?.nombre || 'Curso');

    const container = document.getElementById('eval-questions-container');
    if (container) {
        container.innerHTML = evalPreg.map((p, i) => `
            <div style="background:#f8f8f8;border-radius:10px;padding:16px 20px;border-left:3px solid #00b894;">
                <p style="font-weight:600;color:#1a1a1a;margin-bottom:12px;">${i+1}. ${p.pregunta || p.pregunta}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${[p.opcion_a||p.opciones?.[0], p.opcion_b||p.opciones?.[1], p.opcion_c||p.opciones?.[2], p.opcion_d||p.opciones?.[3]].map((op, j) => `
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 12px;border-radius:6px;border:1.5px solid #e0e0e0;background:white;">
                            <input type="radio" name="q${i}" value="${j}" style="accent-color:#00b894;">
                            <span style="font-size:14px;color:#333;">${op}</span>
                        </label>`).join('')}
                </div>
            </div>`).join('');
    }
    document.getElementById('evalModal').style.display = 'flex';
}

async function submitEval() {
    const preguntas = window._evalPreg;
    if (!preguntas || !currentEvalCourse) return;
    let correctas = 0, todas = true;
    preguntas.forEach((p, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (!sel) { todas = false; }
        else if (parseInt(sel.value) === (p.respuesta ?? p.respuesta)) correctas++;
    });
    if (!todas) { alert('Por favor responde todas las preguntas.'); return; }

    const pct    = Math.round((correctas / preguntas.length) * 100);
    const umbral = 70;
    if (pct < umbral) {
        alert(`Obtuviste ${correctas}/${preguntas.length} (${pct}%). Necesitas ${umbral}% para aprobar. ¡Inténtalo de nuevo!`);
        return;
    }

    alert(`✅ ¡Aprobado! ${correctas}/${preguntas.length} (${pct}%).`);

    // Guardar resultado en Supabase
    await db.from('resultados_evaluaciones').upsert({
        usuario_id: currentUser.id,
        curso_id:   parseInt(currentEvalCourse),
        puntaje:    pct,
        aprobado:   true,
        ultimo_intento: new Date().toISOString()
    }, { onConflict: 'usuario_id,curso_id' });

    // Actualizar inscripción
    await db.from('inscripciones')
        .update({ progreso: 100, completado: true })
        .eq('usuario_id', currentUser.id)
        .eq('curso_id', parseInt(currentEvalCourse));

    userCourses[currentEvalCourse] = { progress: 100, completed: true };
    closeModal();
    renderMisCursos();
}

function _genPreguntas(cursoId) {
    const c = CURSOS_INFO[cursoId];
    return [
        { pregunta: `¿Cuál es el objetivo principal del curso "${c?.nombre}"?`,
          opcion_a: 'Comprender los fundamentos del tema de manera aplicada',
          opcion_b: 'Ignorar el material y buscar info externa',
          opcion_c: 'Aplicar técnicas no validadas',
          opcion_d: 'Saltarse el contenido', respuesta: 0 }
    ];
}

function closeModal() {
    const m = document.getElementById('evalModal');
    if (m) m.style.display = 'none';
}

// ── WIDGET DE ÍNDICE UV ───────────────────────────────────────────
async function loadUVWidget() {
    const container = document.getElementById('uv-widget');
    if (!container) return;
    container.innerHTML = '<p style="color:#aaa;font-size:13px;">📡 Cargando índice UV...</p>';

    if (!navigator.geolocation) {
        container.innerHTML = '<p style="font-size:13px;color:#aaa;">Geolocalización no disponible en tu navegador.</p>';
        return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
            const r   = await fetch(`${API_PROXY_URL}/api/uv?lat=${lat}&lng=${lng}`);
            const data= await r.json();
            if (!data.ok) throw new Error(data.error);

            const uvColor = data.uv < 3 ? '#4caf50' : data.uv < 6 ? '#ff9800' : data.uv < 8 ? '#ff5722' : '#9c27b0';
            container.innerHTML = `
                <div style="background:white;border-radius:12px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.08);border-left:5px solid ${uvColor};">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <div style="font-size:36px;font-weight:800;color:${uvColor};">${data.uv.toFixed(1)}</div>
                        <div><p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Índice UV actual</p><p style="font-size:13px;font-weight:600;color:#333;">${data.demo ? 'Modo demo' : 'En tu ubicación'}</p></div>
                    </div>
                    <p style="font-size:14px;color:#555;">${data.recommendation}</p>
                </div>`;
        } catch (e) {
            container.innerHTML = '<p style="font-size:13px;color:#aaa;">No se pudo obtener el índice UV.</p>';
        }
    }, () => {
        container.innerHTML = '<p style="font-size:13px;color:#aaa;">Permiso de ubicación denegado.</p>';
    });
}

// ── NOTICIAS DE DERMATOLOGÍA ──────────────────────────────────────
async function loadNewsWidget(containerId = 'news-widget') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<p style="color:#aaa;font-size:13px;">📰 Cargando noticias...</p>';

    try {
        const r    = await fetch(`${API_PROXY_URL}/api/news?q=dermatolog%C3%ADa+skincare&lang=es`);
        const data = await r.json();
        if (!data.ok || !data.articles?.length) throw new Error('Sin artículos');

        container.innerHTML = data.articles.slice(0,3).map(a => `
            <div style="border-bottom:1px solid #f0f0f0;padding:12px 0;">
                <a href="${a.url}" target="_blank" rel="noopener noreferrer" style="font-size:14px;font-weight:600;color:#00897b;text-decoration:none;">${a.title}</a>
                <p style="font-size:12px;color:#999;margin-top:4px;">${a.source?.name} · ${new Date(a.publishedAt).toLocaleDateString('es-CO')}</p>
                <p style="font-size:13px;color:#555;margin-top:4px;">${(a.description||'').slice(0,100)}${a.description?.length > 100 ? '…' : ''}</p>
            </div>`).join('');
    } catch {
        container.innerHTML = '<p style="font-size:13px;color:#aaa;">No se pudieron cargar noticias en este momento.</p>';
    }
}

// ── ARTÍCULOS PUBMED ──────────────────────────────────────────────
async function loadPubmedForCurso(cursoId, containerId = 'pubmed-articles') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const curso = CURSOS_INFO[cursoId];
    if (!curso) return;

    // Palabras clave basadas en el nombre del curso
    const term = curso.nombre.split(' ').slice(0,3).join('+');
    container.innerHTML = '<p style="color:#aaa;font-size:13px;">🔬 Buscando artículos científicos...</p>';

    try {
        const r    = await fetch(`${API_PROXY_URL}/api/pubmed?term=${encodeURIComponent(term)}&max=3`);
        const data = await r.json();
        if (!data.ok || !data.articles?.length) throw new Error();

        container.innerHTML = `
            <h4 style="color:#00897b;margin-bottom:12px;font-size:14px;">🔬 Artículos científicos relacionados (PubMed)</h4>
            ${data.articles.map(a => `
                <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;border-left:3px solid #00b894;">
                    <a href="${a.url}" target="_blank" rel="noopener noreferrer" style="font-size:13px;font-weight:600;color:#00897b;">${a.title}</a>
                    <p style="font-size:11px;color:#999;margin-top:3px;">${a.authors} · ${a.source} · ${a.pubdate}</p>
                </div>`).join('')}`;
    } catch {
        container.innerHTML = '<p style="font-size:12px;color:#aaa;">No se encontraron artículos en este momento.</p>';
    }
}

// ── HELPERS ───────────────────────────────────────────────────────
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}
