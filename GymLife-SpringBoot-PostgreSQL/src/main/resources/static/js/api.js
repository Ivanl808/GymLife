/**
 * GymLife API Client with strict Auth & Fallback support
 */
// Detect base API URL automatically (supports standalone local file, embedded Spring Boot, or Tomcat context)
const BASE_URL = window.location.origin.startsWith('file:') 
  ? 'http://localhost:8080/api'
  : (window.location.pathname.includes('/gymlife') ? '/gymlife/api' : '/api');

// Mock data strictly used ONLY if backend server is unreachable
const MOCK_DATA = {
  users: [
    { idUsuario: 1, nombre: 'Juan Perez', email: 'juan.perez@example.com', password: 'password123', rol: 'MIEMBRO' },
    { idUsuario: 2, nombre: 'Carlos Entrenador', email: 'carlos.coach@example.com', password: 'password123', rol: 'ENTRENADOR' },
    { idUsuario: 3, nombre: 'Laura Admin', email: 'admin@gymlife.com', password: 'admin123', rol: 'ADMINISTRADOR' }
  ],
  memberships: [
    { idMembresia: 1, tipo: 'Anual VIP Black', fechaInicio: '2025-01-01', fechaFin: '2025-12-31', estado: 'ACTIVA' }
  ],
  classes: [
    { idClase: 1, nombre: 'Spinning de Alta Intensidad', horario: '2025-05-20T18:00:00', cupoMaximo: 20, usuarios: [{ idUsuario: 1, nombre: 'Juan Perez' }] },
    { idClase: 2, nombre: 'CrossFit WOD Pro', horario: '2025-05-21T07:00:00', cupoMaximo: 15, usuarios: [] },
    { idClase: 3, nombre: 'Yoga & Mindfulness', horario: '2025-05-21T19:00:00', cupoMaximo: 12, usuarios: [] }
  ],
  routines: [
    { idRutina: 1, nombre: 'Hipertrofia Pecho & Triceps', nivel: 'Intermedio', duracion: 60, entrenador: { idUsuario: 2, nombre: 'Carlos Entrenador' } },
    { idRutina: 2, nombre: 'Cardio HIIT Quemagrasa', nivel: 'Avanzado', duracion: 45, entrenador: { idUsuario: 2, nombre: 'Carlos Entrenador' } }
  ]
};

class GymLifeAPI {
  static async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    try {
      const response = await fetch(url, { ...options, headers });
      
      // Servidor respondió (Backend En Línea)
      GymLifeAPI.updateBadge(true);

      if (!response.ok) {
        // Extraer mensaje de error devuelto por Spring Boot
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || errorData.error || errorData.mensaje || 'Credenciales o datos incorrectos';
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      // Si la respuesta falló por un error de red (Backend Apagado)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn(`[GymLife API] Backend no disponible. Usando modo Demo para: ${endpoint}`);
        GymLifeAPI.updateBadge(false);
        return GymLifeAPI.fallbackHandler(endpoint, options);
      }
      
      // Si el backend SI respondió pero con un error HTTP (ej. 400, 401, 500 por credenciales falsas)
      throw error;
    }
  }

  static updateBadge(online) {
    const badge = document.getElementById('connection-badge');
    if (!badge) return;
    if (online) {
      badge.className = 'px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>API Spring Boot En Linea</span>';
    } else {
      badge.className = 'px-2.5 py-1 text-[11px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>Modo Demo Interactivo</span>';
    }
  }

  // Fallback estricto cuando no hay conexión al backend
  static fallbackHandler(endpoint, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    if (endpoint === '/usuarios/login') {
      const user = MOCK_DATA.users.find(u => 
        u.email.toLowerCase() === body.email?.toLowerCase() && 
        u.password === body.password
      );

      if (!user) {
        throw new Error('Credenciales incorrectas. Verifique su correo y contraseña.');
      }

      return { 
        mensaje: 'Autenticación correcta (Demo)', 
        usuarioId: user.idUsuario, 
        nombre: user.nombre, 
        rol: user.rol 
      };
    }

    if (endpoint === '/usuarios/registro') {
      const newUser = { idUsuario: MOCK_DATA.users.length + 1, ...body };
      MOCK_DATA.users.push(newUser);
      return newUser;
    }

    if (endpoint === '/usuarios') return MOCK_DATA.users;

    if (endpoint.startsWith('/membresias/usuario/')) {
      return MOCK_DATA.memberships;
    }

    if (endpoint.includes('/pagos')) {
      return { idPago: Math.floor(Math.random() * 1000), ...body, fecha: new Date().toISOString() };
    }

    if (endpoint === '/clases') {
      if (method === 'POST') {
        const newClass = { idClase: MOCK_DATA.classes.length + 1, ...body, usuarios: [] };
        MOCK_DATA.classes.push(newClass);
        return newClass;
      }
      return MOCK_DATA.classes;
    }

    if (endpoint.includes('/reservar/')) {
      return { mensaje: 'Reserva registrada con éxito' };
    }

    if (endpoint.includes('/asistencia/')) {
      return { idAsistencia: 99, fecha: new Date().toISOString(), codigoQR: 'QR-DEMO-PASS' };
    }

    if (endpoint.startsWith('/rutinas/miembro/')) return MOCK_DATA.routines;

    if (endpoint.startsWith('/clases/asistencias/usuario/')) {
      return [];
    }

    if (endpoint.includes('/rutinas/entrenador/')) {
      const newRoutine = { idRutina: MOCK_DATA.routines.length + 1, ...body };
      MOCK_DATA.routines.push(newRoutine);
      return newRoutine;
    }

    return { status: 'ok' };
  }

  // API Call Shortcuts
  static login(email, password) {
    return this.request('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static register(userData) {
    return this.request('/usuarios/registro', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static getUsers() {
    return this.request('/usuarios');
  }

  static createMembership(usuarioId, data) {
    return this.request(`/membresias/usuario/${usuarioId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static getMembershipsByUser(usuarioId) {
    return this.request(`/membresias/usuario/${usuarioId}`);
  }

  static registerPayment(membershipId, paymentData) {
    return this.request(`/membresias/${membershipId}/pagos`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  static getClasses() {
    return this.request('/clases');
  }

  static createClass(classData) {
    return this.request('/clases', {
      method: 'POST',
      body: JSON.stringify(classData)
    });
  }

  static reserveClass(claseId, usuarioId) {
    return this.request(`/clases/${claseId}/reservar/${usuarioId}`, {
      method: 'POST'
    });
  }

  static registerAttendance(claseId, usuarioId, codigoQR) {
    return this.request(`/clases/${claseId}/asistencia/${usuarioId}?codigoQR=${encodeURIComponent(codigoQR)}`, {
      method: 'POST'
    });
  }

  static getRoutinesByMember(miembroId) {
    return this.request(`/rutinas/miembro/${miembroId}`);
  }

  static getAttendancesByUser(usuarioId) {
    return this.request(`/clases/asistencias/usuario/${usuarioId}`);
  }

  static createRoutine(entrenadorId, miembroId, routineData) {
    return this.request(`/rutinas/entrenador/${entrenadorId}/miembro/${miembroId}`, {
      method: 'POST',
      body: JSON.stringify(routineData)
    });
  }
}
