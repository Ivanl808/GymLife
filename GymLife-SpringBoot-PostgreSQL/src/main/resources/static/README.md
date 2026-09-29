# GymLife Fitness Platform - Documentacion Tecnica y Manual de Usuario Oficial

---

## FICHA TECNICA Y CONTROL DOCUMENTAL
* **Sistema:** GymLife Platform (Gestion Integral de Gimnasios y Control de Accesos)
* **Version:** 2.0.0 Enterprise Release
* **Arquitectura:** Spring Boot 3.2.5 (Backend REST API) + MySQL 8.0+ (Persistencia Relacional) + HTML5/Tailwind/Vanilla JS (Single-Page Application SPA)
* **Especialidad:** Control de Aforo, Torniquetes Criptograficos Anti-Passback, Pasarela de Pagos Rollover, Prescripcion Deportiva y Gestion de Roster.
* **Fecha de Emision:** Septiembre 2026
* **Redactor:** Senior Business Partner (BP) & Principal Software Architect

---

## TABLA DE CONTENIDO
1. [Resumen Ejecutivo de la Plataforma](#1-resumen-ejecutivo-de-la-plataforma)
2. [Arquitectura Tecnica e Infraestructura (Manual Tecnico)](#2-arquitectura-tecnica-e-infraestructura-manual-tecnico)
   * 2.1 [Diagrama de Capas y Ecosistema de Datos](#21-diagrama-de-capas-y-ecosistema-de-datos)
   * 2.2 [Modelo de Datos ER (Relacional MySQL)](#22-modelo-de-datos-er-relacional-mysql)
   * 2.3 [Endpoints REST & Especificacion de API](#23-endpoints-rest--especificacion-de-api)
   * 2.4 [Mecanismo Criptografico QR & Algoritmo Anti-Passback](#24-mecanismo-criptografico-qr--algoritmo-anti-passback)
3. [Manual de Usuario por Rol](#3-manual-de-usuario-por-rol)
   * 3.1 [Flujo de Administrador / Gerencia (Backoffice Executive)](#31-flujo-de-administrador--gerencia-backoffice-executive)
   * 3.2 [Flujo de Entrenador Personal (Coach / Instructor)](#32-flujo-de-entrenador-personal-coach--instructor)
   * 3.3 [Flujo de Socio / Atleta (Cliente Final)](#33-flujo-de-socio--atleta-cliente-final)
4. [Guia de Despliegue e Instalacion](#4-guia-de-despliegue-e-instalacion)
5. [Glosario de Terminos](#5-glosario-de-terminos)

---

## 1. RESUMEN EJECUTIVO DE LA PLATAFORMA

**GymLife Fitness Platform** es una solucion tecnologica integral de grado empresarial disenada para la automatizacion, seguridad y monetizacion de cadenas de gimnasios y centros de entrenamiento. La plataforma resuelve los tres cuellos de botella operativos mas criticos del sector:

1. **Evasion de Pagos y Fuga de Capital:** Bloqueo automatizado de torniquetes mediante validacion estricta de vigencia en tiempo real.
2. **Transferencia Ilicita de Pases (Fraude de Acceso):** Eliminacion de IDs secuenciales reemplazandolas por Tokens **UUID v4** criptograficos e imposibles de predecir, combinados con un motor **Anti-Passback** de 15 minutos.
3. **Perdida de Dias Comprados en Renovacion:** Algoritmo de extension acumulativa (**Rollover**), sumando los dias nuevos a favor del socio si renueva antes de vencer.

---

## 2. ARQUITECTURA TECNICA E INFRAESTRUCTURA (MANUAL TECNICO)

### 2.1 Diagrama de Capas y Ecosistema de Datos

```
[ Cliente Movil / NAVEGADOR WEB (SPA) ] 
       │
       ▼ (HTTP / JSON / CORS)
[ CAPA DE CONTROLADORES REST (Spring MVC Controllers) ]
  ├── UserController (Autenticacion, Validacion QR, Anti-Passback)
  ├── ClassController (Calendario, Reservas, Aforo y Roster)
  ├── RoutineController (Prescripcion de Rutinas y Feedback)
  ├── RoutineTemplateController (Libreria de Plantillas Preset)
  └── MembershipController (Pasarela de Pagos & Historial)
       │
       ▼ (Spring Data JPA / Hibernate ORM)
[ CAPA DE SERVICIOS Y LOGICA DE NEGOCIO ]
  ├── UserService (Cifrado BCrypt, Regla Bootstrap 1er Admin)
  ├── ClassService (Validacion Anti-Empalme de Horario)
  ├── MembershipService (Algoritmo Rollover Acumulativo)
  └── EmailService (Motor Asincrono SMTP MimeMessage @Async)
       │
       ▼ (JDBC Driver)
[ BASE DE DATOS RELACIONAL (MySQL 8.0+) ]
```

### 2.2 Modelo de Datos ER (Relacional MySQL)

El esquema de base de datos `gym` utiliza el motor InnoDB con integridad referencial estricta:

```sql
-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL, -- 'ADMINISTRADOR', 'ENTRENADOR', 'MIEMBRO'
    qr_token VARCHAR(64) NOT NULL UNIQUE
);

-- Tabla: membresias
CREATE TABLE membresias (
    id_membresia BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(50) NOT NULL, -- 'ACTIVA', 'VENCIDA', 'CANCELADA'
    usuario_id BIGINT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

-- Tabla: pagos
CREATE TABLE pagos (
    id_pago BIGINT AUTO_INCREMENT PRIMARY KEY,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATETIME NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL, -- 'TARJETA', 'EFECTIVO', 'TRANSFERENCIA', 'CORTESIA'
    membresia_id BIGINT NOT NULL,
    FOREIGN KEY (membresia_id) REFERENCES membresias(id_membresia)
);

-- Tabla: clases_grupales
CREATE TABLE clases_grupales (
    id_clase BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    horario DATETIME NOT NULL,
    cupo_maximo INT NOT NULL DEFAULT 15
);

-- Tabla: reservas (Muchos a Muchos entre Clase y Usuario)
CREATE TABLE reservas (
    clase_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (clase_id, usuario_id),
    FOREIGN KEY (clase_id) REFERENCES clases_grupales(id_clase),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

-- Tabla: asistencias
CREATE TABLE asistencias (
    id_asistencia BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL,
    codigoqr VARCHAR(255) NOT NULL,
    usuario_id BIGINT NOT NULL,
    clase_id BIGINT NULL, -- NULL para acceso general por torniquete
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (clase_id) REFERENCES clases_grupales(id_clase)
);

-- Tabla: rutinas
CREATE TABLE rutinas (
    id_rutina BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nivel VARCHAR(50) NULL,
    duracion INT NULL,
    objetivo VARCHAR(255) NULL,
    frecuencia VARCHAR(255) NULL,
    instrucciones VARCHAR(2000) NULL,
    feedback_coach VARCHAR(1000) NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'EN_PROGRESO', -- 'EN_PROGRESO', 'COMPLETADA'
    entrenador_id BIGINT NOT NULL,
    miembro_id BIGINT NOT NULL,
    FOREIGN KEY (entrenador_id) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (miembro_id) REFERENCES usuarios(id_usuario)
);

-- Tabla: plantillas_rutinas
CREATE TABLE plantillas_rutinas (
    id_plantilla BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    objetivo VARCHAR(255) NULL,
    nivel VARCHAR(50) NULL,
    duracion INT NULL,
    frecuencia VARCHAR(255) NULL,
    instrucciones VARCHAR(2000) NULL,
    entrenador_id BIGINT NOT NULL,
    FOREIGN KEY (entrenador_id) REFERENCES usuarios(id_usuario)
);
```

### 2.3 Endpoints REST & Especificacion de API

#### Autenticacion y Usuarios (`/api/usuarios`)
* `POST /api/usuarios/registro`: Registra un nuevo socio (`MIEMBRO`). Si la base de datos esta en blanco (`count() == 0`), le asigna automaticamente el rol `ADMINISTRADOR`.
* `POST /api/usuarios/login`: Valida las credenciales contra la BD. Retorna `200 OK` con `{ usuarioId, nombre, rol, qrToken }` o `401 Unauthorized`.
* `GET /api/usuarios`: Devuelve el directorio completo de usuarios.
* `PUT /api/usuarios/{id}/rol`: Promueve o modifica el rol de seguridad del usuario (`MIEMBRO`, `ENTRENADOR`, `ADMINISTRADOR`).
* `POST /api/usuarios/{id}/regenerar-qr`: Invalida el token anterior, genera un nuevo UUID v4 y lo reenvia por correo electronico.

#### Control de Accesos y Torniquete (`/api/usuarios`)
* `GET /api/usuarios/validar-qr/{qrToken}`: Consulta limpia de identidad por token QR (usado por el escaner del coach sin disparar bloqueos de entrada).
* `POST /api/usuarios/registrar-entrada-torniquete/{qrToken}`: Valida vigencia de membresia, verifica Anti-Passback de 15 min, registra asistencia fisica en MySQL y ejecuta Auto Check-In de clases del dia.

#### Clases Grupales y Reservas (`/api/clases`)
* `GET /api/clases`: Listado de clases programadas con conteo de cupos.
* `POST /api/clases`: Crea una nueva clase (Restringido a Staff/Admin).
* `POST /api/clases/{claseId}/reservar/{usuarioId}`: Reserva cupo validando aforo y ejecutando filtro Anti-Empalme de horarios.
* `DELETE /api/clases/{claseId}/reservar/{usuarioId}`: Cancela reserva y libera cupo en tiempo real.
* `POST /api/clases/{claseId}/asistencia/{usuarioId}?codigoQR={qr}`: Confirma la asistencia en sala.
* `GET /api/clases/asistencias/clase/{claseId}`: Devuelve los asistentes confirmados en sala.

#### Rutinas y Prescripcion Deportiva (`/api/rutinas`)
* `GET /api/rutinas/miembro/{miembroId}`: Rutinas asignadas a un socio especifico.
* `GET /api/rutinas/entrenador/{entrenadorId}`: Rutinas creadas por un coach para sus atletas.
* `POST /api/rutinas/entrenador/{entrenadorId}/miembro/{miembroId}`: Crea y asigna una rutina con aviso por email.
* `PUT /api/rutinas/{id}/completar`: Cambia el estado de la rutina a `COMPLETADA`.
* `PUT /api/rutinas/{id}/feedback`: Registra la evaluacion tecnica del coach sobre el avance del socio.
* `DELETE /api/rutinas/{id}`: Elimina la rutina de la BD.

#### Plantillas de Rutinas (`/api/plantillas-rutinas`)
* `GET /api/plantillas-rutinas/entrenador/{entrenadorId}`: Devuelve la biblioteca de plantillas preset del coach.
* `POST /api/plantillas-rutinas/entrenador/{entrenadorId}`: Guarda una plantilla maestro reutilizable.

#### Membresias y Pasarela de Pagos (`/api/membresias`)
* `GET /api/membresias/usuario/{usuarioId}`: Historial de planes del socio.
* `POST /api/membresias/usuario/{usuarioId}`: Asigna/Renueva un plan incursionando logica acumulativa (Rollover).
* `POST /api/membresias/{membershipId}/pagos`: Registra el pago en la tabla `pagos` y notifica por email.

---

### 2.4 Mecanismo Criptografico QR & Algoritmo Anti-Passback

#### 1. Token Criptografico por Usuario
Cada usuario tiene asignado un token UUID v4 en la columna `qr_token` de MySQL:
`GYMLIFE-PASS-e4859e2-5907-4ce7-b3fc-bf30319dc235`
El QR codifica una URL unica de validacion:
`http://192.168.100.19:8080/validar-acceso.html?token=GYMLIFE-PASS-<UUID>`

#### 2. Logica Anti-Passback (15 Minutos Cooldown)
Cuando el torniquete lee un codigo QR:
1. El backend busca la ultima asistencia registrada para `usuario_id` en la tabla `asistencias`.
2. Calcula la diferencia entre la hora actual y la hora de la ultima entrada.
3. Si transcurrieron menos de 15 minutos, el servidor responde `HTTP 403 Forbidden` bloqueando el paso y notificando en la pantalla del torniquete los minutos restantes de espera.

---

## 3. MANUAL DE USUARIO POR ROL

---

### 3.1 Flujo de Administrador / Gerencia (Backoffice Executive)

#### Paso 1: Inicializacion del Sistema (Base de Datos en Blanco)
1. Abrir la URL publica del sistema: `http://localhost:8080/`.
2. Hacer clic en la pestana **"Registrarse"**.
3. Ingresar Nombre, Correo y Contrasena.
4. Al ser el **primer usuario registrado en la base de datos en blanco**, el backend detecta la condicion de bootstrap y le otorga automaticamente el rol de **`ADMINISTRADOR`**.

#### Paso 2: Monitoreo del Panel Ejecutivo Financiero
1. Ingresar al **Dashboard Admin** (Inicio).
2. Consultar las metricas de la cabecera ejecutiva:
   * **Recaudacion Estimada ($):** Suma total de los planes vigentes cobrados.
   * **Socios Al Dia:** Conteo de clientes activos con pase libre a torniquete.
   * **Membresias Vencidas:** Conteo de socios morosos que requieren cobro.
   * **Total Atletas:** Masa de clientes registrados.

#### Paso 3: Gestion Manual de Planes y Cobranza Presencial
1. Ir al menu **"Usuarios"** (Directorio de Usuarios).
2. Localizar al socio que realizo un pago presencial en efectivo/transferencia.
3. Hacer clic en el boton **`Gestionar Plan`**.
4. Seleccionar el Plan contratado (*Mensual VIP, Trimestral Pro, Anual Black o Cortesia*) y el metodo de pago recibido.
5. Presionar **"Registrar y Activar Membresia"**. El sistema recalcula la vigencia acumulativa del socio y habilita su Pase QR al instante.

#### Paso 4: Control de Seguridad y Asignacion de Roles
1. En el Directorio de Usuarios, localizar al usuario al que se desea promover como empleado.
2. Hacer clic en el boton **`Rol`**.
3. Seleccionar el nuevo rol (`MIEMBRO`, `ENTRENADOR` o `ADMINISTRADOR`) y confirmar.
4. Si un socio pierde su dispositivo movil o requiere renovar su pase, hacer clic en **`Reenviar QR`** para emitir un nuevo UUID seguro.

---

### 3.2 Flujo de Entrenador Personal (Coach / Instructor)

#### Paso 1: Inicio de Sesion y Perfil Staff
1. Iniciar sesion con la cuenta de Entrenador.
2. El sistema otorga un **Pase de Acceso Staff VIP Ilimitado** en el torniquete.

#### Paso 2: Diseno y Asignacion de Rutinas a Atletas
1. Navegar al menu **"Rutinas"**.
2. Hacer clic en **"Asignar Rutina"** (o presionar el boton `+`).
3. **Carga desde Plantilla (Opcional):** Si el coach ya tiene plantillas guardadas, puede seleccionarlas en el desplegable *`Cargar Desde Plantilla Maestro`* para autorrellenar los campos en 1 segundo.
4. **Completar Prescripcion:**
   * **Socio Destino:** Seleccionar al alumno del menu desplegable.
   * **Nombre de la Rutina:** Ej. *Hipertrofia Espalda & Biceps*.
   * **Objetivo:** *Ganancia Muscular, Perdida de Grasa, Fuerza, etc.*
   * **Nivel y Frecuencia:** *Principiante / 4 Dias a la semana*.
   * **Estructura & Ejercicios:** Desglosar series, repeticiones e indicaciones tecnicas.
5. Presionar **"Asignar Rutina y Notificar por Correo"**. El sistema guarda la rutina en MySQL, la anade a la biblioteca de plantillas del coach y le envia un correo oficial al socio.

#### Paso 3: Seguimiento y Feedback de Rendimiento
1. En el menu **"Rutinas"**, seleccionar la pestana **`Asignadas por Mi`**.
2. Revisar el estado de las rutinas de sus alumnos (`EN PROGRESO` o `COMPLETADA`).
3. Hacer clic en el boton de dialogo **`Evaluacion del Coach`** para escribir recomendaciones de carga o correcciones tecnicas.

#### Paso 4: Pase de Lista y Control de Asistentes en Clases Dirigidas
1. Ir al menu **"Clases Dirigidas"**.
2. En la clase correspondiente a la hora actual, presionar **`Control de Asistentes`**.
3. **Metodo 1 (Manual):** Presionar **`Confirmar Asistencia`** al lado del socio presente en la sala.
4. **Metodo 2 (Escaner QR In-App):** Presionar **`Escanear QR Atleta con Camara`**, apuntar al telefono del alumno y el sistema decodificara la matriz `jsQR` a 20 FPS para confirmar la asistencia en MySQL.

---

### 3.3 Flujo de Socio / Atleta (Cliente Final)

#### Paso 1: Registro e Inicio de Sesion
1. Entrar al portal `http://localhost:8080/` y hacer clic en **"Registrarse"**.
2. Crear la cuenta de socio. Se emite automaticamente su Pase Digital QR unico.

#### Paso 2: Contratacion de Plan en Pasarela de Pago
1. Ir al menu **"Membresia"**.
2. Seleccionar el plan deseado (*Mensual VIP, Trimestral Pro o Anual Black*).
3. Completar el pago en la Pasarela de Pago Segura.
4. Al confirmarse el pago, la membresia se marca como **`ACTIVA`** y el sistema envia el comprobante oficial por correo.

#### Paso 3: Ingreso Fisico por Torniquete
1. En la parte superior del portal, presionar **"Pase QR"** (o abrir el pase enviado al email).
2. Acercar la pantalla del telefono al lector del torniquete del gimnasio (`validar-acceso.html`).
3. **Si la membresia esta activa:** La pantalla respondera **`ACCESO PERMITIDO - ¡Bienvenid@, [Nombre]!`** y el molinete abrira.
4. **Si la membresia expiro:** Respondera **`ACCESO RECHAZADO`** indicando que requiere renovacion.

#### Paso 4: Reserva de Clases y Asistencia
1. Ir a **"Clases Grupales"**.
2. Seleccionar el horario y presionar **"Reservar Cupo"**.
3. **Control Anti-Empalme:** Si el socio intenta reservar dos clases a la misma hora, el sistema bloqueara la accion indicando *"Empalme de Horario"*.
4. Si surge un imprevisto, presionar **`Cancelar`** para liberar el cupo.

#### Paso 5: Ejecucion y Finalizacion de Rutinas
1. Ir a **"Mis Rutinas"**.
2. Consultar la estructura de ejercicios prescrita por el entrenador.
3. Al finalizar de entrenar en el gimnasio, presionar **`Marcar Completada`**. La tarjeta mostrara la insignia **`COMPLETADA`** y se registrara el avance.

---

## 4. GUIA DE DESPLIEGUE E INSTALACION

### Requisitos del Sistema
* **Java Development Kit (JDK):** Version 17 o superior.
* **Base de Datos:** MySQL 8.0+ en ejecucion en `localhost:3306`.
* **Navegador Web:** Chrome, Safari, Edge o Firefox.

### Pasos de Despliegue

1. **Creacion de la Base de Datos en MySQL:**
   ```sql
   CREATE DATABASE gym;
   ```

2. **Configuracion de Credenciales (`src/main/resources/application.properties`):**
   ```properties
   spring.application.name=gymlife
   server.port=8080

   spring.datasource.url=jdbc:mysql://localhost:3306/gym?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=admin
   spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   spring.jpa.properties.hibernate.format_sql=true
   spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

   gymlife.app.base-url=http://localhost:8080
   gymlife.turnstile.cooldown-minutes=15

   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=tu-correo@gmail.com
   spring.mail.password=tu-clave-de-aplicacion
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   spring.mail.properties.mail.smtp.starttls.required=true
   ```

3. **Compilacion y Ejecucion del Proyecto (Maven):**
   ```bash
   cd GymLife-SpringBoot-PostgreSQL
   mvn clean install
   mvn spring-boot:run
   ```

---

## 5. GLOSARIO DE TERMINOS

* **Anti-Passback:** Regla de seguridad en torniquetes que impone un tiempo de espera (15 min) para evitar que dos personas usen el mismo pase QR.
* **Auto Check-In:** Mecanismo inteligente que registra la asistencia a clases grupales al momento en que el socio escanea su QR en la entrada general.
* **BCrypt:** Algoritmo criptografico de encriptacion de contrasenas con sal aleatoria.
* **Rollover (Extension Acumulativa):** Algoritmo financiero que suma los dias de un nuevo plan a favor del socio si este renueva antes de su vencimiento.
* **UUID v4:** *Universally Unique Identifier* de 128 bits utilizado para generar pases QR unicos e infalsificables.

---
*GymLife Fitness Platform - Documentacion Tecnica y Manual de Usuario Oficial.*
