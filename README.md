# Nova Campus

Aplicación universitaria pequeña para gestión académica, construida como monolito modular en un solo proceso con Node.js, Express, EJS y SQLite.

## Requisitos

- Node.js 22 LTS
- npm incluido con Node.js

## Instalación y configuración

```sh
npm ci
```

Copia `.env.example` a `.env` y ajusta los valores según el entorno. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```sh
cp .env.example .env
```

La base de datos y su esquema se crean automáticamente al iniciar la aplicación. La carpeta indicada por `DB_PATH` se crea si todavía no existe.

## Variables de entorno

| Variable | Uso | Valor predeterminado |
| --- | --- | --- |
| `PORT` | Puerto HTTP; la app escucha en `0.0.0.0` | `3000` |
| `DB_PATH` | Ruta del archivo SQLite | `./data/nova-campus.db` |
| `APP_VERSION` | Versión reportada por `/version` | `dev` |
| `GIT_SHA` | Commit reportado por `/version` | `unknown` |

## Comandos

| Comando | Acción |
| --- | --- |
| `npm start` | Inicia la aplicación |
| `npm run dev` | Inicia en modo desarrollo con reinicio automático |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta las pruebas con el runner nativo `node:test` |
| `npm run seed` | Agrega cinco estudiantes, cinco asignaturas y tres inscripciones de ejemplo |
| `npm run reset` | Borra la base configurada y la crea nuevamente vacía |
| `npm run smoke` | Inicia la app con una base temporal y comprueba `/health` y `/` |

## Rutas

| Método y ruta | Descripción |
| --- | --- |
| `GET /` | Panel principal |
| `GET /students` | Lista y formulario de estudiantes |
| `POST /students` | Registra un estudiante |
| `POST /students/:id/toggle` | Activa o desactiva un estudiante |
| `GET /courses` | Lista y formulario de asignaturas |
| `POST /courses` | Registra una asignatura |
| `POST /courses/:id/toggle` | Activa o desactiva una asignatura |
| `GET /enrollments` | Lista y formulario de inscripciones |
| `POST /enrollments` | Registra una inscripción |
| `GET /health` | Comprueba que el servicio responde |
| `GET /version` | Muestra versión y commit configurados |

## Reglas de negocio

- El nombre del estudiante debe tener entre 2 y 100 caracteres; el correo debe ser válido y único; la carrera debe tener entre 2 y 80 caracteres.
- El código de asignatura debe tener entre 2 y 12 caracteres y ser único; el nombre debe tener entre 2 y 100 caracteres; los créditos deben ser un entero de 1 a 10.
- Estudiantes y asignaturas conservan sus registros al desactivarse. Los registros inactivos no se ofrecen para nuevas inscripciones.
- El período académico acepta años entre 2020 y 2100 y ciclos 1 o 2. Estos límites están centralizados en `src/config/business-rules.js`.
- Una inscripción requiere estudiante y asignatura existentes y activos. No se permite repetir estudiante, asignatura, año y ciclo.
- Los datos se validan en el servidor aunque el formulario también aplique restricciones HTML.

## Estructura

```text
src/
  app.js                 Configuración de Express, importable sin abrir puerto
  server.js              Arranque HTTP y puerto
  config/                Límites de las reglas de negocio
  controllers/           Controladores de rutas
  db/                    Esquema, conexión y consultas SQL
  public/                CSS y recursos estáticos
  routes/                Rutas Express
  services/              Reglas de negocio y acceso a datos
  validators/            Validadores puros
  views/                 Plantillas EJS
tests/
  unit/                  Pruebas unitarias
  integration/           Pruebas de integración
scripts/                 Seed, reset y smoke test
```

Los archivos `.db`, `.db-shm` y `.db-wal` están excluidos por `.gitignore`. En algunos servicios de hosting gratuito, el disco local es efímero o no persistente: la base SQLite puede perderse al reiniciar o desplegar la aplicación. Para esos entornos debe confirmarse que el proveedor ofrece almacenamiento persistente.
