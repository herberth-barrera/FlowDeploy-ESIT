require("dotenv").config();

const { createDatabase } = require("../src/db/connection");
const queries = require("../src/db/queries");
const db = createDatabase();

try {
  const addDemoData = db.transaction(() => {
    const students = [
      ["Ana López", "ana.lopez@example.edu", "Ingeniería informática"],
      ["Luis García", "luis.garcia@example.edu", "Administración"],
      ["María Pérez", "maria.perez@example.edu", "Matemáticas"],
      ["Carlos Rivera", "carlos.rivera@example.edu", "Biología"],
      ["Sofía Martínez", "sofia.martinez@example.edu", "Economía"],
    ].map(([name, email, major]) => queries.students.create(db, { name, email, major }));

    const courses = [
      ["MAT101", "Matemáticas I", 4],
      ["INF101", "Fundamentos de programación", 5],
      ["ADM101", "Introducción a la administración", 3],
      ["BIO101", "Biología general", 4],
      ["ECO101", "Principios de economía", 3],
    ].map(([code, name, credits]) => queries.courses.create(db, { code, name, credits }));

    [
      { student_id: students[0].id, course_id: courses[0].id, year: 2026, term: 1 },
      { student_id: students[0].id, course_id: courses[1].id, year: 2026, term: 1 },
      { student_id: students[1].id, course_id: courses[2].id, year: 2026, term: 1 },
    ].forEach((enrollment) => queries.enrollments.create(db, enrollment));
  });

  addDemoData();
  console.log("Datos demo agregados correctamente.");
} finally {
  db.close();
}
