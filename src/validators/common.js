function validateActive(active, errores) {
  if (active !== undefined && ![0, 1, false, true].includes(active)) {
    errores.push("El estado debe ser activo o inactivo.");
  }
}

module.exports = { validateActive };
