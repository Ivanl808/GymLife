/**
 * GymLife Main Single-Page Application (SPA) Logic
 */

// Application State
let currentUser = null;
let currentTab = 'dashboard';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

function checkSession() {
  const storedUser = localStorage.getItem('gymlife_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    document.getElementById('auth-screen').classList.add('hidden');
    initUserView();
  } else {
    document.getElementById('auth-screen').classList.remove('hidden');
  }
}

function initUserView() {
  updateUserUI();
  renderNavigation();
  switchTab('dashboard');
}

function updateUserUI() {
  if (!currentUser) return;
  document.getElementById('user-display-name').textContent = currentUser.nombre;
  document.getElementById('user-display-role').textContent = currentUser.rol;

  const initials = currentUser.nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  document.getElementById('user-avatar-initials').textContent = initials;
}

// NAVIGATION BUILDER (DESKTOP & MOBILE)
function renderNavigation() {
  const desktopNav = document.getElementById('desktop-nav');
  const mobileNav = document.getElementById('mobile-nav');

  let navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fa-gauge' },
    { id: 'clases', label: 'Clases Grupales', icon: 'fa-calendar-days' },
    { id: 'rutinas', label: 'Mis Rutinas', icon: 'fa-dumbbell' },
    { id: 'membresia', label: 'Membresia', icon: 'fa-id-card' }
  ];

  if (currentUser.rol === 'ADMINISTRADOR') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard Admin', icon: 'fa-chart-pie' },
      { id: 'usuarios', label: 'Usuarios', icon: 'fa-users' },
      { id: 'clases', label: 'Gestion Clases', icon: 'fa-calendar-plus' },
      { id: 'membresia', label: 'Membresias & Pagos', icon: 'fa-credit-card' }
    ];
  } else if (currentUser.rol === 'ENTRENADOR') {
    navItems = [
      { id: 'dashboard', label: 'Resumen Coach', icon: 'fa-user-nurse' },
      { id: 'rutinas', label: 'Asignar Rutinas', icon: 'fa-file-signature' },
      { id: 'clases', label: 'Clases Dirigidas', icon: 'fa-calendar-days' }
    ];
  }

  // Render Desktop Sidebar
  desktopNav.innerHTML = navItems.map(item => `
    <button onclick="switchTab('${item.id}')" id="nav-btn-${item.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
      <i class="fa-solid ${item.icon} w-5 text-center text-sm"></i>
      <span>${item.label}</span>
    </button>
  `).join('');

  // Render Mobile Bottom Navigation
  mobileNav.innerHTML = navItems.map(item => `
    <button onclick="switchTab('${item.id}')" id="mnav-btn-${item.id}" class="flex flex-col items-center justify-center text-slate-400 hover:text-brand-500 py-1 flex-1">
      <i class="fa-solid ${item.icon} text-base mb-0.5"></i>
      <span class="text-[10px] font-medium">${item.label}</span>
    </button>
  `).join('');
}

// TAB SWITCHER
function switchTab(tabId) {
  currentTab = tabId;

  // Update Nav Styles
  document.querySelectorAll('#desktop-nav button').forEach(btn => {
    btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
  });
  document.querySelectorAll('#mobile-nav button').forEach(btn => {
    btn.className = 'flex flex-col items-center justify-center text-slate-400 hover:text-brand-500 py-1 flex-1';
  });

  const activeDesktopBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeDesktopBtn) {
    activeDesktopBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 shadow-md shadow-brand-500/20';
  }

  const activeMobileBtn = document.getElementById(`mnav-btn-${tabId}`);
  if (activeMobileBtn) {
    activeMobileBtn.className = 'flex flex-col items-center justify-center text-brand-500 font-bold py-1 flex-1';
  }

  // Update Title
  const titles = {
    dashboard: 'Panel Principal',
    clases: 'Clases Grupales & Reservas',
    rutinas: 'Rutinas Personalizadas',
    membresia: 'Membresias & Pagos',
    usuarios: 'Directorio de Usuarios'
  };
  document.getElementById('section-title').textContent = titles[tabId] || 'GymLife';

  // Render Dynamic View Content
  renderView(tabId);
}

