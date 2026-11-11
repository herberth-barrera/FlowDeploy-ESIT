const queries = require("../db/queries");
const { validateAcademicPeriod } = require("../validators/academic-period-validator");

function failure(errores) {
  return { valido: false, errores };
}

function create(db, input) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const enrollmentInput = {
    ...input,
    year: Number(input.year),
    term: Number(input.term),
  };
  const period = validateAcademicPeriod(enrollmentInput);
  if (!period.valido) return period;

  const student = queries.students.findById(db, input.student_id);
  if (!student) return failure(["El estudiante seleccionado no existe."]);
  if (student.active !== 1) return failure(["El estudiante está inactivo y no puede inscribirse."]);

  const course = queries.courses.findById(db, input.course_id);
  if (!course) return failure(["La asignatura seleccionada no existe."]);
  if (course.active !== 1) return failure(["La asignatura está inactiva y no admite inscripciones."]);

  const enrollment = {
    student_id: input.student_id,
    course_id: input.course_id,
    year: enrollmentInput.year,
    term: enrollmentInput.term,
  };

  if (queries.enrollments.findByStudentCoursePeriod(db, enrollment)) {
    return failure(["El estudiante ya está inscrito en esa asignatura para el período seleccionado."]);
  }

  try {
    return { valido: true, errores: [], dato: queries.enrollments.create(db, enrollment) };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return failure(["El estudiante ya está inscrito en esa asignatura para el período seleccionado."]);
    }
    throw error;
  }
}

function list(db) {
  return queries.enrollments.list(db);
}

function listActiveStudents(db) {
  return queries.students.listActive(db);
}

function listActiveCourses(db) {
  return queries.courses.listActive(db);
}

function findById(db, id) {
  return queries.enrollments.findById(db, id);
}

module.exports = { create, list, listActiveStudents, listActiveCourses, findById };
