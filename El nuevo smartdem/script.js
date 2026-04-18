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
    }
};

// Detecta la página activa para aplicar lógica específica por ruta
const EN_MIS_CURSOS = window.location.pathname.endsWith("mis-cursos.html");

// Lee la sesión persistida en localStorage y restaura el estado global
function loadUserData() {
    const stored = localStorage.getItem('smartderm_user');
    if (!stored) return;
    const data = JSON.parse(stored);
    currentUser = data.user;
    userCourses = data.courses || {};
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
    currentUser = { email, role: userData.role, name: userData.name };
    // Preserve existing course progress if any
    const stored = localStorage.getItem('smartderm_user');
    userCourses = stored ? (JSON.parse(stored).courses || {}) : {};
    saveUserData();
    window.location.href = "mis-cursos.html";
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
    if (userCourses[cursoId].progress >= 100) {
        alert("Ya completaste este curso.");
        return;
    }
    currentEvalCourse = cursoId;
    document.getElementById("evalModal").style.display = "flex";
}
 
// Procesa el envío de la evaluación, verifica respuestas y actualiza el grid
function submitEval() {
    const answers = EVAL_ANSWERS[currentEvalCourse] || {};
    const q1 = document.querySelector('input[name="q1"]:checked');
    const q2 = document.querySelector('input[name="q2"]:checked');
    if (!q1 || !q2) { alert("Por favor responde todas las preguntas."); return; }
    const correct = q1.value === answers.q1 && q2.value === answers.q2;
    if (!correct) {
        alert("Respuestas incorrectas. Revisa el contenido del curso e intenta nuevamente.");
        return;
    }
    alert("¡Evaluación aprobada! Has completado el curso.");
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
        if (navUserNav)       { navUserNav.style.display = "flex"; const el = document.getElementById("nav-user-name-nav"); if(el) el.textContent = currentUser.name || currentUser.email; }
    } else {
        if (btnLoginShowcase) btnLoginShowcase.style.display = "inline-block";
        if (navUserShowcase)  navUserShowcase.style.display = "none";
        if (btnLoginNav)      btnLoginNav.style.display = "list-item";
        if (navUserNav)       navUserNav.style.display = "none";
    }
}
// Respuestas correctas por curso
const EVAL_ANSWERS = {
    1: { q1: 'epidermis', q2: 'melanocito' },
    2: { q1: 'epidermis', q2: 'melanocito' },
    3: { q1: 'epidermis', q2: 'melanocito' },
    4: { q1: 'epidermis', q2: 'melanocito' },
};