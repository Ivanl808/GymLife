# GymLife - Spring Boot + Maven + PostgreSQL + DBeaver

Proyecto backend basado en el modelo de análisis del proyecto GymLife/FitLife.

## Tecnologías

- Java 17
- Spring Boot 3.5.6
- Maven
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security + BCrypt
- PostgreSQL
- DBeaver
- Lombok

## 1. Crear la base de datos

Desde DBeaver, conecta tu servidor PostgreSQL y ejecuta:

CREATE DATABASE gymlife;

No necesitas crear las tablas manualmente. Hibernate las genera/actualiza
automáticamente porque se utiliza:

spring.jpa.hibernate.ddl-auto=update

## 2. Configurar PostgreSQL

Abre:

src/main/resources/application.properties

Modifica:

spring.datasource.username=postgres
spring.datasource.password=CAMBIA_ESTA_CONTRASENA

Por los datos de tu instalación de PostgreSQL.

Por defecto PostgreSQL utiliza:

Host: localhost
Puerto: 5432
Base de datos: gymlife

## 3. Importar en Eclipse

1. Descomprime el ZIP.
2. Abre Eclipse.
3. File > Import.
4. Maven > Existing Maven Projects.
5. Selecciona la carpeta GymLife-SpringBoot-PostgreSQL.
6. Finish.
7. Espera a que Maven descargue las dependencias.
8. Ejecuta GymLifeApplication.java como Spring Boot App.

## 4. Ver las tablas en DBeaver

Después de ejecutar Spring Boot por primera vez:

DBeaver
> PostgreSQL
> gymlife
> Schemas
> public
> Tables

Deberías encontrar tablas como:

- usuarios
- membresias
- pagos
- clases_grupales
- reservas
- rutinas
- asistencias

## 5. Endpoints principales

Usuarios:
POST /api/usuarios/registro
POST /api/usuarios/login
GET /api/usuarios

Membresías:
POST /api/membresias/usuario/{usuarioId}
GET /api/membresias/usuario/{usuarioId}
POST /api/membresias/{membershipId}/pagos

Clases:
POST /api/clases
GET /api/clases
POST /api/clases/{claseId}/reservar/{usuarioId}
POST /api/clases/{claseId}/asistencia/{usuarioId}?codigoQR=...

Rutinas:
POST /api/rutinas/entrenador/{entrenadorId}/miembro/{miembroId}
GET /api/rutinas/miembro/{miembroId}

## 6. Flujo de prueba recomendado

1. Crear un usuario.
2. Crear una membresía para ese usuario.
3. Registrar un pago.
4. Crear una clase grupal.
5. Reservar la clase.
6. Registrar la asistencia.
7. Crear una rutina para el miembro.
8. Consultar la información desde DBeaver.

## Nota

Esta versión adapta el backend original a Spring Boot + Maven + PostgreSQL.
DBeaver funciona como cliente de administración de PostgreSQL; no forma parte
de las dependencias de Maven.
