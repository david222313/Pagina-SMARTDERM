// Validación de email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Estado global de la sesión del usuario
let currentUser = null;
let userCourses = {};
let currentPreviewCourse = null;
let currentEvalCourse = null;

// Catálogo completo de cursos con video, temario, duración, nivel e instructor
const CURSOS_INFO = {
    1: {
        nombre: "Introducción a la dermatología clínica",
        img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
        descripcion: "Curso base que presenta la anatomía y fisiología de la piel, los principios del diagnóstico clínico y el tratamiento de las enfermedades dermatológicas más frecuentes en la práctica médica.",
        duracion: "8 horas",
        nivel: "Básico",
        instructor: "Dra. Ana Morales",
        videoId: "dQw4w9WgXcQ",
        temario: [
            "Módulo 1 – Anatomía y fisiología de la piel",
            "Módulo 2 – Semiología dermatológica básica",
            "Módulo 3 – Lesiones primarias y secundarias",
            "Módulo 4 – Enfermedades inflamatorias frecuentes",
            "Módulo 5 – Principios del tratamiento tópico",
            "Módulo 6 – Casos clínicos resueltos"
        ]
    },
    2: {
        nombre: "Diagnóstico de enfermedades cutáneas comunes",
        img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
        descripcion: "Formación enfocada en identificar lesiones y síntomas característicos de patologías frecuentes como acné, dermatitis, psoriasis y micosis superficiales, utilizando métodos clínicos y herramientas diagnósticas actualizadas.",
        duracion: "12 horas",
        nivel: "Intermedio",
        instructor: "Dr. Carlos Ruiz",
        videoId: "dQw4w9WgXcQ",
        temario: [
            "Módulo 1 – Clasificación de dermatosis inflamatorias",
            "Módulo 2 – Acné y dermatitis seborreica",
            "Módulo 3 – Psoriasis: diagnóstico y variantes",
            "Módulo 4 – Eczemas y dermatitis de contacto",
            "Módulo 5 – Infecciones bacterianas cutáneas",
            "Módulo 6 – Micosis superficiales y onicomicosis",
            "Módulo 7 – Uso del dermatoscopio en consulta"
        ]
    },
    3: {
        nombre: "Dermatología para atención primaria",
        img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80",
        descripcion: "Curso dirigido a médicos generales y personal de salud que necesitan reconocer, evaluar y manejar problemas dermatológicos básicos en la consulta diaria, con énfasis en criterios de derivación al especialista.",
        duracion: "10 horas",
        nivel: "Básico",
        instructor: "Dr. Luis Herrera",
        videoId: "dQw4w9WgXcQ",
        temario: [
            "Módulo 1 – Abordaje dermatológico en atención primaria",
            "Módulo 2 – Dermatosis de consulta frecuente",
            "Módulo 3 – Urgencias dermatológicas",
            "Módulo 4 – Criterios de derivación al especialista",
            "Módulo 5 – Prescripción de corticoides tópicos",
            "Módulo 6 – Prevención y fotodaño solar"
        ]
    },
    4: {
        nombre: "Dermatología pediátrica avanzada",
        img: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&q=80",
        descripcion: "Programa especializado en el diagnóstico y tratamiento de enfermedades cutáneas en niños, incluyendo afecciones congénitas, infecciosas, inflamatorias y genodermatosis propias de la etapa pediátrica.",
        duracion: "15 horas",
        nivel: "Avanzado",
        instructor: "Dra. Patricia Vega",
        videoId: "dQw4w9WgXcQ",
        temario: [
            "Módulo 1 – Particularidades de la piel pediátrica",
            "Módulo 2 – Dermatitis atópica en la infancia",
            "Módulo 3 – Exantemas infecciosos en niños",
            "Módulo 4 – Genodermatosis: diagnóstico y manejo",
            "Módulo 5 – Hemangiomas y malformaciones vasculares",
            "Módulo 6 – Acné neonatal e infantil",
            "Módulo 7 – Fotosensibilidad en pacientes pediátricos",
            "Módulo 8 – Casos clínicos complejos"
        ]
    },

    // ── CURSOS SIN CERTIFICACIÓN – Para el público general ─────────────────
    5: {
        nombre: "Protégete del Cáncer de Piel: Guía Práctica",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        descripcion: "Aprende a identificar señales de alerta en tu piel, entender los factores de riesgo y adoptar hábitos diarios de protección solar para prevenir el cáncer de piel desde casa. Sin tecnicismos, con ejemplos reales.",
        duracion: "3 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – ¿Qué es el cáncer de piel y por qué me debe importar?",
            "Módulo 2 – Los tipos de piel y su vulnerabilidad al sol",
            "Módulo 3 – La regla ABCDE: cómo revisar tus lunares en casa",
            "Módulo 4 – Factor solar (SPF): mitos, verdades y cómo elegirlo",
            "Módulo 5 – Hábitos de protección solar para toda la familia",
            "Módulo 6 – Cuándo visitar al dermatólogo: señales de alarma",
            "Módulo 7 – Alimentación y piel: lo que sí ayuda"
        ]
    },
    6: {
        nombre: "Maquillaje Seguro y Piel Saludable",
        img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
        descripcion: "Descubre cómo elegir productos de maquillaje y cuidado facial que respeten tu tipo de piel, qué ingredientes evitar, cómo leer etiquetas de cosméticos y rutinas básicas que hacen la diferencia.",
        duracion: "2.5 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – Tipos de piel: conoce la tuya antes de maquillarte",
            "Módulo 2 – Ingredientes beneficiosos en cosméticos",
            "Módulo 3 – Ingredientes que debes evitar según tu tipo de piel",
            "Módulo 4 – Cómo leer una etiqueta de producto cosmético",
            "Módulo 5 – Rutina básica de cuidado: limpieza, hidratación y protección",
            "Módulo 6 – Maquillaje sin dañar la piel: bases, correctores y desmaquillantes",
            "Módulo 7 – Acné y maquillaje: cómo convivir sin empeorar"
        ]
    },
    7: {
        nombre: "Piel Sana en el Día a Día",
        img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
        descripcion: "Consejos prácticos respaldados por dermatólogos para mantener una piel sana con hábitos simples: hidratación, alimentación, sueño, estrés y factores ambientales. Ideal para toda la familia.",
        duracion: "2 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – La piel como reflejo de tu salud general",
            "Módulo 2 – Hidratación interna y externa: cuánta agua necesita tu piel",
            "Módulo 3 – Alimentos que benefician y dañan la piel",
            "Módulo 4 – El estrés y su impacto en la piel",
            "Módulo 5 – Sueño y regeneración celular de la piel",
            "Módulo 6 – Contaminación ambiental y cuidado de la piel en ciudad",
            "Módulo 7 – Rutinas sencillas para todas las edades"
        ]
    },
    8: {
        nombre: "Acné: Entiéndelo y Trátalo Bien",
        img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80",
        descripcion: "Una guía honesta sobre el acné dirigida al público general: por qué aparece, qué lo empeora, qué tratamientos caseros funcionan y cuáles son mitos, y cuándo realmente necesitas ver a un especialista.",
        duracion: "2 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – ¿Qué es el acné y por qué a mí?",
            "Módulo 2 – Tipos de acné: no todos son iguales",
            "Módulo 3 – Lo que empeora el acné sin que lo sepas",
            "Módulo 4 – Remedios caseros: cuáles funcionan y cuáles son mitos",
            "Módulo 5 – Ingredientes activos clave: retinol, ácido salicílico, niacinamida",
            "Módulo 6 – Dieta y acné: la conexión real",
            "Módulo 7 – Cuándo ir al dermatólogo y qué esperar"
        ]
    },
    9: {
        nombre: "Envejecimiento Saludable de la Piel",
        img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
        descripcion: "Comprende el proceso natural de envejecimiento de la piel y aprende qué hábitos, ingredientes y cuidados realmente hacen diferencia, sin caer en exageraciones ni gastos innecesarios.",
        duracion: "2.5 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – Cómo envejece la piel: lo que es normal y lo que no",
            "Módulo 2 – El sol: principal causa del envejecimiento prematuro",
            "Módulo 3 – Ingredientes antiedad que sí funcionan",
            "Módulo 4 – Rutinas de cuidado por décadas: 20s, 30s, 40s y más",
            "Módulo 5 – Hidratación profunda: claves para una piel firme",
            "Módulo 6 – Lo que no necesitas: mitos y productos innecesarios",
            "Módulo 7 – Procedimientos mínimamente invasivos: cuándo y por qué"
        ]
    },
    10: {
        nombre: "Alergias e Irritaciones de la Piel",
        img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
        descripcion: "Aprende a identificar, manejar y prevenir alergias cutáneas, dermatitis de contacto y reacciones a productos del hogar o cosméticos, con pasos claros para actuar antes de ver al médico.",
        duracion: "2 horas",
        nivel: "Sin certificación · Público general",
        instructor: "Equipo SmartDerm",
        videoId: "dQw4w9WgXcQ",
        sinCertificacion: true,
        temario: [
            "Módulo 1 – Diferencia entre alergia e irritación de la piel",
            "Módulo 2 – Alérgenos comunes en el hogar y cosméticos",
            "Módulo 3 – Dermatitis de contacto: cómo identificarla",
            "Módulo 4 – Primeros auxilios para reacciones cutáneas",
            "Módulo 5 – Ingredientes cosméticos que provocan alergia frecuente",
            "Módulo 6 – Pruebas de parche en casa: paso a paso",
            "Módulo 7 – Cuándo es urgente ir al médico"
        ]
    }
};

