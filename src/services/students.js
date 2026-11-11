const queries = require("../db/queries");
const { validateStudent } = require("../validators/student-validator");
const { validateActive } = require("../validators/common");

function failure(errores) {
  return { valido: false, errores };
}

function create(db, input) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const validation = validateStudent(input);
  if (!validation.valido) return validation;

  const student = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    major: input.major.trim(),
    ...(input.active === undefined ? {} : { active: Number(input.active) }),
  };

  if (queries.students.findByEmail(db, student.email)) {
    return failure(["Ya existe un estudiante con ese correo electrónico."]);
  }

  try {
    return { valido: true, errores: [], dato: queries.students.create(db, student) };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return failure(["Ya existe un estudiante con ese correo electrónico."]);
    }
    throw error;
  }
}

function list(db) {
  return queries.students.list(db);
}

function listActive(db) {
  return queries.students.listActive(db);
}

function findById(db, id) {
  return queries.students.findById(db, id);
}

function setActive(db, id, active) {
  const errores = [];
  validateActive(active, errores);
  if (errores.length) return failure(errores);
  return { valido: true, errores: [], cambios: queries.students.setActive(db, id, Number(active)) };
}

module.exports = { create, list, listActive, findById, setActive };
