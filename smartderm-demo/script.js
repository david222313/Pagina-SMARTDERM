// Datos iniciales de cursos (del brief, con videos educativos )
let courses = JSON.parse(localStorage.getItem('courses')) || [{
        id: 1,
        name: "DERM-Q MASTER",
        desc: "Curso maestro en fundamentos dermatológicos. Incluye descripción de lesiones primarias y secundarias, anatomía cutánea básica y enfoque clínico inicial.",
        price: 120000,
        creator: "docente@example.com",
        video: "https://www.youtube.com/embed/Ijae4iURrDI" // Intro to Dermatology Basics - e
    },
    {
        name: "Dermocosmética Clínica Pro",
        desc: "Avanzado en cosmética para piel. Tratamientos estéticos, ingredientes activos, retinoides, ácidos y protocolos clínicos para rejuvenecimiento y cuidado diario.",
        price: 150000,
        creator: "docente@example.com",
        video: "https://www.youtube.com/embed/IOL_YwDST2s" // Skincare products explained by dermatologist
    },
    {
        name: "Inmunología Cutánea Simplificada",
        desc: "Conceptos clave de inmunología en la piel. Barrera inmune, TLR, keratinocytes, respuestas inflamatorias y enfermedades autoinmunes cutáneas.",
        price: 100000,
        creator: "docente@example.com",
        video: "https://www.youtube.com/embed/_VhcZTGv0CU" // Immunology in the Skin - 
    },
    {
        name: "Nutrición Dermatológica Integrativa",
        desc: "Nutrición para la salud cutánea. Vitaminas, omega-3, antioxidantes, dieta antiinflamatoria y su impacto en acné, psoriasis y envejecimiento.",
        price: 110000,
        creator: "docente@example.com",
        video: "https://www.youtube.com/embed/5JKQluW6q9w" // Nutrition and skin health
    },
    {
        name: "Neuroestilo de Vida y Piel",
        desc: "Impacto del estilo de vida en la piel. Estrés, sueño, ejercicio, mente-cuerpo y su relación con condiciones dermatológicas como eczema y rosácea.",
        price: 130000,
        creator: "docente@example.com",
        video: "https://www.youtube.com/embed/5JKQluW6q9w" // Video relacionado con mente y piel 
    }
];

let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;

// Toggle entre login y register
function toggleRegister() {
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('registerForm');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    reg.style.display = reg.style.display === 'none' ? 'block' : 'none';
}

// Registro de usuario
function register() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    if (!name || !email || !pass) {
        alert('Completa todos los campos');
        return;
    }

    if (users.find(u => u.email === email)) {
        alert('Este email ya está registrado');
        return;
    }

    const newUser = {
        name,
        email,
        pass,
        role,
        progress: 0,
        courses: [] // Cursos inscritos (para estudiante)
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registro exitoso. Ahora inicia sesión.');
    toggleRegister();
}

// Login con verificación de admin
function login() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const selectedRole = document.getElementById('role').value;

    const user = users.find(u => u.email === email && u.pass === pass);

    if (!user) {
        alert('Credenciales incorrectas');
        return;
    }

    if (selectedRole === 'admin' && email !== 'admin@smartderm.com') {
        alert('Acceso de administrador solo permitido con el email especial: admin@smartderm.com');
        return;
    }

    currentUser = {...user, role: selectedRole };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    document.getElementById('auth').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('taskbar').style.display = 'block';

    loadDashboard();
}

// Cargar elementos del dashboard según rol
function loadDashboard() {
    document.getElementById('welcome').innerText = `Bienvenido, ${currentUser.name} (${currentUser.role})`;

    // Mostrar/ocultar progreso solo para estudiante
    document.getElementById('progressContainer').style.display = currentUser.role === 'estudiante' ? 'block' : 'none';
    if (currentUser.role === 'estudiante') {
        updateProgress(currentUser.progress || 0);
    }

    // Paneles específicos
    document.getElementById('docentePanel').style.display = currentUser.role === 'docente' ? 'block' : 'none';
    document.getElementById('adminPanel').style.display = currentUser.role === 'admin' ? 'block' : 'none';

    if (currentUser.role === 'admin') {
        document.getElementById('userCount').innerText = users.length;
    }

    // Cargar cursos siempre en dashboard
    loadCourses();

    // Cargar cursos del docente si aplica
    if (currentUser.role === 'docente') {
        loadDocenteCourses();
    }
}