// RENDER VIEWS
async function renderView(tab) {
  const container = document.getElementById('main-content');
  container.innerHTML = '<div class="flex justify-center items-center h-64"><i class="fa-solid fa-spinner fa-spin text-3xl text-brand-500"></i></div>';

  if (tab === 'dashboard') {
    renderDashboardView(container);
  } else if (tab === 'clases') {
    renderClassesView(container);
  } else if (tab === 'rutinas') {
    renderRoutinesView(container);
  } else if (tab === 'membresia') {
    renderMembershipView(container);
  } else if (tab === 'usuarios') {
    renderUsersView(container);
  }
}

// 1. DASHBOARD VIEW
async function renderDashboardView(container) {
  const classes = await GymLifeAPI.getClasses();
  const userRoutines = currentUser ? await GymLifeAPI.getRoutinesByMember(currentUser.usuarioId) : [];

  container.innerHTML = `
    <!-- Top Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-fire"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Membresia Actual</p>
          <h4 class="text-lg font-bold text-white">ACTIVA (VIP)</h4>
          <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">Al dia</span>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-dumbbell"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Rutinas Asignadas</p>
          <h4 class="text-lg font-bold text-white">${userRoutines.length} Programas</h4>
          <span class="text-[10px] text-slate-400">Ultima act: hoy</span>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-users"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Clases Disponibles</p>
          <h4 class="text-lg font-bold text-white">${classes.length} Horarios</h4>
          <span class="text-[10px] text-purple-400 font-semibold">Reserva directa</span>
        </div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-award"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Asistencias Mes</p>
          <h4 class="text-lg font-bold text-white">14 Dias</h4>
          <span class="text-[10px] text-amber-400 font-semibold">Racha +4 dias</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left Column: Proximas Clases -->
      <div class="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-calendar-check text-brand-500"></i>
            <span>Proximas Clases Grupales</span>
          </h3>
          <button onclick="switchTab('clases')" class="text-xs text-brand-400 hover:underline">Ver todas</button>
        </div>

        <div class="space-y-3">
          ${classes.slice(0, 3).map(c => `
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400">
                  <i class="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <h5 class="text-sm font-bold text-white">${c.nombre}</h5>
                  <p class="text-xs text-slate-400"><i class="fa-regular fa-clock mr-1"></i>${formatDate(c.horario)}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">Cupo: ${c.usuarios?.length || 0}/${c.cupoMaximo}</span>
                <button onclick="handleReserveClass(${c.idClase})" class="block mt-2 text-xs font-bold text-brand-400 hover:text-brand-300">Reservar Ahora &rarr;</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right Column: Acceso QR Rapido -->
      <div class="glass-card p-6 rounded-3xl border border-slate-800 text-center flex flex-col justify-between">
        <div>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <i class="fa-solid fa-qrcode text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-white">Tu Pase Digital</h3>
          <p class="text-xs text-slate-400 mt-1">Usa tu codigo QR para ingresar al gimnasio o registrar asistencia en clase.</p>
        </div>

        <div class="my-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center">
          <div id="dash-qrcode" class="bg-white p-2 rounded-xl"></div>
          <p class="text-[11px] font-mono text-slate-400 mt-2">GYMLIFE-ID-${currentUser?.usuarioId || 1}</p>
        </div>

        <button onclick="openQrPassModal()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-brand-500/20">
          Ampliar Codigo QR
        </button>
      </div>

    </div>
  `;

  // Render QR in dashboard card
  setTimeout(() => {
    const qrElem = document.getElementById('dash-qrcode');
    if (qrElem) {
      qrElem.innerHTML = '';
      new QRCode(qrElem, {
        text: `GYMLIFE-USER-${currentUser?.usuarioId || 1}`,
        width: 100,
        height: 100
      });
    }
  }, 100);
}

// 2. CLASSES VIEW
async function renderClassesView(container) {
  const classes = await GymLifeAPI.getClasses();

  container.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-xl font-extrabold text-white">Calendario de Clases</h2>
        <p class="text-xs text-slate-400">Reserva tu lugar en tiempo real o registra tu asistencia por QR</p>
      </div>
      ${currentUser.rol !== 'MIEMBRO' ? `
        <button onclick="openModal('modal-class')" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Nueva Clase
        </button>
      ` : ''}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${classes.map(c => `
        <div class="glass-card glass-card-hover p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">Grupal</span>
              <span class="text-xs font-semibold text-slate-400"><i class="fa-solid fa-users text-slate-500 mr-1"></i>${c.usuarios?.length || 0}/${c.cupoMaximo}</span>
            </div>
            <h4 class="text-base font-bold text-white mb-1">${c.nombre}</h4>
            <p class="text-xs text-slate-400 mb-4"><i class="fa-regular fa-clock text-slate-500 mr-1.5"></i>${formatDate(c.horario)}</p>
          </div>

          <div class="space-y-2 pt-3 border-t border-slate-800">
            <button onclick="handleReserveClass(${c.idClase})" class="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow">
              Reservar Cupo
            </button>
            <button onclick="handleMarkAttendance(${c.idClase})" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 transition-all">
              <i class="fa-solid fa-qrcode mr-1"></i> Registrar Asistencia QR
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 3. ROUTINES VIEW
async function renderRoutinesView(container) {
  const routines = await GymLifeAPI.getRoutinesByMember(currentUser.usuarioId);

  container.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-xl font-extrabold text-white">Rutinas de Entrenamiento</h2>
        <p class="text-xs text-slate-400">Planes estructurados por tu entrenador personal</p>
      </div>
      ${currentUser.rol !== 'MIEMBRO' ? `
        <button onclick="openModal('modal-routine')" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Asignar Rutina
        </button>
      ` : ''}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${routines.map(r => `
        <div class="glass-card p-6 rounded-3xl border border-slate-800 relative">
          <div class="flex items-start justify-between">
            <div>
              <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2 inline-block">${r.nivel || 'General'}</span>
              <h3 class="text-lg font-bold text-white">${r.nombre}</h3>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-slate-300"><i class="fa-regular fa-clock text-brand-500 mr-1"></i>${r.duracion || 45} min</span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Coach: <strong class="text-slate-200">${r.entrenador?.nombre || 'Carlos Entrenador'}</strong></span>
            <button class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg font-bold text-xs">Ver Ejercicios</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 4. MEMBERSHIP VIEW
async function renderMembershipView(container) {
  const memberships = await GymLifeAPI.getMembershipsByUser(currentUser.usuarioId);

  container.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-xl font-extrabold text-white">Membresias y Estado Financiero</h2>
        <p class="text-xs text-slate-400">Consulta de vigencia y registro de pagos</p>
      </div>
      <button onclick="openModal('modal-payment')" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2">
        <i class="fa-solid fa-credit-card"></i> Registrar Pago
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 glass-card p-6 rounded-3xl border border-slate-800">
        <h3 class="text-sm font-bold text-white mb-4">Estado de Membresia</h3>
        ${memberships.map(m => `
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-3">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-bold text-white text-base">${m.tipo}</h4>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${m.estado}</span>
            </div>
            <p class="text-xs text-slate-400">Desde: <strong class="text-slate-300">${m.fechaInicio}</strong></p>
            <p class="text-xs text-slate-400">Hasta: <strong class="text-slate-300">${m.fechaFin}</strong></p>
          </div>
        `).join('')}
      </div>

      <div class="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800">
        <h3 class="text-sm font-bold text-white mb-4">Historial Reciente de Pagos</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th class="p-3">ID Pago</th>
                <th class="p-3">Monto</th>
                <th class="p-3">Metodo</th>
                <th class="p-3">Fecha</th>
                <th class="p-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr>
                <td class="p-3 font-mono">#PAG-001</td>
                <td class="p-3 font-bold text-white">$49.99</td>
                <td class="p-3">TARJETA</td>
                <td class="p-3">2025-05-01</td>
                <td class="p-3"><span class="text-emerald-400 font-bold">Completado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 5. USERS DIRECTORY VIEW (ADMIN)
async function renderUsersView(container) {
  const users = await GymLifeAPI.getUsers();

  container.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-xl font-extrabold text-white">Directorio de Usuarios</h2>
        <p class="text-xs text-slate-400">Administración de atletas, entrenadores y staff</p>
      </div>
    </div>

    <div class="glass-card p-6 rounded-3xl border border-slate-800">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th class="p-3">ID</th>
              <th class="p-3">Nombre</th>
              <th class="p-3">Correo</th>
              <th class="p-3">Rol</th>
              <th class="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${users.map(u => `
              <tr>
                <td class="p-3 font-mono text-slate-500">#${u.idUsuario}</td>
                <td class="p-3 font-bold text-white">${u.nombre}</td>
                <td class="p-3 text-slate-400">${u.email}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-brand-400 border border-slate-700">${u.rol}</span></td>
                <td class="p-3">
                  <button onclick="handleAssignMembership(${u.idUsuario})" class="px-2.5 py-1 bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-lg text-[10px] font-bold hover:bg-brand-600/30">
                    Asignar Membresia
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// AUTH HANDLERS
function switchAuthTab(type) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  if (type === 'login') {
    loginTab.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white transition-all shadow';
    regTab.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regTab.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white transition-all shadow';
    loginTab.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function fillDemoUser(role) {
  if (role === 'MIEMBRO') {
    document.getElementById('login-email').value = 'juan.perez@example.com';
  } else if (role === 'ENTRENADOR') {
    document.getElementById('login-email').value = 'carlos.coach@example.com';
  } else {
    document.getElementById('login-email').value = 'admin@gymlife.com';
  }
  document.getElementById('login-password').value = 'password123';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;

  try {
    const res = await GymLifeAPI.login(email, pass);
    currentUser = {
      usuarioId: res.usuarioId,
      nombre: res.nombre,
      rol: res.rol
    };
    localStorage.setItem('gymlife_user', JSON.stringify(currentUser));
    document.getElementById('auth-screen').classList.add('hidden');
    showToast(`¡Bienvenido/a, ${currentUser.nombre}!`, 'success');
    initUserView();
  } catch (err) {
    showToast(err.message || 'Credenciales incorrectas. Verifique su correo y contraseña.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const passwordHash = document.getElementById('reg-password').value;
  const rol = document.getElementById('reg-rol').value;

  try {
    const user = await GymLifeAPI.register({ nombre, email, passwordHash, rol });
    showToast('Usuario registrado con exito. Ahora inicia sesion.', 'success');
    switchAuthTab('login');
  } catch (err) {
    showToast('Error al registrar usuario', 'error');
  }
}

function logout() {
  localStorage.removeItem('gymlife_user');
  currentUser = null;
  document.getElementById('auth-screen').classList.remove('hidden');
}

// ACTION HANDLERS
async function handleReserveClass(claseId) {
  try {
    await GymLifeAPI.reserveClass(claseId, currentUser.usuarioId);
    showToast('Cupo reservado con exito', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast('No se pudo reservar el cupo', 'error');
  }
}

async function handleMarkAttendance(claseId) {
  const qrCode = `GYMLIFE-PASS-USER-${currentUser.usuarioId}`;
  
  try {
    // Intentar registrar la asistencia con el pase QR del usuario
    await GymLifeAPI.registerAttendance(claseId, currentUser.usuarioId, qrCode);
    
    // Mostrar modal visual de confirmación con éxito
    showQrSuccessModal(`¡Asistencia Confirmada por QR!`, `Se ha validado el pase digital de ${currentUser.nombre} para esta clase.`);
  } catch (err) {
    const errorMsg = err.message || '';
    
    // Si la razón del fallo es que no tenía reserva previa
    if (errorMsg.includes('no tiene reserva')) {
      if (confirm('Para registrar asistencia por QR primero debes tener un cupo reservado. ¿Deseas reservar tu cupo automáticamente e ingresar ahora?')) {
        try {
          await GymLifeAPI.reserveClass(claseId, currentUser.usuarioId);
          await GymLifeAPI.registerAttendance(claseId, currentUser.usuarioId, qrCode);
          showQrSuccessModal(`¡Reserva y Asistencia Confirmadas!`, `Se asignó el cupo e ingresaste exitosamente mediante el pase QR.`);
          renderView(currentTab);
        } catch (reserveErr) {
          showToast(reserveErr.message || 'Error al procesar la reserva con QR', 'error');
        }
      }
    } else {
      showToast(errorMsg || 'Error al validar el código QR', 'error');
    }
  }
}

function showQrSuccessModal(title, detail) {
  const modalHtml = `
    <div id="qr-success-modal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-card w-full max-w-sm p-6 rounded-3xl border border-emerald-500/40 text-center relative shadow-2xl animate-bounce-once">
        <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">${title}</h3>
        <p class="text-xs text-slate-300 mb-4">${detail}</p>
        <div class="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 mb-4">
          CODIGO QR: GYMLIFE-PASS-USER-${currentUser.usuarioId}
        </div>
        <button onclick="document.getElementById('qr-success-modal').remove()" class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600">
          Entendido / Continuar
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitPaymentForm(e) {
  e.preventDefault();
  const membershipId = document.getElementById('pay-membership-id').value;
  const monto = document.getElementById('pay-amount').value;
  const metodoPago = document.getElementById('pay-method').value;

  try {
    await GymLifeAPI.registerPayment(membershipId, {
      monto,
      metodoPago,
      fecha: new Date().toISOString()
    });
    closeModal('modal-payment');
    showToast('Pago registrado correctamente', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast('Error al procesar el pago', 'error');
  }
}

async function submitClassForm(e) {
  e.preventDefault();
  const nombre = document.getElementById('class-nombre').value;
  const horario = document.getElementById('class-horario').value;
  const cupoMaximo = document.getElementById('class-cupo').value;

  try {
    await GymLifeAPI.createClass({ nombre, horario, cupoMaximo });
    closeModal('modal-class');
    showToast('Clase grupal creada', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast('Error al crear la clase', 'error');
  }
}

async function submitRoutineForm(e) {
  e.preventDefault();
  const miembroId = document.getElementById('routine-miembro-id').value;
  const nombre = document.getElementById('routine-nombre').value;
  const nivel = document.getElementById('routine-nivel').value;
  const duracion = document.getElementById('routine-duracion').value;

  try {
    await GymLifeAPI.createRoutine(currentUser.usuarioId, miembroId, { nombre, nivel, duracion });
    closeModal('modal-routine');
    showToast('Rutina asignada al miembro', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast('Error al asignar la rutina', 'error');
  }
}

async function handleAssignMembership(userId) {
  try {
    await GymLifeAPI.createMembership(userId, {
      tipo: 'Mensual Gold',
      fechaInicio: '2025-05-01',
      fechaFin: '2025-06-01',
      estado: 'ACTIVA'
    });
    showToast(`Membresia asignada al usuario #${userId}`, 'success');
  } catch (err) {
    showToast('Error al asignar membresia', 'error');
  }
}

// MODAL UTILS
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function openQrPassModal() {
  document.getElementById('qr-modal').classList.remove('hidden');
  const qrContainer = document.getElementById('qrcode-canvas');
  qrContainer.innerHTML = '';
  const text = `GYMLIFE-PASS-${currentUser?.usuarioId || 1}`;
  document.getElementById('qr-code-text').textContent = text;
  new QRCode(qrContainer, {
    text: text,
    width: 160,
    height: 160
  });
}

function closeQrPassModal() {
  document.getElementById('qr-modal').classList.add('hidden');
}

// TOAST NOTIFICATIONS
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';

  toast.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center justify-between border border-white/10 transition-all transform translate-y-2 pointer-events-auto`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-3 text-white/80 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// DATE FORMATTER
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}
