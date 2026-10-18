const express = require("express");
const studentsRoutes = require("./students-routes");
const coursesRoutes = require("./courses-routes");
const enrollmentsRoutes = require("./enrollments-routes");

const router = express.Router();

router.use("/students", studentsRoutes);
router.use("/courses", coursesRoutes);
router.use("/enrollments", enrollmentsRoutes);

router.get("/", (req, res) => {
  res.render("dashboard", { title: "Inicio" });
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/version", (req, res) => {
  res.json({
    version: process.env.APP_VERSION || "dev",
    commit: process.env.GIT_SHA || "unknown",
  });
});

module.exports = router;
