const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateStudent } = require("../../src/validators/student-validator");
const { validateCourse } = require("../../src/validators/course-validator");
const { validateAcademicPeriod } = require("../../src/validators/academic-period-validator");

const validStudent = { name: "Ana", email: "ana@example.edu", major: "Matemáticas" };
const validCourse = { code: "MAT101", name: "Matemáticas I", credits: 4 };

test("valida el nombre de estudiante desde el límite mínimo de dos caracteres", () => {
  assert.equal(validateStudent({ ...validStudent, name: "A" }).valido, false);
  assert.deepEqual(validateStudent({ ...validStudent, name: "Li" }), { valido: true, errores: [] });
});

test("rechaza correos malformados", () => {
  for (const email of [
    "correo-invalido",
    "ana@b..com",
    ".ana@example.com",
    "ana.@example.com",
    "ana@.example.com",
    "ana@example.com.",
    "ana @example.com",
    "ana@example .com",
  ]) {
    const result = validateStudent({ ...validStudent, email });
    assert.equal(result.valido, false, `${email} debería rechazarse`);
    assert.match(result.errores[0], /correo electrónico válido/);
  }
});

test("valida los límites de créditos 1 y 10, y rechaza 0 y 11", () => {
  for (const credits of [1, 10]) {
    assert.equal(validateCourse({ ...validCourse, credits }).valido, true);
  }
  for (const credits of [0, 11]) {
    assert.equal(validateCourse({ ...validCourse, credits }).valido, false);
  }
});

test("valida el año mínimo 2020 y rechaza 2019", () => {
  assert.equal(validateAcademicPeriod({ year: 2019, term: 1 }).valido, false);
  assert.equal(validateAcademicPeriod({ year: 2020, term: 1 }).valido, true);
});

test("valida el límite superior del año académico", () => {
  assert.equal(validateAcademicPeriod({ year: 2100, term: 1 }).valido, true);
  assert.equal(validateAcademicPeriod({ year: 2101, term: 1 }).valido, false);
});

test("valida límites superiores de longitud de estudiante y asignatura", () => {
  assert.equal(validateStudent({
    ...validStudent,
    name: "N".repeat(100),
    major: "C".repeat(80),
  }).valido, true);
  assert.equal(validateStudent({ ...validStudent, name: "N".repeat(101) }).valido, false);
  assert.equal(validateStudent({ ...validStudent, major: "C".repeat(81) }).valido, false);

  assert.equal(validateCourse({
    ...validCourse,
    code: "C".repeat(12),
    name: "N".repeat(100),
  }).valido, true);
  assert.equal(validateCourse({ ...validCourse, code: "C".repeat(13) }).valido, false);
  assert.equal(validateCourse({ ...validCourse, name: "N".repeat(101) }).valido, false);
});

test("rechaza el ciclo académico 3", () => {
  const result = validateAcademicPeriod({ year: 2026, term: 3 });

  assert.equal(result.valido, false);
  assert.match(result.errores[0], /ciclo académico debe ser 1 o 2/);
});