// Detecta la página activa para aplicar lógica específica por ruta
const EN_MIS_CURSOS = window.location.pathname.endsWith("mis-cursos.html");

// Lee la sesión persistida en localStorage y restaura el estado global
function loadUserData() {
    const stored = localStorage.getItem('smartderm_user');
    if (stored) {
        const data = JSON.parse(stored);
        currentUser = data.user;
        userCourses = data.courses || {};
    }
    // Garantiza que el admin por defecto exista siempre
    ensureDefaultAdmin();
}

// Crea el administrador por defecto si no existe
function ensureDefaultAdmin() {
    const stored = JSON.parse(localStorage.getItem('smartderm_user') || '{}');
    const users = stored.users || [];
    if (!users.find(u => u.email === 'admin@smartderm.com')) {
        users.push({
            id: 0, name: 'Administrador SmartDerm',
            email: 'admin@smartderm.com', password: 'Admin2025!',
            role: 'admin', avatar: 'A', joined: new Date().toISOString()
        });
        stored.users = users;
        localStorage.setItem('smartderm_user', JSON.stringify(stored));
    }
}

// Sanitiza texto para prevenir XSS
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

// Serializa y guarda el estado actual de la sesión en localStorage
function saveUserData() {
    localStorage.setItem('smartderm_user', JSON.stringify({
        user: currentUser,
        courses: userCourses
    }));
}

