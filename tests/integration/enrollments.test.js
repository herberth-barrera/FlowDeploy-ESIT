const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createApp } = require("../../src/app");
const { createDatabase } = require("../../src/db/connection");
const studentsService = require("../../src/services/students");
const coursesService = require("../../src/services/courses");
const enrollmentsService = require("../../src/services/enrollments");

async function startTestApp(t) {
  const directory = fs.mkdtempSync(path.join(__dirname, "../../work/nova-enrollments-test-"));
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

function createStudent(db, overrides = {}) {
  return studentsService.create(db, {
    name: "Ana López",
    email: "ana@example.edu",
    major: "Matemáticas",
    ...overrides,
  }).dato;
}

function createCourse(db, overrides = {}) {
  return coursesService.create(db, {
    code: "MAT101",
    name: "Matemáticas I",
    credits: 4,
    ...overrides,
  }).dato;
}

function formData(studentId, courseId) {
  return new URLSearchParams({
    student_id: String(studentId),
    course_id: String(courseId),
    year: "2026",
    term: "2",
  });
}

test("GET /enrollments lista los datos y ofrece solo estudiantes y asignaturas activos", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const student = createStudent(app.locals.db);
  const inactiveStudent = createStudent(app.locals.db, {
    name: "Luis García",
    email: "luis@example.edu",
  });
  const course = createCourse(app.locals.db);
  const inactiveCourse = createCourse(app.locals.db, {
    code: "BIO101",
    name: "Biología general",
  });
  studentsService.setActive(app.locals.db, inactiveStudent.id, 0);
  coursesService.setActive(app.locals.db, inactiveCourse.id, 0);
  enrollmentsService.create(app.locals.db, {
    student_id: student.id,
    course_id: course.id,
    year: 2026,
    term: 2,
  });

  const response = await fetch(`${baseUrl}/enrollments`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Ana López/);
  assert.match(html, /MAT101/);
  assert.match(html, /2026/);
  assert.match(html, />2</);
  assert.doesNotMatch(html, /Luis García/);
  assert.doesNotMatch(html, /BIO101/);
});

test("POST /enrollments registra una inscripción válida", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const student = createStudent(app.locals.db);
  const course = createCourse(app.locals.db);

  const response = await fetch(`${baseUrl}/enrollments`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formData(student.id, course.id),
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/enrollments?created=1");
  assert.equal(enrollmentsService.list(app.locals.db).length, 1);
});

test("POST /enrollments responde 400 con cuerpo vacío o campos ausentes", async (t) => {
  const { baseUrl } = await startTestApp(t);
  for (const body of ["", new URLSearchParams({ year: "2026", term: "1" })]) {
    const response = await fetch(`${baseUrl}/enrollments`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    assert.equal(response.status, 400);
  }
});

test("POST /enrollments rechaza una inscripción duplicada sin crear otro registro", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const student = createStudent(app.locals.db);
  const course = createCourse(app.locals.db);
  const data = formData(student.id, course.id);

  await fetch(`${baseUrl}/enrollments`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: data,
  });
  const response = await fetch(`${baseUrl}/enrollments`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: data,
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /ya está inscrito/);
  assert.equal(enrollmentsService.list(app.locals.db).length, 1);
});

test("POST /enrollments rechaza estudiantes y asignaturas inactivos", async (t) => {
  const { app, baseUrl } = await startTestApp(t);
  const inactiveStudent = createStudent(app.locals.db);
  const inactiveCourse = createCourse(app.locals.db);
  studentsService.setActive(app.locals.db, inactiveStudent.id, 0);
  coursesService.setActive(app.locals.db, inactiveCourse.id, 0);

  const studentResponse = await fetch(`${baseUrl}/enrollments`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formData(inactiveStudent.id, inactiveCourse.id),
  });
  const studentHtml = await studentResponse.text();

  assert.equal(studentResponse.status, 400);
  assert.match(studentHtml, /estudiante está inactivo/);

  const activeStudent = createStudent(app.locals.db, {
    name: "María Pérez",
    email: "maria@example.edu",
  });
  const courseResponse = await fetch(`${baseUrl}/enrollments`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formData(activeStudent.id, inactiveCourse.id),
  });
  const courseHtml = await courseResponse.text();

  assert.equal(courseResponse.status, 400);
  assert.match(courseHtml, /asignatura está inactiva/);
  assert.equal(enrollmentsService.list(app.locals.db).length, 0);
});
