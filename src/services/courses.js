const queries = require("../db/queries");
const { validateCourse } = require("../validators/course-validator");
const { validateActive } = require("../validators/common");

function failure(errores) {
  return { valido: false, errores };
}

function create(db, input) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const courseInput = { ...input, credits: Number(input.credits) };
  const validation = validateCourse(courseInput);
  if (!validation.valido) return validation;

  const course = {
    code: input.code.trim(),
    name: input.name.trim(),
    credits: courseInput.credits,
    ...(input.active === undefined ? {} : { active: Number(input.active) }),
  };

  if (queries.courses.findByCode(db, course.code)) {
    return failure(["Ya existe una asignatura con ese código."]);
  }

  try {
    return { valido: true, errores: [], dato: queries.courses.create(db, course) };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return failure(["Ya existe una asignatura con ese código."]);
    }
    throw error;
  }
}

function list(db) {
  return queries.courses.list(db);
}

function listActive(db) {
  return queries.courses.listActive(db);
}

function findById(db, id) {
  return queries.courses.findById(db, id);
}

function setActive(db, id, active) {
  const errores = [];
  validateActive(active, errores);
  if (errores.length) return failure(errores);
  return { valido: true, errores: [], cambios: queries.courses.setActive(db, id, Number(active)) };
}

module.exports = { create, list, listActive, findById, setActive };
