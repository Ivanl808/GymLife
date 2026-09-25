# GymLife Fitness Platform - Manual de Usuario y Guia del Sistema

---

## DATOS DEL DOCUMENTO
* **Sistema:** GymLife Portal - Plataforma de Gestion de Gimnasios y Centros Fitness
* **Version:** 1.0.0
* **Arquitectura:** Spring Boot (Backend REST) + PostgreSQL + HTML5 Single-Page Application (Frontend)
* **Destinatarios:** Administradores, Entrenadores y Atletas / Miembros
* **Fecha de Emision:** Septiembre 2026

---

## TABLA DE CONTENIDO
1. [Introducción](#1-introducción)
2. [Objetivo del Manual](#2-objetivo-del-manual)
3. [Alcance del Sistema](#3-alcance-del-sistema)
4. [Roles y Niveles de Acceso](#4-roles-y-niveles-de-acceso)
5. [Requisitos Previos e Instalación](#5-requisitos-previos-e-instalación)
6. [Módulos del Sistema y Flujos Operativos](#6-módulos-del-sistema-y-flujos-operativos)
   - 6.1 Acceso y Autenticación de Usuarios
   - 6.2 Administración de Usuarios y Altas
   - 6.3 Gestión de Membresías y Control Financiero (Pagos)
   - 6.4 Programación y Reserva de Clases Grupales
   - 6.5 Prescripción de Rutinas de Entrenamiento
   - 6.6 Validaciones e Ingreso por Código QR
7. [Matriz de Resolución de Problemas (Troubleshooting)](#7-matriz-de-resolución-de-problemas-troubleshooting)
8. [Glosario de Términos](#8-glosario-de-términos)

---

## 1. INTRODUCCION

**GymLife Portal** es una solucion integral de software disenada para modernizar y automatizar la gestion operativa, comercial y deportiva de gimnasios y centros de acondicionamiento fisico.

La plataforma conecta en tiempo real a la directiva del gimnasio, al cuerpo tecnico de entrenadores y a los socios o atletas a traves de una interfaz web responsiva de alto rendimiento. El sistema elimina el uso de registros en papel o tarjetas fisicas, sustituyendolos por pases digitales interactivos mediante **Codigos QR**, control automatizado de vencimiento de membresias y seguimiento digital de rutinas personalizadas.

---

## 2. OBJETIVO DEL MANUAL

El presente documento tiene como finalidad servir de **guia instructiva, tecnica y operativa** para la correcta utilizacion del sistema **GymLife Portal**.

### Objetivos Específicos:
* Guiar paso a paso a cada perfil de usuario (Administrador, Entrenador y Miembro) en la ejecucion de sus actividades diarias dentro del sistema.
* Garantizar la integridad operativa en la secuencia de procesos (registro de usuarios -> asignacion de membresia -> cobro de pagos -> reserva de clases -> ingreso por QR).
* Minimizar errores humanos en el registro de informacion financiera y control de accesos al establecimiento.

---

## 3. ALCANCE DEL SISTEMA

El alcance funcional de GymLife Portal abarca la totalidad del ciclo de vida operativo de un centro fitness, agrupado en los siguientes pilares tecnologicos:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALCANCE DE GYMLIFE PORTAL                       │
└────────────────────────────────────────────────────────────────────────┘
          │                   │                   │                   │
   ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
   │ GESTION DE  │     │ COBROS Y    │     │ CLASES Y    │     │ RUTINAS Y   │
   │ USUARIOS    │     │ MEMBRESIAS  │     │ RESERVAS    │     │ ENTRENAM'O  │
   └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
   - Registro          - Tipos de Plan     - Programación      - Prescripcion
   - Perfiles/Roles    - Vigencias         - Cupos en Vivo     - Niveles
   - Seguridad         - Cobros (Pagos)    - Pase QR           - Duracion
```

### Límites e Inclusiones del Alcance:
* **Incluido:** Control de accesos mediante QR, reservas en tiempo real, catálogo de membresías, módulo de cobranza multimetódica (Efectivo, Tarjeta, Transferencia), asignación de rutinas y panel multirol adaptativo para dispositivos móviles y de escritorio.
* **Excluido:** Integración con pasarelas de pago bancarias automatizadas de terceros (Stripe/PayPal directos, el registro actual es asistido por caja o recepción).

---

## 4. ROLES Y NIVELES DE ACCESO

El sistema implementa un esquema de **Control de Acceso Basado en Roles (RBAC)** que segmenta las vistas y permisos según el perfil del usuario autenticado:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISOS POR ROL                          │
├────────────────────────────────┬──────────────┬────────────┬───────────┤
│ Funcionalidad                  │ ADMIN / STAFF│ ENTRENADOR │  MIEMBRO  │
├────────────────────────────────┼──────────────┼────────────┼───────────┤
│ Crear / Registrar Usuarios     │      Sí      │     No     │    No     │
│ Asignar Membresías a Usuarios  │      Sí      │     No     │    No     │
│ Registrar Pagos de Membresía   │      Sí      │     No     │    No     │
│ Crear Clases Grupales          │      Sí      │     Sí     │    No     │
│ Reservar Cupo en Clase         │      Sí      │     Sí     │    Sí     │
│ Registrar Asistencia por QR    │      Sí      │     Sí     │    Sí     │
│ Asignar Rutinas a Miembros     │      No      │     Sí     │    No     │
│ Consultar Rutinas Propias      │      Sí      │     Sí     │    Sí     │
│ Generar Pase Digital QR        │      Sí      │     Sí     │    Sí     │
└────────────────────────────────┴──────────────┴────────────┴───────────┘
```

---

## 5. REQUISITOS PREVIOS E INSTALACION

Para el correcto funcionamiento del sistema en entorno local o de servidor:

### Requisitos del Entorno Servidor (Backend):
1. **Java Development Kit (JDK):** Versión 17 o superior.
2. **Motor de Base de Datos:** PostgreSQL 13+ con la base de datos `gymlife` creada.
3. **Servicio REST Active:** Proyecto Spring Boot ejecutándose en el puerto `8080` (`http://localhost:8080/api`).

### Requisitos del Cliente (Navegador Web):
1. Navegador web moderno con soporte para JavaScript ES6+: Google Chrome (recomendado), Mozilla Firefox, Microsoft Edge o Safari.
2. Conexión de red local o remota al puerto del servidor backend.

---

## 6. MODULOS DEL SISTEMA Y FLUJOS OPERATIVOS

Para asegurar una operación libre de errores, **los flujos de trabajo deben realizarse respetando el orden lógico del sistema**:

```
 [PASO 1]          [PASO 2]          [PASO 3]          [PASO 4]          [PASO 5]
Registrar   ──>    Asignar     ──>  Procesar Pago ──> Reservar Clase ──>  Escanear QR
 Usuario          Membresía          de Membresía       o Ver Rutina      en Entrada
```

---

### 6.1 ACCESO Y AUTENTICACION DE USUARIOS

#### A. Inicio de Sesión
1. Abre el navegador web e ingresa a la ruta donde se encuentra desplegado el archivo `index.html`.
2. En el formulario **"Iniciar Sesión"**, ingresa tu **Correo Electrónico** y **Contraseña**.
3. Presiona el botón **"Acceder al Portal"**.
4. **Validación de Seguridad:**
   * Si las credenciales son válidas, el sistema cargará su panel de control personalizado según su rol.
   * Si el correo o la contraseña son incorrectos, se desplegará una notificación roja de alerta: `Credenciales incorrectas. Verifique su correo y contraseña.` y el acceso será bloqueado.

#### B. Registro de Nuevas Cuentas
1. En la pantalla de autenticación, selecciona la pestaña **"Registrarse"**.
2. Diligencia los datos requeridos:
   * **Nombre Completo:** Nombre y apellido del usuario.
   * **Correo Electrónico:** Dirección única de contacto.
   * **Contraseña:** Clave de acceso segura.
   * **Rol en el Gimnasio:** Selecciona entre *Miembro / Atleta*, *Entrenador Personal* o *Administrador / Staff*.
3. Presiona **"Crear Cuenta"**.

---

### 6.2 ADMINISTRACION DE USUARIOS Y ALTAS (ROL ADMINISTRADOR)

1. Inicia sesión como usuario con rol **ADMINISTRADOR**.
2. En el menú de navegación lateral, selecciona el módulo **"Usuarios"**.
3. El sistema desplegará la tabla completa de registros con los campos: `ID`, `Nombre`, `Correo`, `Rol` y `Acciones`.
4. Este directorio permite identificar el `ID de Usuario` asignado por el sistema (ejemplo: `ID #1`), el cual será indispensable para la asignación de membresías y rutinas.

---

### 6.3 GESTION DE MEMBRESIAS Y CONTROL FINANCIERO / PAGOS

> **NOTA IMPORTANTE:** Un pago no puede ser procesado sin que el usuario tenga previamente una membresía registrada.

#### A. Asignación de Membresía a un Miembro (Paso Obligatorio Inicial)
1. Como **ADMINISTRADOR**, dirígete al módulo **"Usuarios"**.
2. Ubica al miembro al cual deseas activar su plan (ejemplo: `Juan Pérez` - ID `#1`).
3. En la columna de Acciones, presiona el botón **"Asignar Membresía"**.
4. El sistema creará automáticamente la membresía activa ligada a dicho socio y le asignará un `ID de Membresía` (ejemplo: `ID #1`).

#### B. Registro de Cobro / Pago de Membresía
1. Dirígete al módulo **"Membresías & Pagos"**.
2. Haz clic en el botón superior derecho **"Registrar Pago"**.
3. En la ventana emergente, completa la información:
   * **ID de Membresía:** Ingrese el identificador generado en el paso anterior (ejemplo: `1`).
   * **Monto ($):** Valor numérico abonado (ejemplo: `49.99`).
   * **Método de Pago:** Selecciona entre *Tarjeta de Crédito / Débito*, *Efectivo en Recepción* o *Transferencia Bancaria*.
4. Haz clic en **"Procesar Pago"**.
5. El sistema actualizará inmediatamente la vigencia del plan a estado **ACTIVA** y guardará la transacción en la base de datos.

---

### 6.4 PROGRAMACION Y RESERVA DE CLASES GRUPALES

#### A. Crear una Nueva Clase Grupal (Entrenadores y Administradores)
1. Ingrese a la sección **"Gestión Clases"** o **"Clases Grupales"**.
2. Haz clic en el botón **"+ Nueva Clase"**.
3. Completa los campos del formulario:
   * **Nombre de la Clase:** (Ejemplo: *Spinning de Alta Intensidad*, *CrossFit Funcional*).
   * **Fecha y Hora:** Selecciona la programación del calendario.
   * **Cupo Máximo:** Número límite de asistentes permitidos (Ejemplo: `15`).
4. Presiona **"Guardar Clase"**.

#### B. Reservar Cupo en una Clase (Miembros / Atletas)
1. Inicie sesión como **MIEMBRO** y acceda al módulo **"Clases Grupales"**.
2. Seleccione la clase de su interés.
3. Presione el botón **"Reservar Cupo"**.
4. El indicador numérico de cupos se actualizará en tiempo real (ejemplo: de `0/15` a `1/15`).

---

### 6.5 PRESCRIPCION DE RUTINAS DE ENTRENAMIENTO

#### A. Asignación de Rutina por el Entrenador
1. Inicie sesión con perfil **ENTRENADOR**.
2. Ingrese a la sección **"Asignar Rutinas"**.
3. Haz clic en el botón **"+ Asignar Rutina"**.
4. Diligencie el formulario técnico:
   * **ID del Miembro / Usuario:** Ingrese el número identificador del atleta (Ejemplo: `1`).
   * **Nombre de la Rutina:** (Ejemplo: *Hipertrofia Pecho & Tríceps*).
   * **Nivel:** Seleccione entre *Principiante*, *Intermedio* o *Avanzado*.
   * **Duración (min):** Tiempo estimado de la sesión (Ejemplo: `60`).
5. Haz clic en **"Asignar Rutina"**.

#### B. Consulta de Rutina por el Atleta
1. El socio ingresa con su cuenta y selecciona el módulo **"Mis Rutinas"**.
2. Visualizará de forma clara sus fichas de trabajo prescritas por su entrenador personal, con detalles de duración y nivel de exigencia.

---

### 6.6 VALIDACIONES E INGRESO POR CODIGO QR

1. En la barra superior derecha del encabezado, cualquier usuario autenticado puede presionar el botón **"Pase QR Entrada"**.
2. El sistema abrirá un lector/modal que proyecta un **Código QR exclusivo** codificado con la clave de acceso del socio (`GYMLIFE-PASS-{ID}`).
3. Este código puede ser presentado en la recepción o en el escaner del gimnasio para verificar la vigencia de la membresía y marcar asistencia presencial a las clases grupales mediante la opción **"Registrar Asistencia QR"**.

---

## 7. MATRIZ DE RESOLUCION DE PROBLEMAS (TROUBLESHOOTING)

| Síntoma / Mensaje de Error | Causa Raíz Probable | Solución Paso a Paso |
| :--- | :--- | :--- |
| **Error `404 Not Found` al registrar un pago** | Se intentó pagar una membresía inexistente o con un ID no asignado aún. | Vaya al módulo **Usuarios**, presione **Asignar Membresía** sobre el usuario para generar su ID de membresía primero, y luego registre el pago. |
| **Alerta `Credenciales incorrectas` al iniciar sesión** | El correo o contraseña no coinciden con los registros guardados en PostgreSQL. | Verifique mayúsculas y minúsculas o registre una nueva cuenta en la pestaña **Registrarse**. |
| **Servidor en "Modo Demo Interactivo" (Insignia Amarilla)** | El backend Spring Boot (`http://localhost:8080`) no está iniciado o fue detenido. | Ejecute `GymLifeApplication.java` en su IDE o consola para restablecer la conexión REST en vivo. |
| **No se pueden crear rutinas o clases** | El usuario conectado tiene rol `MIEMBRO` y no posee permisos administrativos. | Cierre sesión e ingrese con un usuario con rol `ENTRENADOR` o `ADMINISTRADOR`. |

---

## 8. GLOSARIO DE TERMINOS

* **API REST:** Interfaz de comunicación que permite al portal web intercambiar datos en tiempo real con el servidor Spring Boot.
* **CORS (Cross-Origin Resource Sharing):** Mecanismo de seguridad configurado en el servidor para autorizar las peticiones HTTP del portal web.
* **Pase Digital QR:** Código bidimensional generado en pantalla que identifica de forma única e infalsificable al socio en el establecimiento.
* **RBAC (Role-Based Access Control):** Modelo de seguridad que restringe la ejecución de acciones en la aplicación según el rol asignado al usuario.
* **SPA (Single-Page Application):** Arquitectura web de una sola página que ofrece una navegación ultra rápida sin recargar la pantalla.

---

*GymLife Fitness Platform - Documentación Oficial para Usuario Final.*
