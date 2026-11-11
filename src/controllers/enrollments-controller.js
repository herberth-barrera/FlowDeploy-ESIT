const enrollmentsService = require("../services/enrollments");
const rules = require("../config/business-rules").academicPeriod;

function renderEnrollments(res, options = {}) {
  const db = res.app.locals.db;

  res.status(options.status || 200).render("enrollments", {
    title: "Inscripciones",
    enrollments: enrollmentsService.list(db),
    students: enrollmentsService.listActiveStudents(db),
    courses: enrollmentsService.listActiveCourses(db),
    enrollment: options.enrollment || {},
    errores: options.errores || [],
    successMessage: options.successMessage || "",
    yearMin: rules.yearMin,
    yearMax: rules.yearMax,
    terms: rules.terms,
  });
}

function list(req, res) {
  const successMessage = req.query.created === "1"
    ? "Inscripción registrada correctamente."
    : "";

  renderEnrollments(res, { successMessage });
}

function create(req, res) {
  const result = enrollmentsService.create(res.app.locals.db, req.body);
  if (!result.valido) {
    return renderEnrollments(res, {
      status: 400,
      enrollment: req.body,
      errores: result.errores,
    });
  }

  return res.redirect(303, "/enrollments?created=1");
}

module.exports = { list, create };
