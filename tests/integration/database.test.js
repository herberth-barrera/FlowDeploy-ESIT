const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createDatabase } = require("../../src/db/connection");
const queries = require("../../src/db/queries");

const temporaryDirectories = [];
const testDatabases = [];

function createTestDatabase() {
  const directory = fs.mkdtempSync(path.join(__dirname, "../../work/nova-campus-test-"));
  temporaryDirectories.push(directory);
  const db = createDatabase(path.join(directory, "test.db"));
  testDatabases.push(db);
  return db;
}

afterEach(() => {
  for (const db of testDatabases.splice(0)) db.close();
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("crea y lista estudiantes y asignaturas", () => {
  const db = createTestDatabase();

  const student = queries.students.create(db, {
    name: "Ana López",
    email: "ana@example.edu",
    major: "Matemáticas",
  });
  const course = queries.courses.create(db, {
    code: "MAT101",
    name: "Matemáticas I",
    credits: 4,
  });

  assert.equal(queries.students.findById(db, student.id).name, "Ana López");
  assert.equal(queries.students.list(db).length, 1);
  assert.equal(queries.courses.findById(db, course.id).code, "MAT101");
  assert.equal(queries.courses.list(db).length, 1);
});

test("crea y lista inscripciones y rechaza una combinación repetida", () => {
  const db = createTestDatabase();
  const student = queries.students.create(db, {
    name: "Ana López",
    email: "ana@example.edu",
    major: "Matemáticas",
  });
  const course = queries.courses.create(db, {
    code: "MAT101",
    name: "Matemáticas I",
    credits: 4,
  });
  const enrollment = {
    student_id: student.id,
    course_id: course.id,
    year: 2026,
    term: 1,
  };

  const created = queries.enrollments.create(db, enrollment);

  assert.equal(queries.enrollments.findById(db, created.id).student_id, student.id);
  assert.equal(queries.enrollments.list(db).length, 1);
  assert.throws(() => queries.enrollments.create(db, enrollment), {
    code: "SQLITE_CONSTRAINT_UNIQUE",
  });
});

test("rechaza correos y códigos duplicados", () => {
  const db = createTestDatabase();

  queries.students.create(db, { name: "Ana", email: "ana@example.edu", major: "Matemáticas" });
  assert.throws(() => queries.students.create(db, {
    name: "Otra Ana",
    email: "ana@example.edu",
    major: "Biología",
  }), { code: "SQLITE_CONSTRAINT_UNIQUE" });

  queries.courses.create(db, { code: "MAT101", name: "Matemáticas I", credits: 4 });
  assert.throws(() => queries.courses.create(db, {
    code: "MAT101",
    name: "Otra materia",
    credits: 3,
  }), { code: "SQLITE_CONSTRAINT_UNIQUE" });
});

test("rechaza inscripciones con claves foráneas inexistentes", () => {
  const db = createTestDatabase();
  const course = queries.courses.create(db, { code: "MAT101", name: "Matemáticas I", credits: 4 });
  const student = queries.students.create(db, {
    name: "Ana López",
    email: "ana@example.edu",
    major: "Matemáticas",
  });

  assert.throws(() => queries.enrollments.create(db, {
    student_id: student.id + 999,
    course_id: course.id,
    year: 2026,
    term: 1,
  }), { code: "SQLITE_CONSTRAINT_FOREIGNKEY" });
  assert.throws(() => queries.enrollments.create(db, {
    student_id: student.id,
    course_id: course.id + 999,
    year: 2026,
    term: 1,
  }), { code: "SQLITE_CONSTRAINT_FOREIGNKEY" });
});