// Cargar lista de cursos en dashboard
function loadCourses() {
    const container = document.getElementById('courses');
    container.innerHTML = '';

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h4>${course.name}</h4>
            <p>${course.desc.substring(0, 100)}...</p>
            <p><strong>Precio:</strong> $${course.price.toLocaleString('es-CO')}</p>
            <button onclick='accessCourse(${JSON.stringify(course)})'>Acceder / Evaluar</button>
        `;
        container.appendChild(card);
    });
}

// Abrir modal (subventana) con detalle del curso
function accessCourse(course) {
    document.getElementById('courseModal').style.display = 'block';
    document.getElementById('modalTitle').innerText = course.name;
    document.getElementById('modalDesc').innerText = course.desc;
    document.getElementById('modalVideo').src = course.video + '?autoplay=1'; // Autoplay si el navegador lo permite

    const evalContainer = document.getElementById('modalEvaluation');
    evalContainer.innerHTML = '<h4>Mini Evaluación Temática</h4>';

    let questions = [];

    // Preguntas específicas por curso
    switch (course.name) {
        case "DERM-Q MASTER":
            questions = [
                { q: "¿Qué describe la dermatología?", opts: ["La piel y sus anexos", "Los huesos"], ans: 0 },
                { q: "Lesión primaria ejemplo:", opts: ["Mácula", "Cicatriz"], ans: 0 }
            ];
            break;
        case "Dermocosmética Clínica Pro":
            questions = [
                { q: "¿Principal enfoque?", opts: ["Cuidado estético y preventivo", "Cirugía reconstructiva"], ans: 0 },
                { q: "Retinoides se usan para:", opts: ["Reducir arrugas y acné", "Aumentar pigmentación"], ans: 0 }
            ];
            break;
        case "Inmunología Cutánea Simplificada":
            questions = [
                { q: "Rol principal de la piel en inmunidad:", opts: ["Barrera física e inmune", "Digestión"], ans: 0 },
                { q: "TLR en keratinocytes detectan:", opts: ["Patógenos", "Vitaminas"], ans: 0 }
            ];
            break;
        case "Nutrición Dermatológica Integrativa":
            questions = [
                { q: "Nutriente clave antioxidante:", opts: ["Vitamina C", "Azúcar refinada"], ans: 0 },
                { q: "Omega-3 ayuda en:", opts: ["Reducir inflamación cutánea", "Aumentar acné"], ans: 0 }
            ];
            break;
        case "Neuroestilo de Vida y Piel":
            questions = [
                { q: "Estrés crónico causa:", opts: ["Acné, rosácea, envejecimiento", "Mejora hidratación"], ans: 0 },
                { q: "Sueño adecuado favorece:", opts: ["Regeneración cutánea", "Aumento de arrugas"], ans: 0 }
            ];
            break;
        default:
            questions = [{ q: "Pregunta genérica", opts: ["Opción A", "Opción B"], ans: 0 }];
    }

    questions.forEach((q, index) => {
        evalContainer.innerHTML += `
            <p><strong>Pregunta ${index + 1}:</strong> ${q.q}</p>
            <label><input type="radio" name="q${index}" value="0"> ${q.opts[0]}</label><br>
            <label><input type="radio" name="q${index}" value="1"> ${q.opts[1]}</label><br>
            <button onclick="submitEval(${index}, ${q.ans})">Enviar Respuesta</button><br><br>
        `;
    });
}

// Cerrar modal y detener video
function closeModal() {
    document.getElementById('courseModal').style.display = 'none';
    document.getElementById('modalVideo').src = '';
}

// Evaluar respuesta
function submitEval(questionIndex, correctAnswer) {
    const radios = document.getElementsByName(`q${questionIndex}`);
    let selectedValue = null;
    for (let radio of radios) {
        if (radio.checked) {
            selectedValue = parseInt(radio.value);
            break;
        }
    }

    if (selectedValue === null) {
        alert('Selecciona una opción antes de enviar');
        return;
    }

    if (selectedValue === correctAnswer) {
        alert('¡Correcto! +10% de progreso');
        updateProgress(10);
    } else {
        alert('Incorrecto. Intenta de nuevo.');
    }
}

// Agregar curso (solo docente)
function addCourse() {
    const name = document.getElementById('newCourseName').value.trim();
    const desc = document.getElementById('newCourseDesc').value.trim();
    const price = parseInt(document.getElementById('newCoursePrice').value);

    if (!name || !desc || isNaN(price)) {
        alert('Completa todos los campos correctamente');
        return;
    }

    courses.push({
        name,
        desc,
        price,
        creator: currentUser.email,
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Placeholder - puedes cambiar
    });

    localStorage.setItem('courses', JSON.stringify(courses));
    loadCourses();
    loadDocenteCourses();
    alert('Curso agregado exitosamente');
}

// Cargar cursos para gestión del docente
function loadDocenteCourses() {
    const container = document.getElementById('docenteCourses');
    container.innerHTML = '';
    courses.forEach((c, index) => {
        if (c.creator === currentUser.email) {
            const item = document.createElement('div');
            item.className = 'course-card';
            item.innerHTML = `
                <strong>${c.name}</strong> - $${c.price.toLocaleString('es-CO')}
                <button onclick="removeCourse(${index})">Quitar</button>
            `;
            container.appendChild(item);
        }
    });
}

// Eliminar curso (docente)
function removeCourse(index) {
    if (confirm('¿Seguro que quieres quitar este curso?')) {
        courses.splice(index, 1);
        localStorage.setItem('courses', JSON.stringify(courses));
        loadCourses();
        loadDocenteCourses();
        alert('Curso eliminado');
    }
}

// Mostrar sección "Mis Cursos"
function showMyCourses() {
    hideAllSections();
    document.getElementById('myCoursesSection').style.display = 'block';
    const list = document.getElementById('myCoursesList');
    list.innerHTML = '<p><em>Cursos inscritos o creados:</em></p>';
    const myList = currentUser.role === 'estudiante' ? (currentUser.courses || []) : courses.filter(c => c.creator === currentUser.email);
    if (myList.length === 0) {
        list.innerHTML += '<p>No tienes cursos aún.</p>';
    } else {
        myList.forEach(c => {
            list.innerHTML += `<p>${c.name}</p>`;
        });
    }
}

// Mostrar "Próximos Desarrollos"
function showUpcoming() {
    hideAllSections();
    document.getElementById('upcomingSection').style.display = 'block';
}

// Volver al dashboard principal
function showDashboard() {
    hideAllSections();
    document.getElementById('progressContainer').style.display = currentUser.role === 'estudiante' ? 'block' : 'none';
    document.getElementById('docentePanel').style.display = currentUser.role === 'docente' ? 'block' : 'none';
    document.getElementById('adminPanel').style.display = currentUser.role === 'admin' ? 'block' : 'none';
    document.getElementById('courses').parentElement.style.display = 'block';
}

// Ocultar todas las secciones no principales
function hideAllSections() {
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('courses').parentElement.style.display = 'none';
    document.getElementById('docentePanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('myCoursesSection').style.display = 'none';
    document.getElementById('upcomingSection').style.display = 'none';
}

// Actualizar barra de progreso
function updateProgress(value) {
    currentUser.progress = Math.min(100, (currentUser.progress || 0) + value);
    document.getElementById('progressFill').style.width = currentUser.progress + '%';
    document.getElementById('progressFill').innerText = currentUser.progress + '%';

    // Guardar en users
    const index = users.findIndex(u => u.email === currentUser.email);
    if (index !== -1) {
        users[index].progress = currentUser.progress;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Carga inicial de la página
window.onload = function() {
    if (localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('auth').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('taskbar').style.display = 'block';
        loadDashboard();
    } else {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('taskbar').style.display = 'none';
    }
};