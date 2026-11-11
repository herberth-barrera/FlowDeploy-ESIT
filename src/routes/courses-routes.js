const express = require("express");
const controller = require("../controllers/courses-controller");

const router = express.Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/:id/toggle", controller.toggle);

module.exports = router;
