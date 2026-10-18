const rules = require("../config/business-rules").academicPeriod;

function validateAcademicPeriod(period = {}) {
  const errores = [];

  if (!Number.isInteger(period.year) || period.year < rules.yearMin || period.year > rules.yearMax) {
    errores.push(`El año debe ser un número entero entre ${rules.yearMin} y ${rules.yearMax}.`);
  }
  if (!rules.terms.includes(period.term)) {
    const terms = rules.terms.length > 1
      ? `${rules.terms.slice(0, -1).join(", ")} o ${rules.terms.at(-1)}`
      : String(rules.terms[0]);
    errores.push(`El ciclo académico debe ser ${terms}.`);
  }

  return { valido: errores.length === 0, errores };
}

module.exports = { validateAcademicPeriod };
