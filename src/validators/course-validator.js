const rules = require("../config/business-rules").course;
const { validateActive } = require("./common");

function validateCourse(course = {}) {
  const errores = [];
  const code = typeof course.code === "string" ? course.code.trim() : "";
  const name = typeof course.name === "string" ? course.name.trim() : "";

  if (code.length < rules.codeMin || code.length > rules.codeMax) {
    errores.push(`El código debe tener entre ${rules.codeMin} y ${rules.codeMax} caracteres.`);
  }
  if (name.length < rules.nameMin || name.length > rules.nameMax) {
    errores.push(`El nombre de la asignatura debe tener entre ${rules.nameMin} y ${rules.nameMax} caracteres.`);
  }
  if (!Number.isInteger(course.credits) || course.credits < rules.creditsMin || course.credits > rules.creditsMax) {
    errores.push(`Los créditos deben ser un número entero entre ${rules.creditsMin} y ${rules.creditsMax}.`);
  }
  validateActive(course.active, errores);

  return { valido: errores.length === 0, errores };
}

module.exports = { validateCourse };