// Muestra el overlay del formulario de autenticación
function showLogin() {
    document.getElementById("auth").style.display = "flex";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
}

// Alterna entre los formularios de login y registro dentro del overlay
function toggleRegister() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const verRegistro = registerForm.style.display === "none";
    loginForm.style.display = verRegistro ? "none" : "block";
    registerForm.style.display = verRegistro ? "block" : "none";
}

// Autentica al usuario verificando contra usuarios registrados en localStorage
function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!isValidEmail(email)) { alert("Por favor ingresa un email válido."); return; }
    if (!password) { alert("Por favor ingresa tu contraseña."); return; }
    const storedUser = localStorage.getItem(`user_${email}`);
    if (!storedUser) { alert("Usuario no registrado. Por favor regístrate primero."); return; }
    const userData = JSON.parse(storedUser);
    // Verificar contraseña (simulada con btoa)
    if (btoa(password) !== userData.password) {
        alert("Contraseña incorrecta.");
        return;
    }
    currentUser = { email, role: userData.role, name: userData.name, password: userData.password, avatar: userData.avatar };
    // Preserve existing course progress if any
    const stored2 = localStorage.getItem('smartderm_user');
    userCourses = stored2 ? (JSON.parse(stored2).courses || {}) : {};
    saveUserData();
    // Redirect admin to admin panel, others to mis-cursos
    if (userData.role === 'admin') {
        window.location.href = "admin.html";
    } else {
        window.location.href = "mis-cursos.html";
    }
}

// Autentica al usuario con cuenta Google (simulado) y redirige al dashboard
function loginWithGoogle() {
    currentUser = { email: "usuario@gmail.com", role: "estudiante", name: "Usuario Google" };
    userCourses = {};
    saveUserData();
    window.location.href = "mis-cursos.html";
}

