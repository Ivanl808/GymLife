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

async function checkSession() {
  const storedUser = localStorage.getItem('gymlife_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    document.getElementById('auth-screen').classList.add('hidden');
    
    // Auto-sincronizar el usuario con la Base de Datos para asegurar que tenga su qrToken actualizado
    try {
      const users = await GymLifeAPI.getUsers();
      const me = users.find(u => u.idUsuario === currentUser.usuarioId);
      if (me && me.qrToken) {
        currentUser.qrToken = me.qrToken;
        currentUser.nombre = me.nombre;
        currentUser.rol = me.rol;
        localStorage.setItem('gymlife_user', JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn('Usando sesión local guardada');
    }

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
      { id: 'clases', label: 'Gestión Clases', icon: 'fa-calendar-plus' },
      { id: 'rutinas', label: 'Rutinas', icon: 'fa-dumbbell' },
      { id: 'membresia', label: 'Membresías & Pagos', icon: 'fa-credit-card' }
    ];
  } else if (currentUser.rol === 'ENTRENADOR') {
    navItems = [
      { id: 'dashboard', label: 'Resumen Coach', icon: 'fa-user-nurse' },
      { id: 'rutinas', label: 'Rutinas', icon: 'fa-dumbbell' },
      { id: 'clases', label: 'Clases Dirigidas', icon: 'fa-calendar-days' },
      { id: 'membresia', label: 'Membresía', icon: 'fa-id-card' }
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
  const memberships = currentUser ? await GymLifeAPI.getMembershipsByUser(currentUser.usuarioId) : [];
  const attendances = currentUser ? await GymLifeAPI.getAttendancesByUser(currentUser.usuarioId) : [];

  const isAdmin = currentUser?.rol === 'ADMINISTRADOR';
  const isStaff = currentUser?.rol === 'ADMINISTRADOR' || currentUser?.rol === 'ENTRENADOR';
  const activeMembership = memberships.find(m => m.estado === 'ACTIVA') || memberships[0];

  // Cargar datos financieros globales para Administrador
  let allUsers = [];
  let totalRevenue = 0;
  let activeMembersCount = 0;
  let expiredMembersCount = 0;

  if (isAdmin) {
    try {
      allUsers = await GymLifeAPI.getUsers();
      for (const u of allUsers) {
        if (u.rol === 'MIEMBRO') {
          const mList = await GymLifeAPI.getMembershipsByUser(u.idUsuario);
          const act = mList.find(m => m.estado === 'ACTIVA');
          if (act) {
            activeMembersCount++;
            // Sumar ingresos estimados por plan
            if (act.tipo.includes('Trimestral')) totalRevenue += 129.99;
            else if (act.tipo.includes('Anual')) totalRevenue += 399.99;
            else totalRevenue += 49.99;
          } else {
            expiredMembersCount++;
          }
        }
      }
    } catch(e) {}
  }

  container.innerHTML = `
    ${isAdmin ? `
      <!-- PANEL EJECUTIVO FINANCIERO & CONTROL GERENCIAL (ADMIN) -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-lg font-black text-white flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-emerald-400"></i>
              <span>Panel Ejecutivo de Control Financiero</span>
            </h3>
            <p class="text-xs text-slate-400">Métricas de ingresos, estado de cobranza y aforo en tiempo real</p>
          </div>
          <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Finanzas en Vivo
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- KPI 1: Recaudación -->
          <div class="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Recaudación Estimada</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                <i class="fa-solid fa-sack-dollar"></i>
              </div>
            </div>
            <h4 class="text-2xl font-black text-emerald-400">$${totalRevenue.toFixed(2)}</h4>
            <p class="text-[10px] text-slate-400 mt-1"><i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i>Ingresos por cuotas activas</p>
          </div>

          <!-- KPI 2: Socios al Día -->
          <div onclick="switchTab('usuarios')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Socios Al Día</span>
              <div class="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm">
                <i class="fa-solid fa-user-check"></i>
              </div>
            </div>
            <h4 class="text-2xl font-black text-white">${activeMembersCount}</h4>
            <p class="text-[10px] text-emerald-400 mt-1 font-bold"><i class="fa-solid fa-arrow-up mr-1"></i>Acceso a torniquete habilitado</p>
          </div>

          <!-- KPI 3: Cartera Morosa / Vencidos -->
          <div onclick="switchTab('usuarios')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Membresías Vencidas</span>
              <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
            </div>
            <h4 class="text-2xl font-black text-amber-400">${expiredMembersCount}</h4>
            <p class="text-[10px] text-amber-400 mt-1 font-semibold">Requieren cobro en recepción &rarr;</p>
          </div>

          <!-- KPI 4: Total Atletas Registrados -->
          <div onclick="switchTab('usuarios')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Atletas</span>
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">
                <i class="fa-solid fa-users"></i>
              </div>
            </div>
            <h4 class="text-2xl font-black text-white">${allUsers.filter(u => u.rol === 'MIEMBRO').length}</h4>
            <p class="text-[10px] text-purple-400 mt-1 font-semibold">Ver directorio completo &rarr;</p>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Top Stats Cards Interactivas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div onclick="switchTab('membresia')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center gap-4 cursor-pointer transition-all">
        <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-fire"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Membresia Actual</p>
          <h4 class="text-lg font-bold text-white truncate max-w-[130px]">
            ${isStaff ? 'Staff VIP' : (activeMembership ? activeMembership.tipo : 'Sin Membresia')}
          </h4>
          <span class="text-[10px] ${isStaff ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : (activeMembership && activeMembership.estado === 'ACTIVA' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20')} px-2 py-0.5 rounded-md font-semibold border">
            ${isStaff ? 'PERMANENTE' : (activeMembership ? activeMembership.estado : 'INACTIVA')}
          </span>
        </div>
      </div>

      <div onclick="switchTab('rutinas')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center gap-4 cursor-pointer transition-all">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-dumbbell"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Rutinas Asignadas</p>
          <h4 class="text-lg font-bold text-white">${userRoutines.length} ${userRoutines.length === 1 ? 'Programa' : 'Programas'}</h4>
          <span class="text-[10px] text-cyan-400 font-semibold">Ver mis rutinas &rarr;</span>
        </div>
      </div>

      <div onclick="switchTab('clases')" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center gap-4 cursor-pointer transition-all">
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-users"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Clases Disponibles</p>
          <h4 class="text-lg font-bold text-white">${classes.length} ${classes.length === 1 ? 'Horario' : 'Horarios'}</h4>
          <span class="text-[10px] text-purple-400 font-semibold">Reserva directa &rarr;</span>
        </div>
      </div>

      <div onclick="openQrPassModal()" class="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center gap-4 cursor-pointer transition-all">
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-award"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">Asistencias por QR</p>
          <h4 class="text-lg font-bold text-white">${attendances.length} ${attendances.length === 1 ? 'Registro' : 'Registros'}</h4>
          <span class="text-[10px] ${attendances.length > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}">
            ${attendances.length > 0 ? 'Validado con exito' : 'Sin ingresos registrados'}
          </span>
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
                ${c.usuarios?.some(u => u.idUsuario === currentUser?.usuarioId) ? `
                  <span class="block mt-2 text-xs font-bold text-emerald-400"><i class="fa-solid fa-circle-check"></i> Reservado</span>
                ` : `
                  <button onclick="handleReserveClass(${c.idClase})" class="block mt-2 text-xs font-bold text-brand-400 hover:text-brand-300">Reservar Ahora &rarr;</button>
                `}
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
          <p class="text-[11px] font-mono text-slate-400 mt-2" id="dash-qrcode-text">GYMLIFE-PASS-${currentUser?.qrToken || currentUser?.usuarioId || 'SECURE'}</p>
        </div>

        <button onclick="openQrPassModal()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-brand-500/20">
          Ampliar Codigo QR
        </button>
      </div>

    </div>
  `;

  // Render QR in dashboard card
  setTimeout(async () => {
    const qrElem = document.getElementById('dash-qrcode');
    if (qrElem) {
      qrElem.innerHTML = '';
      const token = (currentUser?.qrToken && currentUser.qrToken.length > 10) 
        ? currentUser.qrToken 
        : (currentUser?.usuarioId || 'SECURE');
      const cleanToken = token.startsWith('GYMLIFE-PASS-') ? token : `GYMLIFE-PASS-${token}`;
      
      let appBaseUrl = window.location.origin;
      try {
        const config = await GymLifeAPI.getConfigInfo();
        if (config?.baseUrl) appBaseUrl = config.baseUrl;
      } catch (e) {
        console.warn('Usando URL actual para QR');
      }

      const targetUrl = `${appBaseUrl}/validar-acceso.html?token=${cleanToken}`;
      
      const textElem = document.getElementById('dash-qrcode-text');
      if (textElem) textElem.textContent = cleanToken;
      new QRCode(qrElem, {
        text: targetUrl,
        width: 100,
        height: 100
      });
    }
  }, 100);
}

// 2. CLASSES VIEW
async function renderClassesView(container) {
  const classes = await GymLifeAPI.getClasses();
  const isCoach = currentUser?.rol === 'ENTRENADOR' || currentUser?.rol === 'ADMINISTRADOR';

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-extrabold text-white">${isCoach ? 'Control y Lista de Clases Dirigidas' : 'Calendario de Clases Grupales'}</h2>
        <p class="text-xs text-slate-400">${isCoach ? 'Gestiona los asistentes en sala y toma lista de reservas' : 'Reserva tu cupo en tiempo real y gestiona tus asistencias'}</p>
      </div>
      ${isCoach ? `
        <button onclick="openModal('modal-class')" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all">
          <i class="fa-solid fa-plus text-sm"></i> Programar Nueva Clase
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
            ${isCoach ? `
              <button onclick="openClassRosterModal(${c.idClase})" class="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-extrabold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-2">
                <i class="fa-solid fa-clipboard-user text-sm"></i>
                <span>Control de Asistentes (${c.usuarios?.length || 0})</span>
              </button>
            ` : ''}

            ${c.usuarios?.some(u => u.idUsuario === currentUser?.usuarioId) ? `
              <div class="flex items-center gap-2">
                <button disabled class="flex-1 py-2 bg-emerald-600/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <i class="fa-solid fa-circle-check"></i> Cupo Reservado
                </button>
                <button onclick="handleCancelReservation(${c.idClase})" class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1" title="Cancelar Reserva de Cupo">
                  <i class="fa-solid fa-xmark"></i> Cancelar
                </button>
              </div>
              <p class="text-[11px] text-center text-slate-400 mt-1 flex items-center justify-center gap-1">
                <i class="fa-solid fa-qrcode text-brand-400"></i> Presenta tu Pase QR al ingresar a la sala
              </p>
            ` : (classes.some(otra => otra.idClase !== c.idClase && otra.horario === c.horario && otra.usuarios?.some(u => u.idUsuario === currentUser?.usuarioId)) ? `
              <button disabled class="w-full py-2 bg-amber-500/10 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/20 flex items-center justify-center gap-1.5 cursor-not-allowed" title="Ya tienes otra clase reservada en este mismo horario">
                <i class="fa-solid fa-clock font-bold"></i> Empalme de Horario
              </button>
            ` : `
              <button onclick="handleReserveClass(${c.idClase})" class="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow">
                Reservar Cupo
              </button>
            `)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

let currentRoutineSubTab = 'creadas-por-mi';

// 3. ROUTINES VIEW
async function renderRoutinesView(container) {
  const isCoach = currentUser.rol === 'ENTRENADOR' || currentUser.rol === 'ADMINISTRADOR';
  const myRoutines = await GymLifeAPI.getRoutinesByMember(currentUser.usuarioId);
  const createdByMeRoutines = isCoach ? await GymLifeAPI.getRoutinesByCoach(currentUser.usuarioId) : [];
  const allRoutines = isCoach ? await GymLifeAPI.getAllRoutines() : [];

  let displayRoutines = myRoutines;
  if (isCoach) {
    if (currentRoutineSubTab === 'creadas-por-mi') {
      displayRoutines = createdByMeRoutines;
    } else if (currentRoutineSubTab === 'todas') {
      displayRoutines = allRoutines;
    } else {
      displayRoutines = myRoutines;
    }
  }

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h2 class="text-xl font-extrabold text-white">
          ${isCoach && currentRoutineSubTab === 'creadas-por-mi' 
            ? 'Rutinas Asignadas por Mí' 
            : (isCoach && currentRoutineSubTab === 'todas' ? 'Gestión Global de Rutinas' : 'Mis Rutinas Personales')}
        </h2>
        <p class="text-xs text-slate-400">
          ${isCoach && currentRoutineSubTab === 'creadas-por-mi' 
            ? 'Programas de entrenamiento diseñados por ti para tus alumnos' 
            : (isCoach && currentRoutineSubTab === 'todas' ? 'Catálogo global de todas las rutinas prescritas en el gimnasio' : 'Planes de entrenamiento personalizados asignados a tu usuario')}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        ${isCoach ? `
          <div class="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button onclick="switchRoutineSubTab('creadas-por-mi')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentRoutineSubTab === 'creadas-por-mi' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              <i class="fa-solid fa-user-check mr-1"></i> Asignadas por Mí (${createdByMeRoutines.length})
            </button>
            <button onclick="switchRoutineSubTab('mis-rutinas')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentRoutineSubTab === 'mis-rutinas' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              <i class="fa-solid fa-user mr-1"></i> Mis Rutinas (${myRoutines.length})
            </button>
            <button onclick="switchRoutineSubTab('todas')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentRoutineSubTab === 'todas' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              <i class="fa-solid fa-list mr-1"></i> Todas las del Gym (${allRoutines.length})
            </button>
          </div>
          <button onclick="openAssignRoutineModal()" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all">
            <i class="fa-solid fa-plus text-sm"></i> Asignar Rutina
          </button>
        ` : ''}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${displayRoutines.length > 0 ? displayRoutines.map(r => `
        <div class="glass-card p-6 rounded-3xl border border-slate-800 relative flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">${r.nivel || 'General'}</span>
                ${r.frecuencia ? `<span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">${r.frecuencia}</span>` : ''}
              </div>
              <span class="text-xs font-bold text-slate-300"><i class="fa-regular fa-clock text-brand-500 mr-1"></i>${r.duracion || 45} min</span>
            </div>

            <h3 class="text-xl font-bold text-white mb-2">${r.nombre}</h3>
            
            ${r.objetivo ? `
              <div class="text-xs text-brand-400 font-bold mb-3 flex items-center gap-1.5">
                <i class="fa-solid fa-bullseye"></i>
                <span>Objetivo: ${r.objetivo}</span>
              </div>
            ` : ''}

            ${r.miembro ? `
              <div class="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-user text-brand-500"></i>
                <span>Socio Asignado: <strong class="text-white">${r.miembro.nombre}</strong> (${r.miembro.email})</span>
              </div>
            ` : ''}

            ${r.instrucciones ? `
              <div class="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5 mb-3">
                <span class="font-bold text-slate-200 block text-[11px] uppercase tracking-wider text-slate-400"><i class="fa-solid fa-clipboard-list mr-1"></i>Estructura & Ejercicios:</span>
                <p class="whitespace-pre-line text-slate-300 font-mono text-[11px] leading-relaxed">${r.instrucciones}</p>
              </div>
            ` : ''}

            ${r.feedbackCoach ? `
              <div class="p-3 bg-cyan-950/30 rounded-2xl border border-cyan-500/30 text-xs text-cyan-200 space-y-1 mb-3">
                <span class="font-extrabold block text-[11px] uppercase tracking-wider text-cyan-400"><i class="fa-solid fa-comment-dots mr-1"></i>Evaluación / Feedback del Coach:</span>
                <p class="text-cyan-100 italic text-[11px]">${r.feedbackCoach}</p>
              </div>
            ` : ''}
          </div>

          <div class="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Coach Responsable: <strong class="text-slate-200">${r.entrenador?.nombre || 'Carlos Entrenador'}</strong></span>
            
            <div class="flex items-center gap-2">
              ${r.estado === 'COMPLETADA' ? `
                <span class="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-bold text-[10px] border border-blue-500/20 flex items-center gap-1">
                  <i class="fa-solid fa-circle-check"></i> COMPLETADA
                </span>
              ` : `
                <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold text-[10px] border border-emerald-500/20 flex items-center gap-1">
                  <i class="fa-solid fa-play text-[8px]"></i> EN PROGRESO
                </span>
              `}

              ${r.miembro?.idUsuario === currentUser?.usuarioId && r.estado !== 'COMPLETADA' ? `
                <button onclick="handleCompleteRoutine(${r.idRutina})" class="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] rounded-lg shadow transition-all flex items-center gap-1">
                  <i class="fa-solid fa-check"></i> Marcar Completada
                </button>
              ` : ''}

              ${(isCoach || r.entrenador?.idUsuario === currentUser?.usuarioId) ? `
                <button onclick="openCoachFeedbackModal(${r.idRutina}, '${r.nombre}')" class="p-1.5 text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors" title="Dejar Feedback o Evaluación">
                  <i class="fa-solid fa-comment-dots"></i>
                </button>
                <button onclick="handleDeleteRoutine(${r.idRutina})" class="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors" title="Eliminar Rutina">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="col-span-2 glass-card p-12 text-center rounded-3xl border border-slate-800">
          <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-2xl mx-auto mb-3">
            <i class="fa-solid fa-dumbbell"></i>
          </div>
          <h4 class="text-base font-bold text-white mb-1">
            ${currentRoutineSubTab === 'mis-rutinas' ? 'No tienes rutinas personales asignadas actualmente' : 'No se han creado rutinas globales aún'}
          </h4>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            ${isCoach ? 'Haz clic en "Asignar Rutina" para diseñar y asignar un plan a ti mismo o a cualquier socio.' : 'Tu entrenador personal te asignará un plan de entrenamiento adaptado a tus objetivos.'}
          </p>
          ${isCoach ? `
            <button onclick="openAssignRoutineModal()" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl">Asignar Primera Rutina</button>
          ` : ''}
        </div>
      `}
    </div>
  `;
}

function switchRoutineSubTab(subTab) {
  currentRoutineSubTab = subTab;
  renderView('rutinas');
}

// Plan catalog global state for checkout
let selectedPlanForCheckout = {
  tipo: 'Mensual VIP Gold',
  monto: 49.99,
  dias: 30
};

// 4. MEMBERSHIP VIEW
async function renderMembershipView(container) {
  const memberships = await GymLifeAPI.getMembershipsByUser(currentUser.usuarioId);
  const activeMembership = memberships.find(m => m.estado === 'ACTIVA') || memberships[0];

  const isStaff = currentUser.rol === 'ADMINISTRADOR' || currentUser.rol === 'ENTRENADOR';

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-extrabold text-white">Membresías & Planes Disponibles</h2>
        <p class="text-xs text-slate-400">Selecciona o renueva tu plan con pasarela de pago instantánea</p>
      </div>
    </div>

    <!-- Estado Actual de la Membresía del Usuario -->
    <div class="glass-card p-6 rounded-3xl border border-slate-800 mb-8 relative overflow-hidden">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-extrabold uppercase tracking-widest ${isStaff ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'} px-3 py-1 rounded-full border inline-block mb-2">
            ${isStaff ? 'PASE DE ACCESO STAFF / ADMIN' : 'Membresía Actual'}
          </span>
          <h3 class="text-2xl font-black text-white">
            ${isStaff 
              ? 'Membresía Ilimitada Staff VIP' 
              : (activeMembership ? activeMembership.tipo : 'Sin Membresía Activa')}
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            ${isStaff 
              ? 'Como Administrador/Staff cuentas con **Acceso Ilimitado Total y Gratuito** al gimnasio y todas las instalaciones.'
              : (activeMembership 
                  ? `Vigente desde el <strong class="text-slate-200">${activeMembership.fechaInicio}</strong> hasta el <strong class="text-emerald-400">${activeMembership.fechaFin}</strong>`
                  : 'Selecciona uno de los siguientes planes para activar tu pase de acceso al gimnasio.')}
          </p>
        </div>
        ${!isStaff && activeMembership ? `
          <button onclick="openCheckoutModal('${activeMembership.tipo}', 49.99, 30)" class="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 shrink-0">
            <i class="fa-solid fa-arrows-rotate text-sm"></i>
            <span>Renovar Este Plan ($49.99)</span>
          </button>
        ` : ''}
        ${isStaff ? `
          <button onclick="openCheckoutModal('Membresía Adicional VIP', 0.00, 365)" class="px-5 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0">
            <i class="fa-solid fa-gem text-sm"></i>
            <span>Asignarme Plan Especial Gratis</span>
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Catálogo de Planes Disponibles -->
    <h3 class="text-base font-bold text-white mb-4"><i class="fa-solid fa-gem text-brand-500 mr-2"></i>Elige Tu Plan de Entrenamiento</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      <!-- Plan 1: Mensual -->
      <div class="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative">
        <div>
          <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3 inline-block">Flexibilidad Mensual</span>
          <h4 class="text-lg font-bold text-white">Plan Mensual VIP</h4>
          <div class="my-4">
            <span class="text-3xl font-black text-white">$49.99</span>
            <span class="text-xs text-slate-400"> / mes</span>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-300 mb-6">
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Acceso ilimitado al gimnasio</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Pase Digital QR en App y Email</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Clases grupales incluidas</li>
          </ul>
        </div>
        <button onclick="openCheckoutModal('Plan Mensual VIP', 49.99, 30)" class="w-full py-2.5 bg-slate-800 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all border border-slate-700">
          Contratar Plan Mensual
        </button>
      </div>

      <!-- Plan 2: Trimestral (Recomendado) -->
      <div class="glass-card p-6 rounded-3xl border-2 border-brand-500/80 flex flex-col justify-between relative shadow-2xl shadow-brand-500/10">
        <span class="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-brand-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
          Más Popular
        </span>
        <div>
          <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 inline-block">Plan Trimestral Pro</span>
          <h4 class="text-lg font-bold text-white">Trimestral Pro (+Rutinas)</h4>
          <div class="my-4">
            <span class="text-3xl font-black text-emerald-400">$129.99</span>
            <span class="text-xs text-slate-400"> / 3 meses</span>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-300 mb-6">
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Todo lo del Plan Mensual</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Rutina personalizada con Coach</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Descuento del 15% incluido</li>
          </ul>
        </div>
        <button onclick="openCheckoutModal('Plan Trimestral Pro', 129.99, 90)" class="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20">
          Seleccionar Plan Trimestral
        </button>
      </div>

      <!-- Plan 3: Anual Black -->
      <div class="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative">
        <div>
          <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3 inline-block">VIP Anual</span>
          <h4 class="text-lg font-bold text-white">Anual Black VIP</h4>
          <div class="my-4">
            <span class="text-3xl font-black text-white">$399.99</span>
            <span class="text-xs text-slate-400"> / año</span>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-300 mb-6">
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Acceso Total las 24 Horas</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Invitado VIP Gratis 1 vez por mes</li>
            <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-400"></i> Evaluación de Nutrición semestral</li>
          </ul>
        </div>
        <button onclick="openCheckoutModal('Anual Black VIP', 399.99, 365)" class="w-full py-2.5 bg-slate-800 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all border border-slate-700">
          Contratar Plan Anual
        </button>
      </div>

    </div>

    <!-- Historial Oficial de Facturas y Pagos -->
    <div class="glass-card p-6 rounded-3xl border border-slate-800">
      <h3 class="text-sm font-bold text-white mb-4"><i class="fa-solid fa-receipt text-slate-400 mr-2"></i>Historial de Pagos y Comprobantes</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th class="p-3">ID Pago</th>
              <th class="p-3">Plan/Concepto</th>
              <th class="p-3">Monto</th>
              <th class="p-3">Método de Pago</th>
              <th class="p-3">Fecha</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${memberships.length > 0 ? memberships.map(m => `
              <tr>
                <td class="p-3 font-mono text-emerald-400">#PAG-${m.idMembresia || '101'}</td>
                <td class="p-3 font-bold text-white">${m.tipo}</td>
                <td class="p-3 font-bold text-white">$49.99</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">TARJETA CRÉDITO</span></td>
                <td class="p-3">${m.fechaInicio}</td>
                <td class="p-3"><span class="text-emerald-400 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Aprobado</span></td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" class="p-4 text-center text-slate-500">No hay pagos registrados anteriormente.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 5. USERS DIRECTORY VIEW (ADMIN)
async function renderUsersView(container) {
  const users = await GymLifeAPI.getUsers();

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-extrabold text-white">Directorio de Usuarios</h2>
        <p class="text-xs text-slate-400">Administración de atletas, entrenadores y vigencia de membresías</p>
      </div>
    </div>

    <div class="glass-card p-6 rounded-3xl border border-slate-800">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th class="p-3">ID</th>
              <th class="p-3">Socio / Usuario</th>
              <th class="p-3">Rol</th>
              <th class="p-3">Plan de Membresía</th>
              <th class="p-3">Vigencia / Tiempo Restante</th>
              <th class="p-3 text-right">Acciones de Admin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${users.map(u => {
              const esAdmin = u.rol === 'ADMINISTRADOR' || u.rol === 'ENTRENADOR';
              return `
                <tr>
                  <td class="p-3 font-mono text-slate-500">#${u.idUsuario}</td>
                  <td class="p-3">
                    <div class="font-bold text-white text-sm">${u.nombre}</div>
                    <div class="text-[11px] text-slate-400">${u.email}</div>
                  </td>
                  <td class="p-3">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${esAdmin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-brand-400 border border-slate-700'}">
                      ${u.rol}
                    </span>
                  </td>
                  <td class="p-3">
                    <div id="user-plan-title-${u.idUsuario}" class="font-semibold text-slate-300">
                      ${esAdmin 
                        ? `<span class="font-bold text-purple-300 flex items-center gap-1.5"><i class="fa-solid fa-crown text-purple-400"></i> Staff VIP Ilimitado</span>` 
                        : `<i class="fa-solid fa-circle-notch animate-spin text-brand-500 mr-1"></i>Consultando...`}
                    </div>
                  </td>
                  <td class="p-3">
                    <div id="user-status-time-${u.idUsuario}" class="text-xs">
                      ${esAdmin 
                        ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">PERMANENTE</span>` 
                        : `---`}
                    </div>
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button onclick="openAdminAssignPlanModal(${u.idUsuario}, '${u.nombre}')" class="px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 border border-brand-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5">
                        <i class="fa-solid fa-id-card"></i> Gestionar Plan
                      </button>
                      <button onclick="handleRegenerateQr(${u.idUsuario})" class="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5" title="Enviar nuevo Pase QR por correo">
                        <i class="fa-solid fa-arrows-rotate"></i> Reenviar QR
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Cargar estado de membresías y cálculo exacto de días restantes
  users.forEach(async (u) => {
    try {
      const mList = await GymLifeAPI.getMembershipsByUser(u.idUsuario);
      const planTitleElem = document.getElementById(`user-plan-title-${u.idUsuario}`);
      const timeElem = document.getElementById(`user-status-time-${u.idUsuario}`);

      // Seleccionar la membresía activa más reciente (por mayor ID o fecha de inicio)
      const act = mList
        .filter(m => m.estado === 'ACTIVA')
        .sort((a, b) => (b.idMembresia || 0) - (a.idMembresia || 0))[0];
      
      const esAdmin = u.rol === 'ADMINISTRADOR' || u.rol === 'ENTRENADOR';

      if (act && act.fechaFin) {
        const hoy = new Date();
        const fin = new Date(act.fechaFin);
        
        // Calcular días de diferencia
        const diffTiempo = fin.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diffTiempo / (1000 * 3600 * 24));

        if (planTitleElem) {
          planTitleElem.innerHTML = `<span class="font-bold text-white"><i class="fa-solid fa-gem text-emerald-400 mr-1.5"></i>${act.tipo}</span>`;
        }

        if (timeElem) {
          if (diasRestantes > 0) {
            timeElem.innerHTML = `
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVO</span>
                <span class="font-mono text-emerald-300 font-bold"><i class="fa-regular fa-clock mr-1"></i>${diasRestantes} días restantes</span>
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Vence el ${act.fechaFin}</div>
            `;
          } else if (diasRestantes === 0) {
            timeElem.innerHTML = `
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">VENCE HOY</span>
                <span class="font-mono text-amber-300 font-bold">Último día</span>
              </div>
            `;
          } else {
            timeElem.innerHTML = `
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">VENCIDO</span>
                <span class="text-red-400 font-medium">Caducó hace ${Math.abs(diasRestantes)} días</span>
              </div>
            `;
          }
        }
      } else if (!esAdmin) {
        if (planTitleElem) {
          planTitleElem.innerHTML = `<span class="text-slate-500 font-medium">Sin Plan Contratado</span>`;
        }
        if (timeElem) {
          timeElem.innerHTML = `
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">INACTIVO</span>
          `;
        }
      }
    } catch(e) {
      console.error('Error consultando membresía:', e);
    }
  });
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
  console.log('[handleLogin] Evento submit capturado correctamente');

  const emailElem = document.getElementById('login-email');
  const passElem = document.getElementById('login-password');

  if (!emailElem || !passElem) {
    console.error('Campos de login no encontrados');
    showToast('Error en formulario de autenticación', 'error');
    return;
  }

  const email = emailElem.value.trim();
  const pass = passElem.value.trim();

  if (!email || !pass) {
    showToast('Por favor ingresa correo y contraseña', 'error');
    return;
  }

  try {
    console.log(`[handleLogin] Intentando autenticar a: ${email}`);
    const res = await GymLifeAPI.login(email, pass);
    console.log('[handleLogin] Respuesta exitosa del servidor:', res);

    currentUser = {
      usuarioId: res.usuarioId,
      nombre: res.nombre,
      rol: res.rol,
      qrToken: res.qrToken
    };
    localStorage.setItem('gymlife_user', JSON.stringify(currentUser));
    document.getElementById('auth-screen').classList.add('hidden');
    showToast(`¡Bienvenid@, ${currentUser.nombre}!`, 'success');
    initUserView();
  } catch (err) {
    console.error('[handleLogin Error]:', err);
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
    showToast('¡Cupo reservado con éxito!', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'No se pudo reservar el cupo', 'error');
  }
}

async function handleCancelReservation(claseId) {
  try {
    await GymLifeAPI.cancelReservation(claseId, currentUser.usuarioId);
    showToast('Reserva de cupo cancelada. El cupo ha sido liberado.', 'info');
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'Error al cancelar la reserva', 'error');
  }
}

async function handleCompleteRoutine(rutinaId) {
  try {
    await GymLifeAPI.completeRoutine(rutinaId);
    showToast('🎉 ¡Felicidades! Has completado tu entrenamiento.', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'Error al completar la rutina', 'error');
  }
}

async function handleDeleteRoutine(rutinaId) {
  if (confirm('¿Estás seguro de que deseas eliminar esta rutina de entrenamiento?')) {
    try {
      await GymLifeAPI.deleteRoutine(rutinaId);
      showToast('Rutina eliminada correctamente.', 'info');
      renderView(currentTab);
    } catch (err) {
      showToast(err.message || 'Error al eliminar la rutina', 'error');
    }
  }
}

async function handleMarkAttendance(claseId) {
  const qrToken = currentUser.qrToken || currentUser.usuarioId;
  const qrCode = `GYMLIFE-PASS-${qrToken}`;
  
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
    <div id="qr-success-modal" class="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div class="glass-card w-full max-w-sm p-6 rounded-3xl border-2 border-emerald-500 text-center relative shadow-2xl animate-bounce-once">
        <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-emerald-500/30">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">${title}</h3>
        <p class="text-xs text-slate-300 mb-4">${detail}</p>
        <button onclick="document.getElementById('qr-success-modal').remove()" class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 transition-all">
          Entendido / Continuar
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

let jsQrVideoStream = null;
let jsQrAnimFrame = null;
let currentRosterClassId = null;

async function startCoachCameraScanner() {
  const container = document.getElementById('coach-camera-scanner-container');
  if (container) container.classList.remove('hidden');

  const video = document.getElementById('jsqr-video');
  const canvas = document.getElementById('jsqr-canvas');

  if (!video || !canvas) return;

  const canvasContext = canvas.getContext('2d', { willReadFrequently: true });

  try {
    jsQrVideoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });

    video.srcObject = jsQrVideoStream;
    video.setAttribute('playsinline', true);
    await video.play();

    function tickScanner() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        
        // Ejecutar motor de análisis de píxeles jsQR de alto rendimiento
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            console.log('[jsQR Scanner Native] ¡CÓDIGO ENCONTRADO!:', code.data);

            let cleanToken = code.data;
            if (code.data.includes('token=')) {
              cleanToken = code.data.split('token=')[1].split('&')[0];
            }
            if (cleanToken.startsWith('GYMLIFE-PASS-')) {
              cleanToken = cleanToken.substring('GYMLIFE-PASS-'.length);
            }

            stopCoachCameraScanner();

            // Buscar usuario por su QR Token
            GymLifeAPI.request(`/usuarios/validar-qr/${encodeURIComponent(cleanToken)}`).then(async (userRes) => {
              if (userRes && userRes.usuarioId) {
                // Confirmar la asistencia específica en la clase del salón
                await handleCoachMarkCheckIn(currentRosterClassId, userRes.usuarioId, userRes.nombre, userRes.qrToken || cleanToken);
              }
            }).catch(err => {
              showToast(err.message || 'Error al validar el código QR', 'error');
            });

            return; // Detener bucle tras éxito
          }
        }
      }
      jsQrAnimFrame = requestAnimationFrame(tickScanner);
    }

    jsQrAnimFrame = requestAnimationFrame(tickScanner);

  } catch (err) {
    console.error('Error iniciando cámara nativa:', err);
    showToast('No se pudo acceder a la cámara. Revisa los permisos del navegador.', 'error');
  }
}

function stopCoachCameraScanner() {
  const container = document.getElementById('coach-camera-scanner-container');
  if (container) container.classList.add('hidden');

  if (jsQrAnimFrame) {
    cancelAnimationFrame(jsQrAnimFrame);
    jsQrAnimFrame = null;
  }

  if (jsQrVideoStream) {
    jsQrVideoStream.getTracks().forEach(track => track.stop());
    jsQrVideoStream = null;
  }

  const video = document.getElementById('jsqr-video');
  if (video) video.srcObject = null;
}

// CLASS ROSTER UTILS FOR COACH
async function openClassRosterModal(claseId) {
  currentRosterClassId = claseId;
  openModal('modal-class-roster');
  const listElem = document.getElementById('roster-users-list');
  const countElem = document.getElementById('roster-class-count');
  const titleElem = document.getElementById('roster-class-title');

  if (!listElem) return;

  listElem.innerHTML = '<div class="p-4 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner animate-spin text-brand-500 mr-2"></i>Cargando lista de reservados...</div>';

  try {
    const classes = await GymLifeAPI.getClasses();
    const targetClass = classes.find(c => c.idClase === claseId);

    if (!targetClass) {
      listElem.innerHTML = '<div class="p-4 text-center text-xs text-red-400">Clase no encontrada</div>';
      return;
    }

    if (titleElem) titleElem.textContent = targetClass.nombre;
    const usuariosReservados = targetClass.usuarios || [];

    if (countElem) countElem.textContent = `${usuariosReservados.length}/${targetClass.cupoMaximo}`;

    if (usuariosReservados.length === 0) {
      listElem.innerHTML = `
        <div class="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
          <p class="text-xs text-slate-400">No hay socios reservados en esta clase aún.</p>
        </div>
      `;
      return;
    }

    // Consultar asistencias ya registradas de forma persistente en esta clase desde MySQL
    let asistenciasRegistradas = [];
    try {
      asistenciasRegistradas = await GymLifeAPI.getAttendancesByClass(claseId);
    } catch(e) {
      console.warn('Error cargando asistencias previas:', e);
    }

    listElem.innerHTML = usuariosReservados.map(u => {
      const yaConfirmado = asistenciasRegistradas.some(a => a.usuario && a.usuario.idUsuario === u.idUsuario);
      
      return `
        <div class="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between transition-all" id="roster-row-${u.idUsuario}">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-extrabold text-xs">
              ${u.nombre ? u.nombre.substring(0, 2).toUpperCase() : 'SO'}
            </div>
            <div>
              <h5 class="text-xs font-bold text-white">${u.nombre}</h5>
              <p class="text-[10px] text-slate-400">${u.email || ''}</p>
            </div>
          </div>

          <div id="roster-action-container-${u.idUsuario}">
            ${yaConfirmado ? `
              <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold text-[10px] rounded-lg flex items-center gap-1">
                <i class="fa-solid fa-circle-check text-emerald-400"></i> ASISTENCIA CONFIRMADA
              </span>
            ` : `
              <button onclick="handleCoachMarkCheckIn(${claseId}, ${u.idUsuario}, '${u.nombre}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5">
                <i class="fa-solid fa-clipboard-check"></i>
                <span>Confirmar Asistencia</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    listElem.innerHTML = '<div class="p-4 text-center text-xs text-red-400">Error al cargar la lista</div>';
  }
}

async function handleCoachMarkCheckIn(claseId, usuarioId, nombreUsuario, userQrToken = null) {
  try {
    const token = userQrToken || usuarioId;
    const qrCode = `GYMLIFE-PASS-${token}`;
    await GymLifeAPI.registerAttendance(claseId, usuarioId, qrCode);
    
    // 1. Actualizar dinámicamente la fila del socio en el Roster (Refresco Inmediato)
    const actionContainer = document.getElementById(`roster-action-container-${usuarioId}`);
    if (actionContainer) {
      actionContainer.innerHTML = `
        <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold text-[10px] rounded-lg flex items-center gap-1">
          <i class="fa-solid fa-circle-check text-emerald-400"></i> ASISTENCIA CONFIRMADA
        </span>
      `;
    }

    // 2. Refrescar el contador de asistentes en la cabecera del modal
    try {
      const classes = await GymLifeAPI.getClasses();
      const targetClass = classes.find(c => c.idClase === claseId);
      const countElem = document.getElementById('roster-class-count');
      if (targetClass && countElem) {
        countElem.textContent = `${targetClass.usuarios?.length || 0}/${targetClass.cupoMaximo}`;
      }
    } catch(e) {}

    // 3. Modal de confirmación elegante en primer plano (Frente al Roster)
    showQrSuccessModal(`¡Check-In Exitoso!`, `Se ha confirmado la asistencia en sala para **${nombreUsuario}**.`);

  } catch (err) {
    showToast(err.message || 'Error al confirmar la asistencia del socio', 'info');
  }
}

// CHECKOUT & CARD UTILS
function openCheckoutModal(planName, price, days) {
  selectedPlanForCheckout = { tipo: planName, monto: price, dias: days };
  
  document.getElementById('checkout-plan-title').textContent = planName;
  document.getElementById('checkout-plan-duration').textContent = `Vigencia: ${days} Días`;
  document.getElementById('checkout-plan-price').textContent = `$${price.toFixed(2)}`;
  document.getElementById('btn-pay-amount').textContent = `$${price.toFixed(2)}`;

  if (currentUser) {
    document.getElementById('card-holder-name').value = currentUser.nombre.toUpperCase();
  }

  openModal('modal-payment');
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '');
  val = val.substring(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatCardExp(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length >= 2) {
    input.value = val.substring(0, 2) + '/' + val.substring(2, 4);
  } else {
    input.value = val;
  }
}

async function submitPaymentForm(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-submit-payment');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Procesando Pago con el Banco...';

  try {
    const hoy = new Date();
    const fechaInicioStr = hoy.toISOString().split('T')[0];
    
    // Obtener membresías actuales para calcular extensión acumulativa (Rollover)
    let fechaBase = hoy;
    try {
      const mList = await GymLifeAPI.getMembershipsByUser(currentUser.usuarioId);
      const act = mList.find(m => m.estado === 'ACTIVA');
      if (act && act.fechaFin) {
        const finActual = new Date(act.fechaFin);
        if (finActual > hoy) {
          fechaBase = finActual; // Si aún le quedan días, sumar desde su vencimiento actual
        }
      }
    } catch (err) {}

    const fechaFin = new Date(fechaBase);
    fechaFin.setDate(fechaBase.getDate() + (selectedPlanForCheckout.dias || 30));
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    // 1. Crear / Actualizar Membresia en MySQL mediante backend
    const nuevaMembresia = await GymLifeAPI.createMembership(currentUser.usuarioId, {
      tipo: selectedPlanForCheckout.tipo,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      estado: 'ACTIVA'
    });

    // 2. Registrar el Pago en la BD
    if (nuevaMembresia && nuevaMembresia.idMembresia) {
      await GymLifeAPI.registerPayment(nuevaMembresia.idMembresia, {
        monto: selectedPlanForCheckout.monto,
        metodoPago: 'TARJETA',
        fecha: new Date().toISOString()
      });
    }

    closeModal('modal-payment');
    
    // Modal de Ticket Comprobante de Compra Exitosa
    showPaymentSuccessModal(selectedPlanForCheckout.tipo, selectedPlanForCheckout.monto, fechaFinStr);
    
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'Error al procesar la transacción bancaria', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> <span>Pagar <span id="btn-pay-amount">$${selectedPlanForCheckout.monto}</span> Seguramente</span>`;
  }
}

function showPaymentSuccessModal(planName, price, expiryDate) {
  const modalHtml = `
    <div id="payment-receipt-modal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="glass-card w-full max-w-sm p-6 rounded-3xl border border-emerald-500/40 text-center relative shadow-2xl">
        <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
          <i class="fa-solid fa-check"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">¡Pago Aprobado Exitosamente!</h3>
        <p class="text-xs text-slate-300 mb-4">Se ha activado tu suscripción y se envió tu comprobante por correo.</p>
        
        <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-left space-y-2 mb-5">
          <div class="flex justify-between text-xs"><span class="text-slate-400">Plan:</span><strong class="text-white font-bold">${planName}</strong></div>
          <div class="flex justify-between text-xs"><span class="text-slate-400">Monto Cobrado:</span><strong class="text-emerald-400 font-bold">$${price}</strong></div>
          <div class="flex justify-between text-xs"><span class="text-slate-400">Válido Hasta:</span><strong class="text-slate-200">${expiryDate}</strong></div>
          <div class="flex justify-between text-xs"><span class="text-slate-400">Estado Pase QR:</span><strong class="text-emerald-400">ACTIVADO</strong></div>
        </div>

        <button onclick="document.getElementById('payment-receipt-modal').remove()" class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20">
          Entendido / Ir al Inicio
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
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

// ROUTINE TEMPLATES & COACH FEEDBACK UTILS
let cachedCoachTemplates = [];

async function openAssignRoutineModal() {
  // Limpiar campos del formulario cada vez que se abre el modal
  if (document.getElementById('routine-nombre')) document.getElementById('routine-nombre').value = '';
  if (document.getElementById('routine-objetivo')) document.getElementById('routine-objetivo').value = 'Ganancia Muscular / Hipertrofia';
  if (document.getElementById('routine-nivel')) document.getElementById('routine-nivel').value = 'Principiante';
  if (document.getElementById('routine-duracion')) document.getElementById('routine-duracion').value = 50;
  if (document.getElementById('routine-frecuencia')) document.getElementById('routine-frecuencia').value = '3 Días / Sem';
  if (document.getElementById('routine-instrucciones')) document.getElementById('routine-instrucciones').value = '';

  openModal('modal-routine');
  const selectMember = document.getElementById('routine-miembro-id');
  const selectTemplate = document.getElementById('routine-template-select');

  if (selectMember) selectMember.innerHTML = '<option value="">Cargando socios...</option>';
  if (selectTemplate) selectTemplate.innerHTML = '<option value="">-- Diseñar manualmente desde cero --</option>';

  try {
    const users = await GymLifeAPI.getUsers();
    const socios = users.filter(u => u.rol === 'MIEMBRO' || u.idUsuario !== currentUser.usuarioId);

    if (selectMember) {
      if (socios.length === 0) {
        selectMember.innerHTML = '<option value="">No hay socios registrados</option>';
      } else {
        selectMember.innerHTML = socios.map(s => `
          <option value="${s.idUsuario}">${s.nombre} (${s.email})</option>
        `).join('');
      }
    }

    // Cargar Plantillas Maestro del Entrenador
    try {
      cachedCoachTemplates = await GymLifeAPI.getRoutineTemplates(currentUser.usuarioId);
      if (selectTemplate && cachedCoachTemplates.length > 0) {
        selectTemplate.innerHTML = '<option value="">-- Diseñar manualmente desde cero --</option>' + 
          cachedCoachTemplates.map(t => `<option value="${t.idPlantilla}">✨ ${t.nombre} (${t.nivel} - ${t.frecuencia})</option>`).join('');
      }
    } catch(e) {}

  } catch (err) {
    if (selectMember) selectMember.innerHTML = '<option value="">Error cargando socios</option>';
  }
}

function applyRoutineTemplateToForm() {
  const selectTemplate = document.getElementById('routine-template-select');
  if (!selectTemplate || !selectTemplate.value) return;

  const templateId = parseInt(selectTemplate.value);
  const template = cachedCoachTemplates.find(t => t.idPlantilla === templateId);

  if (template) {
    if (document.getElementById('routine-nombre')) document.getElementById('routine-nombre').value = template.nombre || '';
    if (document.getElementById('routine-objetivo')) document.getElementById('routine-objetivo').value = template.objetivo || 'Ganancia Muscular / Hipertrofia';
    if (document.getElementById('routine-nivel')) document.getElementById('routine-nivel').value = template.nivel || 'Principiante';
    if (document.getElementById('routine-duracion')) document.getElementById('routine-duracion').value = template.duracion || 50;
    if (document.getElementById('routine-frecuencia')) document.getElementById('routine-frecuencia').value = template.frecuencia || '3 Días / Sem';
    if (document.getElementById('routine-instrucciones')) document.getElementById('routine-instrucciones').value = template.instrucciones || '';
    showToast(`✨ Plantilla '${template.nombre}' cargada en el formulario`, 'info');
  }
}

function openCoachFeedbackModal(rutinaId, nombreRutina) {
  document.getElementById('feedback-routine-id').value = rutinaId;
  document.getElementById('feedback-routine-name').textContent = `Para: ${nombreRutina}`;
  document.getElementById('feedback-text').value = '';
  openModal('modal-coach-feedback');
}

async function submitCoachFeedbackForm(e) {
  e.preventDefault();
  const rutinaId = document.getElementById('feedback-routine-id').value;
  const feedback = document.getElementById('feedback-text').value.trim();

  const btn = document.getElementById('btn-submit-feedback');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Guardando Feedback...';
  }

  try {
    await GymLifeAPI.addCoachFeedback(rutinaId, feedback);
    closeModal('modal-coach-feedback');
    showToast('¡Feedback de rendimiento guardado correctamente!', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'Error al guardar el feedback', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Guardar Feedback de Rendimiento</span>';
    }
  }
}

async function submitRoutineForm(e) {
  e.preventDefault();
  const miembroId = document.getElementById('routine-miembro-id').value;
  const nombre = document.getElementById('routine-nombre').value;
  const objetivo = document.getElementById('routine-objetivo')?.value || 'Acondicionamiento General';
  const nivel = document.getElementById('routine-nivel').value;
  const duracion = document.getElementById('routine-duracion').value;
  const frecuencia = document.getElementById('routine-frecuencia')?.value || '3 Días / Sem';
  const instrucciones = document.getElementById('routine-instrucciones')?.value || '';

  if (!miembroId) {
    showToast('Selecciona un socio válido', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-routine');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Asignando y Notificando por Correo...';
  }

  try {
    // 1. Guardar la rutina en el miembro
    await GymLifeAPI.createRoutine(currentUser.usuarioId, miembroId, { 
      nombre, 
      objetivo, 
      nivel, 
      duracion, 
      frecuencia, 
      instrucciones 
    });

    // 2. Guardar automáticamente en la Biblioteca de Plantillas del Coach (Preset Library)
    try {
      await GymLifeAPI.saveRoutineTemplate(currentUser.usuarioId, {
        nombre,
        objetivo,
        nivel,
        duracion,
        frecuencia,
        instrucciones
      });
    } catch(e) {}

    closeModal('modal-routine');
    showToast('¡Rutina asignada y notificada por correo al socio!', 'success');
    renderView(currentTab);
  } catch (err) {
    showToast(err.message || 'Error al asignar la rutina', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Asignar Rutina y Notificar por Correo</span>';
    }
  }
}

// ADMIN MANUAL ASSIGNMENT UTILS
function openAdminAssignPlanModal(userId, nombreUsuario) {
  document.getElementById('admin-assign-user-id').value = userId;
  document.getElementById('admin-assign-user-name').textContent = `Para: ${nombreUsuario}`;
  updateAdminPlanDetails();
  openModal('modal-admin-assign-plan');
}

function updateAdminPlanDetails() {
  const select = document.getElementById('admin-assign-plan-type');
  const selectedOpt = select.options[select.selectedIndex];
  const days = selectedOpt.getAttribute('data-days') || 30;
  document.getElementById('admin-assign-duration-text').textContent = `${days} Días de Acceso`;
}

async function submitAdminAssignPlan(e) {
  e.preventDefault();
  const userId = document.getElementById('admin-assign-user-id').value;
  const selectPlan = document.getElementById('admin-assign-plan-type');
  const selectedOpt = selectPlan.options[selectPlan.selectedIndex];
  
  const planType = selectPlan.value;
  const days = parseInt(selectedOpt.getAttribute('data-days') || '30');
  const price = parseFloat(selectedOpt.getAttribute('data-price') || '0');
  const paymentMethod = document.getElementById('admin-assign-payment-method').value;

  const btn = document.getElementById('btn-submit-admin-assign');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Registrando en Sistema...';

  try {
    const hoy = new Date();
    const fechaInicioStr = hoy.toISOString().split('T')[0];
    
    // Extensión acumulativa de vigencia (Rollover) también en gestión de Admin
    let fechaBase = hoy;
    try {
      const mList = await GymLifeAPI.getMembershipsByUser(userId);
      const act = mList.find(m => m.estado === 'ACTIVA');
      if (act && act.fechaFin) {
        const finActual = new Date(act.fechaFin);
        if (finActual > hoy) {
          fechaBase = finActual; // Sumar días a partir de su vencimiento actual
        }
      }
    } catch (err) {}

    const fechaFin = new Date(fechaBase);
    fechaFin.setDate(fechaBase.getDate() + days);
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    const nuevaMembresia = await GymLifeAPI.createMembership(userId, {
      tipo: planType,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      estado: 'ACTIVA'
    });

    if (nuevaMembresia && nuevaMembresia.idMembresia) {
      // Mapear cortesía a valor enum válido
      const validPaymentMethod = paymentMethod === 'CORTESIA' ? 'EFECTIVO' : paymentMethod;
      await GymLifeAPI.registerPayment(nuevaMembresia.idMembresia, {
        monto: price,
        metodoPago: validPaymentMethod,
        fecha: new Date().toISOString()
      });
    }

    closeModal('modal-admin-assign-plan');
    showToast(`¡Plan '${planType}' registrado y activado exitosamente!`, 'success');
    renderView('usuarios');
  } catch (err) {
    showToast(err.message || 'Error al registrar la membresía', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Registrar y Activar Membresía</span>';
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
  
  const token = (currentUser?.qrToken && currentUser.qrToken.length > 10) 
    ? currentUser.qrToken 
    : (currentUser?.usuarioId || 'SECURE');
    
  const cleanToken = token.startsWith('GYMLIFE-PASS-') ? token : `GYMLIFE-PASS-${token}`;
  
  // Obtener URL Base desde application.properties (o fallback)
  let appBaseUrl = window.location.origin;
  GymLifeAPI.getConfigInfo().then(config => {
    if (config?.baseUrl) appBaseUrl = config.baseUrl;
    const targetUrl = `${appBaseUrl}/validar-acceso.html?token=${cleanToken}`;

    document.getElementById('qr-code-text').textContent = cleanToken;
    new QRCode(qrContainer, {
      text: targetUrl,
      width: 160,
      height: 160
    });
  }).catch(() => {
    const targetUrl = `${appBaseUrl}/validar-acceso.html?token=${cleanToken}`;
    document.getElementById('qr-code-text').textContent = cleanToken;
    new QRCode(qrContainer, {
      text: targetUrl,
      width: 160,
      height: 160
    });
  });
}

function closeQrPassModal() {
  document.getElementById('qr-modal').classList.add('hidden');
}

async function handleRegenerateQr(targetUserId = null) {
  const userId = targetUserId || currentUser?.usuarioId;
  if (!userId) {
    showToast('No se identificó el usuario', 'error');
    return;
  }

  const btn = document.getElementById('btn-regenerate-qr');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Regenerando...';
  }

  try {
    const response = await GymLifeAPI.regenerateQr(userId);
    const newToken = response.nuevoQrToken;

    if (!targetUserId || targetUserId === currentUser?.usuarioId) {
      if (currentUser) {
        currentUser.qrToken = newToken;
        localStorage.setItem('gymlife_user', JSON.stringify(currentUser));
      }
      openQrPassModal();
    }

    showToast('¡Nuevo código QR generado y enviado a tu correo!', 'success');
  } catch (err) {
    showToast(err.message || 'Error al regenerar código QR', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span>Regenerar QR (Seguridad)</span>';
    }
  }
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
