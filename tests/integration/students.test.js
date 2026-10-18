const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createApp } = require("../../src/app");
const { createDatabase } = require("../../src/db/connection");
const studentsService = require("../../src/services/students");

async function startTestApp(t) {
  const directory = fs.mkdtempSync(path.join(__dirname, "../../work/nova-students-test-"));
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

const anaForm = {
  name: "Ana López",
  email: "ana.lopez@example.edu",
  major: "Ingeniería informática",
};

test("GET /students muestra el formulario y la tabla vacía", async (t) => {
  const { baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/students`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Registrar estudiante/);
  assert.match(html, /Aún no hay estudiantes registrados/);
});

test("POST /students registra un estudiante válido", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/students`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(anaForm),
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/students?created=1");
  assert.equal(studentsService.list(app.locals.db).length, 1);
});

test("POST /students muestra error 400 al repetir el correo", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  studentsService.create(app.locals.db, anaForm);

  const response = await fetch(`${baseUrl}/students`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...anaForm, name: "Ana María" }),
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /Ya existe un estudiante/);
  assert.match(html, /value="Ana María"/);
  assert.equal(studentsService.list(app.locals.db).length, 1);
});

test("POST /students muestra errores de validación y conserva los datos", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const response = await fetch(`${baseUrl}/students`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ name: "A", email: "correo", major: "" }),
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /nombre debe tener entre 2 y 100 caracteres/);
  assert.match(html, /correo electrónico válido/);
  assert.match(html, /value="A"/);
  assert.equal(studentsService.list(app.locals.db).length, 0);
});

test("POST /students responde 400 con cuerpo vacío o campos ausentes", async (t) => {
  const { baseUrl } = await startTestApp(t);
  for (const body of ["", new URLSearchParams({ name: "Ana" })]) {
    const response = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    assert.equal(response.status, 400);
  }
});

test("POST /students/:id/toggle cambia el estado activo", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const created = studentsService.create(app.locals.db, anaForm).dato;
  const response = await fetch(`${baseUrl}/students/${created.id}/toggle`, {
    method: "POST",
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(studentsService.findById(app.locals.db, created.id).active, 0);

  const reactivation = await fetch(`${baseUrl}/students/${created.id}/toggle`, {
    method: "POST",
    redirect: "manual",
  });
  assert.equal(reactivation.status, 303);
  assert.equal(studentsService.findById(app.locals.db, created.id).active, 1);
});

test("los errores inesperados muestran un mensaje genérico", async (t) => {
  const { baseUrl } = await startTestApp(t);
  const originalList = studentsService.list;
  const originalError = console.error;
  studentsService.list = () => { throw new Error("detalle secreto de prueba"); };
  console.error = () => {};

  try {
    const response = await fetch(`${baseUrl}/students`);
    const html = await response.text();
    assert.equal(response.status, 500);
    assert.match(html, /error inesperado/i);
    assert.doesNotMatch(html, /detalle secreto de prueba/);
  } finally {
    studentsService.list = originalList;
    console.error = originalError;
  }
});