// Registra un nuevo usuario (simulado) y retorna al formulario de login
function register() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    if (!name) { alert("Por favor ingresa tu nombre."); return; }
    if (!isValidEmail(email)) { alert("Por favor ingresa un email válido."); return; }
    if (password.length < 4) { alert("La contraseña debe tener al menos 4 caracteres."); return; }
    // Guardar usuario con contraseña simulada (btoa)
    localStorage.setItem(`user_${email}`, JSON.stringify({
        name, email,
        password: btoa(password),
        role: document.getElementById("regRole").value
    }));
    alert("Usuario registrado correctamente");
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}

// Elimina la sesión activa del localStorage y redirige al inicio
function logout() {
    currentUser = null;
    userCourses = {};
    localStorage.removeItem('smartderm_user');
    window.location.href = "index.html";
}

// Inscribe al usuario autenticado en el curso indicado por ID
function enrollCourse(cursoId) {
    if (!currentUser) {
        alert("Debes iniciar sesión primero");
        showLogin();
        return;
    }
    if (!userCourses[cursoId]) {
        userCourses[cursoId] = { progress: 0, completed: false };
        saveUserData();
        alert("¡Te has inscrito al curso! Ya puedes verlo en Mis Cursos.");
    } else {
        alert("Ya estás inscrito en este curso.");
    }
}

// Construye y muestra el modal de preview con toda la información del curso
function showCoursePreview(cursoId) {
    const curso = CURSOS_INFO[cursoId];
    if (!curso) return;

    currentPreviewCourse = cursoId;

    document.getElementById("preview-title").textContent = curso.nombre;
    document.getElementById("preview-duracion").textContent = curso.duracion;
    document.getElementById("preview-nivel").textContent = curso.nivel;
    document.getElementById("preview-instructor").textContent = curso.instructor;
    document.getElementById("preview-description").textContent = curso.descripcion;

    // Inyecta el iframe de YouTube con el ID del video configurado en el catálogo
    const videoWrapper = document.getElementById("preview-video-wrapper");
    if (curso.videoId) {
        videoWrapper.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${curso.videoId}?rel=0&modestbranding=1"
                title="Video introductorio: ${curso.nombre}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>`;
    } else {
        videoWrapper.innerHTML = `
            <div class="video-placeholder">
                <div class="play-icon">▶</div>
                <p>Video introductorio próximamente</p>
            </div>`;
    }

    // Genera un ítem de lista por cada módulo del temario del curso
    const temarioList = document.getElementById("preview-temario");
    temarioList.innerHTML = curso.temario.map((modulo, index) => `
        <li>
            <span class="modulo-num">0${index + 1}</span>
            <span>${modulo}</span>
        </li>
    `).join('');

    // Mostrar progreso si ya está inscrito
    const progressEl = document.getElementById("preview-progress");
    if (progressEl) {
        const inscrito = userCourses[cursoId];
        if (inscrito) {
            progressEl.innerHTML = `<div style="margin:10px 0;"><p style="color:#00897b;font-weight:bold;margin-bottom:6px;">✅ Ya estás inscrito — Progreso: ${inscrito.progress}%</p><div class="progress-bar-container"><div class="progress-bar" style="width:${inscrito.progress}%">${inscrito.progress}%</div></div></div>`;
        } else {
            progressEl.innerHTML = '';
        }
    }

    // Cambiar botón según si ya está inscrito
    const btnInscribirse = document.querySelector(".btn-inscribirse");
    if (btnInscribirse) {
        if (userCourses[cursoId]) {
            btnInscribirse.textContent = "Continuar en Mis Cursos";
            btnInscribirse.onclick = () => { closePreviewModal(); window.location.href = "mis-cursos.html"; };
        } else {
            btnInscribirse.textContent = "Inscribirme al Curso";
            btnInscribirse.onclick = enrollFromPreview;
        }
    }

    document.getElementById("coursePreviewModal").style.display = "flex";

    // Init assistant inside the preview modal (only in mis-cursos)
    const previewAssistantContainer = document.getElementById("preview-assistant-container");
    if (previewAssistantContainer && typeof initAssistant === 'function') {
        previewAssistantContainer.innerHTML = '';
        const curso = CURSOS_INFO[cursoId];
        initAssistant({ containerId: 'preview-assistant-container', courseContext: curso || null });
    }
}

// Cierra el modal de preview y detiene el video reseteando el src del iframe
function closePreviewModal() {
    const modal = document.getElementById("coursePreviewModal");
    const iframe = modal.querySelector("iframe");
    if (iframe) iframe.src = iframe.src;
    modal.style.display = "none";
}

