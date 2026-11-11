const coursesService = require("../services/courses");

function renderCourses(res, options = {}) {
  const courses = coursesService.list(res.app.locals.db);

  res.status(options.status || 200).render("courses", {
    title: "Asignaturas",
    courses,
    course: options.course || {},
    errores: options.errores || [],
    successMessage: options.successMessage || "",
  });
}

function list(req, res) {
  let successMessage = "";
  if (req.query.created === "1") successMessage = "Asignatura registrada correctamente.";
  if (req.query.updated === "1") successMessage = "Estado de la asignatura actualizado.";

  renderCourses(res, { successMessage });
}

function create(req, res) {
  const result = coursesService.create(res.app.locals.db, req.body);
  if (!result.valido) {
    return renderCourses(res, {
      status: 400,
      course: req.body,
      errores: result.errores,
    });
  }

  return res.redirect(303, "/courses?created=1");
}

function toggle(req, res) {
  const db = res.app.locals.db;
  const courseId = Number(req.params.id);
  const course = coursesService.findById(db, courseId);

  if (!course) {
    return res.status(404).render("error", {
      title: "Asignatura no encontrada",
      message: "No encontramos la asignatura solicitada.",
    });
  }

  coursesService.setActive(db, courseId, course.active === 1 ? 0 : 1);
  return res.redirect(303, "/courses?updated=1");
}

module.exports = { list, create, toggle };
