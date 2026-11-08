# Nova Campus

Aplicación de gestión académica para registrar estudiantes, administrar asignaturas y gestionar inscripciones por año y ciclo académico.

![Node.js 22 LTS](https://img.shields.io/badge/Node.js-22%20LTS-417E38)

[Inicio rápido](#inicio-rápido) · [Configuración](#configuración) · [Comandos](#comandos) · [Rutas](#rutas) · [Reglas de negocio](#reglas-de-negocio) · [Arquitectura](#arquitectura)

<!--
Cuando tengas una captura del panel, guárdala en docs/img/dashboard.png
y mueve la siguiente línea fuera de este comentario.

![Panel principal de Nova Campus con datos de ejemplo](docs/img/dashboard.png)
-->

## Inicio rápido

Se requiere **Node.js 22 LTS** con npm. Ejecuta los siguientes comandos desde la raíz del proyecto.

### 1. Instalar las dependencias

```sh
npm ci
```

### 2. Crear el archivo de configuración

Copia `.env.example` a `.env` con el comando correspondiente a tu sistema.

| Entorno | Comando |
| --- | --- |
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| macOS o Linux | `cp .env.example .env` |

Para la primera ejecución local puedes conservar los valores predeterminados.

### 3. Iniciar la aplicación

```sh
npm start
```

Abre el [panel de Nova Campus](http://localhost:3000) en el navegador. Si modificaste `PORT`, usa el puerto configurado.

Al iniciar, la aplicación crea automáticamente la carpeta de datos, el archivo SQLite y su esquema si todavía no existen.

> [!TIP]
> Para explorar el panel con datos de ejemplo, abre otra terminal en la raíz del proyecto y ejecuta `npm run seed`. Después, actualiza el navegador. El comando agrega cinco estudiantes, cinco asignaturas y tres inscripciones.

## Configuración

Las variables de entorno se definen en el archivo `.env`.

| Variable | Valor predeterminado | Función |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP del servidor. La aplicación escucha en `0.0.0.0`. |
| `DB_PATH` | `./data/nova-campus.db` | Ruta del archivo de la base de datos SQLite. |
| `APP_VERSION` | `dev` | Versión de la aplicación que devuelve `/version`. |
| `GIT_SHA` | `unknown` | Identificador del commit que devuelve `/version`. |

## Comandos

| Comando | Acción |
| --- | --- |
| `npm start` | Inicia la aplicación. |
| `npm run dev` | Inicia el servidor en modo de desarrollo con reinicio automático. |
| `npm run lint` | Analiza el código con ESLint. |
| `npm test` | Ejecuta las pruebas unitarias y de integración con `node:test`. |
| `npm run smoke` | Inicia la aplicación con una base temporal y comprueba que respondan `/health` y el panel principal (`/`). |
| `npm run seed` | Agrega estudiantes, asignaturas e inscripciones de ejemplo. |
| `npm run reset` | Elimina la base de datos configurada y la vuelve a crear vacía. |

> [!WARNING]
> Antes de ejecutar `npm run reset`, verifica el valor de `DB_PATH`. El comando elimina todos los datos de esa base.

## Rutas

| Área | Método | Ruta | Acción |
| --- | --- | --- | --- |
| Panel | `GET` | `/` | Muestra el panel principal. |
| Estudiantes | `GET` | `/students` | Muestra el listado de estudiantes y el formulario de registro. |
| Estudiantes | `POST` | `/students` | Registra un estudiante. |
| Estudiantes | `POST` | `/students/:id/toggle` | Activa o desactiva un estudiante. |
| Asignaturas | `GET` | `/courses` | Muestra el listado de asignaturas y el formulario de registro. |
| Asignaturas | `POST` | `/courses` | Registra una asignatura. |
| Asignaturas | `POST` | `/courses/:id/toggle` | Activa o desactiva una asignatura. |
| Inscripciones | `GET` | `/enrollments` | Muestra el listado y el formulario de inscripción. |
| Inscripciones | `POST` | `/enrollments` | Registra una inscripción. |
| Servicio | `GET` | `/health` | Permite comprobar que el servicio responde. |
| Servicio | `GET` | `/version` | Devuelve la versión y el commit configurados. |

## Reglas de negocio

El servidor valida los datos recibidos en cada registro. Los formularios también aplican restricciones HTML.

| Entidad | Reglas de validación |
| --- | --- |
| Estudiante | El nombre debe tener entre 2 y 100 caracteres y la carrera entre 2 y 80. El correo debe ser válido y único. |
| Asignatura | El código debe ser único y tener entre 2 y 12 caracteres. El nombre debe tener entre 2 y 100 caracteres. Los créditos deben ser un número entero de 1 a 10. |
| Período académico | El año debe estar entre 2020 y 2100, ambos inclusive. Se admiten los ciclos 1 y 2. |
| Inscripción | El estudiante y la asignatura deben existir y estar activos. Un estudiante solo puede inscribirse una vez en la misma asignatura dentro del mismo año y ciclo. |

Al desactivar un estudiante o una asignatura, el sistema conserva su registro y lo excluye de las opciones para nuevas inscripciones.

Los límites del período académico se definen en `src/config/business-rules.js`.

## Arquitectura

Nova Campus funciona como un **monolito modular** en un solo proceso de Node.js. Express gestiona las rutas HTTP, EJS genera las vistas y SQLite almacena los datos.

```text
src/
├── app.js          Configuración de Express, importable sin abrir un puerto
├── server.js       Arranque del servidor HTTP
├── config/         Límites de las reglas de negocio
├── controllers/    Controladores de rutas
├── db/             Conexión, esquema y consultas SQL
├── public/         Hojas de estilo y recursos estáticos
├── routes/         Definición de rutas de Express
├── services/       Reglas de negocio y acceso a datos
├── validators/     Funciones puras de validación
└── views/          Plantillas EJS
tests/
├── unit/           Pruebas unitarias
└── integration/    Pruebas de integración
scripts/            Carga de datos, reinicio de la base y prueba de arranque
```

### Almacenamiento y despliegue

El archivo `.gitignore` excluye los archivos `.db`, `.db-shm` y `.db-wal` del control de versiones.

Si el proveedor de alojamiento utiliza un disco efímero, la base SQLite puede perderse al reiniciar o volver a desplegar la aplicación. Para conservar los registros entre despliegues, verifica que el proveedor ofrezca almacenamiento persistente y configura `DB_PATH` dentro de ese espacio.