// Inscribe al usuario desde el modal de preview y lo cierra
function enrollFromPreview() {
    if (currentPreviewCourse) {
        enrollCourse(currentPreviewCourse);
        closePreviewModal();
    }
}

// Renderiza las tarjetas de cursos inscritos en el grid del dashboard
function renderMisCursos() {
    const grid = document.getElementById("mis-cursos-grid");
    if (!grid) return;

    let html = '';
    for (let id in userCourses) {
        const curso = CURSOS_INFO[id];
        if (!curso) continue;
        const prog = userCourses[id].progress;
        html += `
            <div class="curso-card" data-curso-id="${id}">
                <img src="${curso.img}" alt="${curso.nombre}" onerror="this.src='';this.style.minHeight='120px';this.style.background='#e0f2f1'">
                <h3>${curso.nombre}</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${prog}%;">${prog}%</div>
                </div>
                <button class="btn-ver-curso" onclick="showCoursePreview(${id})">Ver contenido</button>
                <button onclick="startEval(${id})" ${prog >= 100 ? 'disabled' : ''} style="margin-top:6px;">Realizar evaluación</button>
                ${prog >= 100 ? `<button onclick="showCertificate(${id})" style="margin-top:6px;">Ver certificado</button>` : ''}
            </div>`;
    }
 
    if (!html) {
        html = '<p style="color:#555;padding:20px;">No estás inscrito en ningún curso. Vuelve al inicio y usa "Cursos Destacados" para inscribirte.</p>';
    }
    grid.innerHTML = html;
}
 
