const studentsService = require("../services/students");

function renderStudents(res, options = {}) {
  const students = studentsService.list(res.app.locals.db);

  res.status(options.status || 200).render("students", {
    title: "Estudiantes",
    students,
    student: options.student || {},
    errores: options.errores || [],
    successMessage: options.successMessage || "",
  });
}

function list(req, res) {
  let successMessage = "";
  if (req.query.created === "1") successMessage = "Estudiante registrado correctamente.";
  if (req.query.updated === "1") successMessage = "Estado del estudiante actualizado.";

  renderStudents(res, { successMessage });
}

function create(req, res) {
  const result = studentsService.create(res.app.locals.db, req.body);
  if (!result.valido) {
    return renderStudents(res, {
      status: 400,
      student: req.body,
      errores: result.errores,
    });
  }

  return res.redirect(303, "/students?created=1");
}

function toggle(req, res) {
  const db = res.app.locals.db;
  const studentId = Number(req.params.id);
  const student = studentsService.findById(db, studentId);

  if (!student) {
    return res.status(404).render("error", {
      title: "Estudiante no encontrado",
      message: "No encontramos el estudiante solicitado.",
    });
  }

  studentsService.setActive(db, studentId, student.active === 1 ? 0 : 1);
  return res.redirect(303, "/students?updated=1");
}

module.exports = { list, create, toggle };
