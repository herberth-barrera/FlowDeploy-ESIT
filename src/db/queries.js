function createStudent(db, student) {
  const result = db.prepare(
    "INSERT INTO students (name, email, major, active) VALUES (@name, @email, @major, @active)",
  ).run({ active: 1, ...student });
  return findStudentById(db, result.lastInsertRowid);
}

function listStudents(db) {
  return db.prepare("SELECT * FROM students ORDER BY name").all();
}

function listActiveStudents(db) {
  return db.prepare("SELECT * FROM students WHERE active = 1 ORDER BY name").all();
}

function findStudentById(db, id) {
  return db.prepare("SELECT * FROM students WHERE id = ?").get(id);
}

function findStudentByEmail(db, email) {
  return db.prepare("SELECT * FROM students WHERE email = ?").get(email);
}

function setStudentActive(db, id, active) {
  return db.prepare("UPDATE students SET active = ? WHERE id = ?").run(Number(active), id).changes;
}

function createCourse(db, course) {
  const result = db.prepare(
    "INSERT INTO courses (code, name, credits, active) VALUES (@code, @name, @credits, @active)",
  ).run({ active: 1, ...course });
  return findCourseById(db, result.lastInsertRowid);
}

function listCourses(db) {
  return db.prepare("SELECT * FROM courses ORDER BY code").all();
}

function listActiveCourses(db) {
  return db.prepare("SELECT * FROM courses WHERE active = 1 ORDER BY code").all();
}

function findCourseById(db, id) {
  return db.prepare("SELECT * FROM courses WHERE id = ?").get(id);
}

function findCourseByCode(db, code) {
  return db.prepare("SELECT * FROM courses WHERE code = ?").get(code);
}

function setCourseActive(db, id, active) {
  return db.prepare("UPDATE courses SET active = ? WHERE id = ?").run(Number(active), id).changes;
}

function createEnrollment(db, enrollment) {
  const result = db.prepare(
    "INSERT INTO enrollments (student_id, course_id, year, term) VALUES (@student_id, @course_id, @year, @term)",
  ).run(enrollment);
  return findEnrollmentById(db, result.lastInsertRowid);
}

function listEnrollments(db) {
  return db.prepare(
    `SELECT enrollments.*, students.name AS student_name, courses.code AS course_code
     FROM enrollments
     JOIN students ON students.id = enrollments.student_id
     JOIN courses ON courses.id = enrollments.course_id
     ORDER BY enrollments.year, enrollments.term, enrollments.id`,
  ).all();
}

function findEnrollmentById(db, id) {
  return db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id);
}

function findEnrollmentByStudentCoursePeriod(db, enrollment) {
  return db.prepare(
    "SELECT * FROM enrollments WHERE student_id = @student_id AND course_id = @course_id AND year = @year AND term = @term",
  ).get(enrollment);
}

module.exports = {
  students: {
    create: createStudent,
    list: listStudents,
    listActive: listActiveStudents,
    findById: findStudentById,
    findByEmail: findStudentByEmail,
    setActive: setStudentActive,
  },
  courses: {
    create: createCourse,
    list: listCourses,
    listActive: listActiveCourses,
    findById: findCourseById,
    findByCode: findCourseByCode,
    setActive: setCourseActive,
  },
  enrollments: {
    create: createEnrollment,
    list: listEnrollments,
    findById: findEnrollmentById,
    findByStudentCoursePeriod: findEnrollmentByStudentCoursePeriod,
  },
};
