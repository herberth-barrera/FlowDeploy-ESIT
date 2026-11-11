const rules = require("../config/business-rules").student;
const { validateActive } = require("./common");

function validateStudent(student = {}) {
  const errores = [];
  const name = typeof student.name === "string" ? student.name.trim() : "";
  const email = typeof student.email === "string" ? student.email.trim() : "";
  const major = typeof student.major === "string" ? student.major.trim() : "";

  if (name.length < rules.nameMin || name.length > rules.nameMax) {
    errores.push(`El nombre debe tener entre ${rules.nameMin} y ${rules.nameMax} caracteres.`);
  }
  const validEmail = /^[^\s@.](?:[^\s@]*[^\s@.])?@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email);
  if (email.length > rules.emailMax || !validEmail) {
    errores.push("Ingresa un correo electrónico válido.");
  }
  if (major.length < rules.majorMin || major.length > rules.majorMax) {
    errores.push(`La carrera debe tener entre ${rules.majorMin} y ${rules.majorMax} caracteres.`);
  }
  validateActive(student.active, errores);

  return { valido: errores.length === 0, errores };
}

module.exports = { validateStudent };