// Abre el modal de evaluación para el curso indicado
function startEval(cursoId) {
    if (userCourses[cursoId] && userCourses[cursoId].progress >= 100) {
        alert("Ya completaste este curso.");
        return;
    }
    currentEvalCourse = cursoId;
    const curso = CURSOS_INFO[cursoId];
    const preguntas = EVAL_BANCO[cursoId] || EVAL_BANCO[1];

    // Set eval title
    const titleEl = document.getElementById("eval-title");
    if (titleEl) titleEl.textContent = "Evaluación: " + (curso ? curso.nombre : "Curso");

    // Render questions dynamically
    const container = document.getElementById("eval-questions-container");
    if (container) {
        container.innerHTML = preguntas.map((p, i) => `
            <div style="background:#f8f8f8;border-radius:10px;padding:16px 20px;">
                <p style="font-weight:600;color:#1a1a1a;margin-bottom:12px;">${i+1}. ${p.pregunta}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${p.opciones.map((op, j) => `
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 12px;border-radius:6px;border:1.5px solid #e0e0e0;background:white;transition:background 0.15s;">
                            <input type="radio" name="q${i}" value="${j}" style="accent-color:#00b894;">
                            <span style="font-size:14px;color:#333;">${op}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    document.getElementById("evalModal").style.display = "flex";
}
 
// Procesa el envío de la evaluación, verifica respuestas y actualiza el grid
function submitEval() {
    const preguntas = EVAL_BANCO[currentEvalCourse] || EVAL_BANCO[1];
    let allAnswered = true;
    let correctCount = 0;
    preguntas.forEach((p, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (!sel) { allAnswered = false; }
        else if (parseInt(sel.value) === p.respuesta) correctCount++;
    });
    if (!allAnswered) { alert("Por favor responde todas las preguntas antes de enviar."); return; }
    const pct = Math.round((correctCount / preguntas.length) * 100);
    if (pct < 70) {
        alert(`Obtuviste ${correctCount}/${preguntas.length} respuestas correctas (${pct}%). Necesitas al menos 70% para aprobar. ¡Revisa el contenido e intenta de nuevo!`);
        return;
    }
    alert(`¡Evaluación aprobada! Obtuviste ${correctCount}/${preguntas.length} (${pct}%). ¡Felicidades!`);
    if (currentEvalCourse) {
        userCourses[currentEvalCourse].progress  = 100;
        userCourses[currentEvalCourse].completed = true;
        saveUserData();
        renderMisCursos();
    }
    closeModal();
}
 
// Cierra el modal de evaluación
function closeModal() {
    document.getElementById("evalModal").style.display = "none";
}
 
// Muestra el modal del certificado con el nombre del curso completado
function showCertificate(cursoId) {
    document.getElementById("cert-curso-nombre").innerText = CURSOS_INFO[cursoId]?.nombre || "Curso";
    document.getElementById("certModal").style.display = "flex";
}
 
// Cierra el modal del certificado
function closeCertModal() {
    document.getElementById("certModal").style.display = "none";
}
 
// Simula la descarga del certificado en PDF
function downloadCertificate() {
    alert("Descargando certificado... (simulado)");
}
 
// Inicialización al cargar el DOM según la página activa
window.onload = function () {
    loadUserData();
 
    // Sincronizar navbar en TODAS las páginas
    actualizarNavbarIndex();

    if (EN_MIS_CURSOS) {
        if (!currentUser) {
            window.location.href = "index.html";
            return;
        }
        const userNameEl = document.getElementById("user-name");
        if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.email;
        renderMisCursos();
    }
};
 
// Actualiza la navbar según el estado de autenticación en todas las páginas
function actualizarNavbarIndex() {
    // IDs del showcase (index solamente)
    const btnLoginShowcase = document.getElementById("btn-login");
    const navUserShowcase  = document.getElementById("nav-user-info");
    // IDs de la navbar unificada (todas las páginas)
    const btnLoginNav = document.getElementById("btn-login-nav");
    const navUserNav  = document.getElementById("nav-user-info-nav");

    if (currentUser) {
        if (btnLoginShowcase) btnLoginShowcase.style.display = "none";
        if (navUserShowcase)  { navUserShowcase.style.display = "inline-flex"; const el = document.getElementById("nav-user-name"); if(el) el.textContent = currentUser.name || currentUser.email; }
        if (btnLoginNav)      btnLoginNav.style.display = "none";
        if (navUserNav)       {
            navUserNav.style.display = "flex";
            const el = document.getElementById("nav-user-name-nav");
            if(el) el.textContent = currentUser.name || currentUser.email;
            // Add admin link if admin
            const adminLinkEl = document.getElementById("nav-admin-link");
            if (adminLinkEl) adminLinkEl.style.display = currentUser.role === 'admin' ? 'list-item' : 'none';
        }
    } else {
        if (btnLoginShowcase) btnLoginShowcase.style.display = "inline-block";
        if (navUserShowcase)  navUserShowcase.style.display = "none";
        if (btnLoginNav)      btnLoginNav.style.display = "list-item";
        if (navUserNav)       navUserNav.style.display = "none";
    }
}
// Preguntas y respuestas por curso
const EVAL_BANCO = {
    1: [
        { pregunta: "¿Cuál es la capa más externa de la piel?", opciones: ["Hipodermis","Epidermis","Dermis","Tejido subcutáneo"], respuesta: 1 },
        { pregunta: "¿Qué célula produce melanina?", opciones: ["Queratinocito","Fibroblasto","Melanocito","Macrófago"], respuesta: 2 },
        { pregunta: "¿Qué lesión primaria es elevada y contiene líquido claro?", opciones: ["Pápula","Vesícula","Mácula","Nódulo"], respuesta: 1 }
    ],
    2: [
        { pregunta: "¿Cuál de estas es una dermatosis inflamatoria crónica?", opciones: ["Impétigo","Psoriasis","Foliculitis","Celulitis"], respuesta: 1 },
        { pregunta: "¿Qué hongo causa la tiña pedis (pie de atleta)?", opciones: ["Candida albicans","Malassezia","Dermatophyton","Trichophyton"], respuesta: 3 },
        { pregunta: "El dermatoscopio se utiliza principalmente para:", opciones: ["Tomar biopsias","Examinar lesiones pigmentadas","Aplicar tratamientos tópicos","Inyectar medicamentos"], respuesta: 1 }
    ],
    3: [
        { pregunta: "¿Cuál es el criterio principal para derivar al especialista en dermatología?", opciones: ["Lesiones que no mejoran con tratamiento inicial","Solo cuando el paciente lo pide","Siempre en la primera consulta","Cuando la lesión supera 1 cm"], respuesta: 0 },
        { pregunta: "El fotodaño solar acumulado es causa principal de:", opciones: ["Acné rosácea","Cáncer de piel","Dermatitis seborreica","Vitiligo"], respuesta: 1 },
        { pregunta: "¿Qué tipo de corticoide tópico se usa en zonas de piel delgada?", opciones: ["Alta potencia","Muy alta potencia","Baja potencia","Ultra alta potencia"], respuesta: 2 }
    ],
    4: [
        { pregunta: "¿Cuál es la dermatosis más frecuente en niños?", opciones: ["Psoriasis","Dermatitis atópica","Vitiligo","Esclerodermia"], respuesta: 1 },
        { pregunta: "¿Qué exantema infantil causa la enfermedad de la 'bofetada'?", opciones: ["Rubéola","Varicela","Eritema infeccioso (Parvovirus B19)","Roséola"], respuesta: 2 },
        { pregunta: "Los hemangiomas infantiles típicamente:", opciones: ["Crecen toda la vida","Involucionan solos con el tiempo","Requieren siempre cirugía","Son malignos"], respuesta: 1 }
    ],
    5: [
        { pregunta: "La regla ABCDE para revisar lunares: ¿qué significa la 'A'?", opciones: ["Acidez","Asimetría","Amarillo","Adherencia"], respuesta: 1 },
        { pregunta: "¿Cuál es el factor de riesgo más importante para el cáncer de piel?", opciones: ["Dieta alta en grasas","Exposición acumulada al sol sin protección","Uso de cosméticos","Herencia exclusivamente"], respuesta: 1 },
        { pregunta: "¿Con qué frecuencia mínima debes reaplicar el protector solar?", opciones: ["Cada 6 horas","Una sola vez al día","Cada 2 horas o tras nadar/sudar","Solo cuando hay sol directo"], respuesta: 2 }
    ],
    6: [
        { pregunta: "¿Qué ingrediente debes EVITAR si tienes piel muy sensible?", opciones: ["Niacinamida","Alcohol desnaturalizado en altas concentraciones","Ácido hialurónico","Pantenol"], respuesta: 1 },
        { pregunta: "¿Qué significa que un producto es 'no comedogénico'?", opciones: ["Que no mancha la ropa","Que no obstruye los poros","Que no tiene olor","Que es para piel grasa únicamente"], respuesta: 1 },
        { pregunta: "¿Cuál es el primer paso en una rutina de cuidado facial correcta?", opciones: ["Hidratante","Protector solar","Limpieza","Sérum"], respuesta: 2 }
    ],
    7: [
        { pregunta: "¿Cuántos vasos de agua al día se recomiendan para una piel bien hidratada?", opciones: ["2-3","4-5","8 o más","Solo depende del clima"], respuesta: 2 },
        { pregunta: "¿Qué nutriente es esencial para la producción de colágeno?", opciones: ["Vitamina A","Vitamina C","Vitamina D","Hierro"], respuesta: 1 },
        { pregunta: "El estrés crónico puede provocar en la piel:", opciones: ["Mejor tono","Brotes de acné y psoriasis","Aumento del colágeno","Reducción de arrugas"], respuesta: 1 }
    ],
    8: [
        { pregunta: "¿Cuál es el tipo de acné MÁS severo?", opciones: ["Comedones cerrados","Pústulas superficiales","Acné nódulo-quístico","Puntos negros"], respuesta: 2 },
        { pregunta: "El ácido salicílico en el acné actúa principalmente:", opciones: ["Matando bacterias","Exfoliando dentro del poro (queratolítico)","Hidratando la piel","Bloqueando el sol"], respuesta: 1 },
        { pregunta: "¿Cuál de estos alimentos se asocia más con brotes de acné?", opciones: ["Frutas rojas","Verduras verdes","Lácteos con alto índice glucémico","Proteína magra"], respuesta: 2 }
    ],
    9: [
        { pregunta: "¿Cuál ingrediente tiene mayor evidencia científica antienvejecimiento?", opciones: ["Extracto de rosas","Retinol (Vitamina A)","Colágeno tópico","Agua termal"], respuesta: 1 },
        { pregunta: "¿Cuál es la causa número 1 del envejecimiento prematuro?", opciones: ["Falta de sueño","Exposición solar sin protección","Contaminación","Genética"], respuesta: 1 },
        { pregunta: "El ácido hialurónico en cosmética funciona porque:", opciones: ["Produce colágeno nuevo","Atrae y retiene agua en la piel","Elimina arrugas permanentemente","Bloquea la melanina"], respuesta: 1 }
    ],
    10: [
        { pregunta: "¿Qué diferencia una alergia de una irritación cutánea?", opciones: ["La alergia siempre es más grave visualmente","La alergia involucra respuesta inmune; la irritación es daño directo","Son exactamente lo mismo","La irritación solo ocurre en niños"], respuesta: 1 },
        { pregunta: "¿Cuál es el alérgeno más común en cosméticos?", opciones: ["Agua","Fragancias y conservantes","Vitamina E","Ácido cítrico"], respuesta: 1 },
        { pregunta: "Ante una reacción alérgica en la piel con hinchazón y dificultad para respirar, debes:", opciones: ["Aplicar crema hidratante y esperar","Tomar antihistamínico y continuar el día","Ir a urgencias de inmediato","Lavar con agua fría únicamente"], respuesta: 2 }
    ]
};
// --- NUEVA FUNCIÓN: Genera preguntas por módulo para un curso ---
function generateQuestionsForCourse(cursoId) {
    const curso = CURSOS_INFO[cursoId];
    if (!curso) return [];
    
    // Para cada módulo, crear una pregunta de opción múltiple
    // La respuesta correcta es siempre la primera opción (relacionada con el módulo)
    const questions = curso.temario.map((modulo, idx) => {
        const moduleTitle = modulo;
        // Generar opciones: una correcta basada en el módulo y dos incorrectas genéricas
        const correctAnswer = `Comprender los fundamentos de ${moduleTitle.toLowerCase()}`;
        const wrongAnswers = [
            `Ignorar completamente ${moduleTitle.toLowerCase()}`,
            `Aplicar técnicas no validadas en ${moduleTitle.toLowerCase()}`
        ];
        // Mezclar opciones para que la correcta no sea siempre la primera
        const options = [correctAnswer, ...wrongAnswers];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return {
            text: `Pregunta ${idx+1}: ¿Cuál es el principal objetivo del módulo "${moduleTitle}"?`,
            options: options,
            correct: correctAnswer
        };
    });
    return questions;
}

// --- MODIFICAR startEval: genera dinámicamente las preguntas ---
function startEval(cursoId) {
    if (userCourses[cursoId].progress >= 100) {
        alert("Ya completaste este curso.");
        return;
    }
    currentEvalCourse = cursoId;
    const questions = generateQuestionsForCourse(cursoId);
    if (!questions.length) {
        alert("No hay preguntas disponibles para este curso.");
        return;
    }
    
    // Guardar las preguntas en una variable global temporal
    window.currentEvalQuestions = questions;
    
    // Construir el HTML del formulario
    const container = document.getElementById("eval-questions-container");
    const titleEl = document.getElementById("eval-title");
    titleEl.textContent = `Evaluación: ${CURSOS_INFO[cursoId].nombre}`;
    
    let html = '';
    questions.forEach((q, idx) => {
        html += `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 15px 20px; border-left: 4px solid #00b894;">
                <p style="font-weight: 600; margin-bottom: 12px; color: #1e2a36;">${q.text}</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${q.options.map(opt => `
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #555;">
                            <input type="radio" name="q_${idx}" value="${opt.replace(/"/g, '&quot;')}" style="width: 16px; height: 16px; margin: 0;">
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.getElementById("evalModal").style.display = "flex";
}

// --- MODIFICAR submitEval: evaluar todas las preguntas ---
function submitEval() {
    if (!currentEvalCourse || !window.currentEvalQuestions) return;
    
    const questions = window.currentEvalQuestions;
    let allCorrect = true;
    
    for (let i = 0; i < questions.length; i++) {
        const selected = document.querySelector(`input[name="q_${i}"]:checked`);
        if (!selected) {
            alert(`Por favor responde la pregunta ${i+1}.`);
            return;
        }
        if (selected.value !== questions[i].correct) {
            allCorrect = false;
            break;
        }
    }
    
    if (!allCorrect) {
        alert("❌ Respuestas incorrectas. Revisa el contenido del curso e intenta nuevamente.");
        return;
    }
    
    alert("✅ ¡Evaluación aprobada! Has completado el curso.");
    if (currentEvalCourse) {
        userCourses[currentEvalCourse].progress = 100;
        userCourses[currentEvalCourse].completed = true;
        saveUserData();
        renderMisCursos();
    }
    closeModal();
    // Limpiar variables temporales
    delete window.currentEvalQuestions;
}