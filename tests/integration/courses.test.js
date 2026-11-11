const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createApp } = require("../../src/app");
const { createDatabase } = require("../../src/db/connection");
const coursesService = require("../../src/services/courses");

async function startTestApp(t) {
  const directory = fs.mkdtempSync(path.join(__dirname, "../../work/nova-courses-test-"));
  const db = createDatabase(path.join(directory, "test.db"));
  const app = createApp({ db });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => {
      db.close();
      fs.rmSync(directory, { recursive: true, force: true });
      if (error) reject(error);
      else resolve();
    });
  }));

  return { app, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

const mathCourse = { code: "MAT101", name: "Matemáticas I", credits: "4" };

test("GET /courses muestra el formulario y la tabla vacía", async (t) => {
  const { baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/courses`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Registrar asignatura/);
  assert.match(html, /Aún no hay asignaturas registradas/);
});

test("POST /courses registra una asignatura válida", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/courses`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(mathCourse),
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/courses?created=1");
  assert.equal(coursesService.list(app.locals.db).length, 1);
});

test("POST /courses muestra error 400 cuando el código está duplicado", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  coursesService.create(app.locals.db, { ...mathCourse, credits: 4 });

  const response = await fetch(`${baseUrl}/courses`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...mathCourse, name: "Otra materia" }),
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /Ya existe una asignatura/);
  assert.match(html, /value="Otra materia"/);
  assert.equal(coursesService.list(app.locals.db).length, 1);
});

test("POST /courses rechaza créditos fuera del rango y conserva los datos", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/courses`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...mathCourse, credits: "11" }),
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /créditos deben ser un número entero entre 1 y 10/);
  assert.match(html, /value="11"/);
  assert.equal(coursesService.list(app.locals.db).length, 0);
});

test("POST /courses responde 400 con cuerpo vacío o campos ausentes", async (t) => {
  const { baseUrl } = await startTestApp(t);
  for (const body of ["", new URLSearchParams({ credits: "3" })]) {
    const response = await fetch(`${baseUrl}/courses`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    assert.equal(response.status, 400);
  }
});

test("POST /courses/:id/toggle cambia el estado activo", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const created = coursesService.create(app.locals.db, { ...mathCourse, credits: 4 }).dato;
  const response = await fetch(`${baseUrl}/courses/${created.id}/toggle`, {
    method: "POST",
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(coursesService.findById(app.locals.db, created.id).active, 0);

  const reactivation = await fetch(`${baseUrl}/courses/${created.id}/toggle`, {
    method: "POST",
    redirect: "manual",
  });
  assert.equal(reactivation.status, 303);
  assert.equal(coursesService.findById(app.locals.db, created.id).active, 1);
});
