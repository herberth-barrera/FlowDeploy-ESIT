const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("../../src/db/connection");
const studentsService = require("../../src/services/students");
const coursesService = require("../../src/services/courses");
const enrollmentsService = require("../../src/services/enrollments");

function setup(t) {
  const db = createDatabase(":memory:");
  t.after(() => db.close());
  return db;
}

function addAnaAndMath(db) {
  const student = studentsService.create(db, {
    name: "Ana López",
    email: "ana@example.edu",
    major: "Matemáticas",
  }).dato;
  const course = coursesService.create(db, {
    code: "MAT101",
    name: "Matemáticas I",
    credits: 4,
  }).dato;

  return { student, course };
}

test("rechaza correo duplicado con un mensaje claro", (t) => {
  const db = setup(t);
  const input = { name: "Ana", email: "ana@example.edu", major: "Matemáticas" };

  assert.equal(studentsService.create(db, input).valido, true);
  const result = studentsService.create(db, { ...input, name: "Ana López" });

  assert.equal(result.valido, false);
  assert.match(result.errores[0], /Ya existe un estudiante/);
  assert.equal(studentsService.list(db).length, 1);
});

test("rechaza código de asignatura duplicado con un mensaje claro", (t) => {
  const db = setup(t);
  const input = { code: "MAT101", name: "Matemáticas I", credits: 4 };

  assert.equal(coursesService.create(db, input).valido, true);
  const result = coursesService.create(db, { ...input, name: "Otra matemática" });

  assert.equal(result.valido, false);
  assert.match(result.errores[0], /Ya existe una asignatura/);
  assert.equal(coursesService.list(db).length, 1);
});

test("rechaza una segunda inscripción de Ana López en MAT101 en 2026, ciclo 2", (t) => {
  const db = setup(t);
  const { student, course } = addAnaAndMath(db);
  const enrollment = {
    student_id: student.id,
    course_id: course.id,
    year: 2026,
    term: 2,
  };

  assert.equal(enrollmentsService.create(db, enrollment).valido, true);
  const secondAttempt = enrollmentsService.create(db, enrollment);

  assert.equal(secondAttempt.valido, false);
  assert.match(secondAttempt.errores[0], /ya está inscrito/);
  assert.equal(enrollmentsService.list(db).length, 1);
});

test("rechaza inscripciones de un estudiante inactivo", (t) => {
  const db = setup(t);
  const { student, course } = addAnaAndMath(db);
  studentsService.setActive(db, student.id, 0);

  const result = enrollmentsService.create(db, {
    student_id: student.id,
    course_id: course.id,
    year: 2026,
    term: 1,
  });

  assert.equal(result.valido, false);
  assert.match(result.errores[0], /estudiante está inactivo/);
  assert.equal(enrollmentsService.list(db).length, 0);
});

test("rechaza inscripciones en una asignatura inactiva", (t) => {
  const db = setup(t);
  const { student, course } = addAnaAndMath(db);
  coursesService.setActive(db, course.id, 0);

  const result = enrollmentsService.create(db, {
    student_id: student.id,
    course_id: course.id,
    year: 2026,
    term: 1,
  });

  assert.equal(result.valido, false);
  assert.match(result.errores[0], /asignatura está inactiva/);
  assert.equal(enrollmentsService.list(db).length, 0);
});

test("rechaza estudiantes y asignaturas inexistentes", (t) => {
  const db = setup(t);
  const { student, course } = addAnaAndMath(db);

  const missingStudent = enrollmentsService.create(db, {
    student_id: student.id + 1,
    course_id: course.id,
    year: 2026,
    term: 1,
  });
  const missingCourse = enrollmentsService.create(db, {
    student_id: student.id,
    course_id: course.id + 1,
    year: 2026,
    term: 1,
  });

  assert.match(missingStudent.errores[0], /estudiante seleccionado no existe/);
  assert.match(missingCourse.errores[0], /asignatura seleccionada no existe/);
  assert.equal(enrollmentsService.list(db).length, 0);
});

test("los servicios convierten entradas ausentes o no objeto en errores de validación", (t) => {
  const db = setup(t);
  for (const input of [undefined, null, "no es objeto", []]) {
    assert.equal(studentsService.create(db, input).valido, false);
    assert.equal(coursesService.create(db, input).valido, false);
    assert.equal(enrollmentsService.create(db, input).valido, false);
  }
});
